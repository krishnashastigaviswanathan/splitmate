import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMemberBalances, simplifyDebts } from "@/lib/debtSimplification";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { groupId } = params;

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied. You are not a member of this group." }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, upiId: true } },
          },
        },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true, email: true, upiId: true } },
            splits: {
              include: {
                user: { select: { id: true, name: true, email: true, upiId: true } },
              },
            },
            comments: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { expenseDate: "desc" },
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true, email: true, upiId: true } },
            toUser: { select: { id: true, name: true, email: true, upiId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const membersList = group.members.map((m) => m.user);
    const balanceMap = calculateMemberBalances(membersList, group.expenses, group.settlements);
    const simplifiedTransactions = simplifyDebts(balanceMap);

    const memberBalancesArray = Array.from(balanceMap.values());
    const currentUserBalance = balanceMap.get(userId)?.netBalance || 0;

    // Calculate current month statistics
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthExpenses = group.expenses.filter((e) => {
      const d = new Date(e.expenseDate);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyGoal = group.monthlyGoal || 0;
    const isOverBudget = monthlyGoal > 0 ? currentMonthTotal > monthlyGoal : false;
    const overBudgetAmount = isOverBudget ? currentMonthTotal - monthlyGoal : 0;
    const goalPercentage = monthlyGoal > 0 ? Math.min(Math.round((currentMonthTotal / monthlyGoal) * 100), 999) : 0;

    // Calculate split per person monthly
    const memberCount = Math.max(1, membersList.length);
    const averagePerPersonMonthly = Math.round(currentMonthTotal / memberCount);

    const memberMonthlyShares: Record<string, { id: string; name: string; amount: number }> = {};
    for (const m of membersList) {
      memberMonthlyShares[m.id] = { id: m.id, name: m.name, amount: 0 };
    }
    for (const e of currentMonthExpenses) {
      for (const s of e.splits) {
        if (memberMonthlyShares[s.userId]) {
          memberMonthlyShares[s.userId].amount += s.amount;
        }
      }
    }

    // Recurring expenses
    const recurringExpenses = group.expenses.filter((e) => e.isRecurring);

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        emoji: group.emoji,
        currency: group.currency,
        monthlyGoal: group.monthlyGoal,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
      },
      members: membersList,
      memberBalances: memberBalancesArray,
      currentUserBalance,
      simplifiedTransactions,
      expenses: group.expenses,
      settlements: group.settlements,
      recurringExpenses,
      budgetStats: {
        currentMonthTotal,
        monthlyGoal,
        isOverBudget,
        overBudgetAmount,
        goalPercentage,
        memberCount,
        averagePerPersonMonthly,
        memberMonthlyShares: Object.values(memberMonthlyShares),
      },
    });
  } catch (error) {
    console.error("GET /api/groups/[groupId] error:", error);
    return NextResponse.json({ error: "Failed to load group details" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { groupId } = params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, emoji, currency, monthlyGoal } = body;

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(emoji ? { emoji: emoji.trim() } : {}),
        ...(currency ? { currency: currency.trim() } : {}),
        monthlyGoal: monthlyGoal !== undefined ? (monthlyGoal ? Math.round(Number(monthlyGoal)) : null) : undefined,
      },
    });

    return NextResponse.json({ group: updated });
  } catch (error) {
    console.error("PUT /api/groups/[groupId] error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
