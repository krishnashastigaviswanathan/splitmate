import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMemberBalances } from "@/lib/debtSimplification";

export const dynamic = "force-dynamic";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous O, 0, I, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const userMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, upiId: true },
                },
              },
            },
            expenses: {
              include: {
                splits: true,
              },
            },
            settlements: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groupsWithStats = userMemberships.map((membership) => {
      const group = membership.group;
      const membersList = group.members.map((m) => m.user);
      const balanceMap = calculateMemberBalances(membersList, group.expenses, group.settlements);
      const userBalance = balanceMap.get(userId)?.netBalance || 0;

      // Current month's spending
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const currentMonthExpenses = group.expenses.filter((e) => {
        const d = new Date(e.expenseDate);
        return d >= currentMonthStart && d <= currentMonthEnd;
      });

      const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        id: group.id,
        name: group.name,
        emoji: group.emoji,
        currency: group.currency,
        monthlyGoal: group.monthlyGoal,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
        membersCount: group.members.length,
        members: membersList,
        userNetBalance: userBalance,
        totalExpensesCount: group.expenses.length,
        currentMonthTotal,
        isOverBudget: group.monthlyGoal ? currentMonthTotal > group.monthlyGoal : false,
      };
    });

    return NextResponse.json({ groups: groupsWithStats });
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { name, emoji, currency, monthlyGoal } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    let inviteCode = generateInviteCode();
    // Ensure uniqueness
    let exists = await prisma.group.findUnique({ where: { inviteCode } });
    while (exists) {
      inviteCode = generateInviteCode();
      exists = await prisma.group.findUnique({ where: { inviteCode } });
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        emoji: emoji?.trim() || "🏠",
        currency: currency || "INR",
        monthlyGoal: monthlyGoal ? Math.round(Number(monthlyGoal)) : null,
        inviteCode,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, upiId: true } },
          },
        },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
