import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: any = { groupId };
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (search && search.trim()) {
      whereClause.description = {
        contains: search.trim(),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
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
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = (session.user as any).id;

    const body = await req.json();
    const {
      description,
      amount,
      category,
      splitType,
      receiptUrl,
      isRecurring,
      recurringInterval,
      nextDueDate,
      groupId,
      paidById,
      expenseDate,
      splits,
    } = body;

    // Basic validation
    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Expense description is required" }, { status: 400 });
    }

    const totalAmount = Math.round(Number(amount));
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Group is required" }, { status: 400 });
    }

    // Verify membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    const payerId = paidById || currentUserId;
    const isPayerMember = group.members.some((m) => m.userId === payerId);
    if (!isPayerMember) {
      return NextResponse.json({ error: "Payer must be a member of the group" }, { status: 400 });
    }

    // Validate splits
    if (!Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: "At least one split is required" }, { status: 400 });
    }

    let splitSum = 0;
    for (const split of splits) {
      const splitAmt = Math.round(Number(split.amount));
      if (splitAmt < 0) {
        return NextResponse.json({ error: "Split amounts cannot be negative" }, { status: 400 });
      }
      splitSum += splitAmt;

      const isSplitUserMember = group.members.some((m) => m.userId === split.userId);
      if (!isSplitUserMember) {
        return NextResponse.json(
          { error: `Split user ${split.userId} is not a member of this group` },
          { status: 400 }
        );
      }
    }

    if (splitSum !== totalAmount) {
      return NextResponse.json(
        {
          error: `Splits sum (${splitSum}) does not match total expense amount (${totalAmount}). Difference: ${totalAmount - splitSum}`,
        },
        { status: 400 }
      );
    }

    // Calculate current month's expenses before adding this expense for budget alert checking
    const expDate = expenseDate ? new Date(expenseDate) : new Date();
    const monthStart = new Date(expDate.getFullYear(), expDate.getMonth(), 1);
    const monthEnd = new Date(expDate.getFullYear(), expDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const existingMonthExpenses = await prisma.expense.aggregate({
      where: {
        groupId,
        expenseDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { amount: true },
    });

    const previousMonthTotal = existingMonthExpenses._sum.amount || 0;
    const newMonthTotal = previousMonthTotal + totalAmount;
    const monthlyGoal = group.monthlyGoal || 0;

    let triggeredOverBudget = false;
    let overBudgetWarning = null;

    if (monthlyGoal > 0) {
      if (newMonthTotal > monthlyGoal) {
        triggeredOverBudget = true;
        const overBy = newMonthTotal - monthlyGoal;
        const wasAlreadyOver = previousMonthTotal > monthlyGoal;
        overBudgetWarning = {
          triggered: true,
          wasAlreadyOver,
          monthlyGoal,
          previousMonthTotal,
          newMonthTotal,
          overBy,
          message: wasAlreadyOver
            ? `Notice: Group is already over budget! Current spending is now ${newMonthTotal / 100} against goal of ${monthlyGoal / 100}.`
            : `⚠️ Budget Exceeded! This expense pushes monthly spending to ${newMonthTotal / 100}, which is ${overBy / 100} over the ${monthlyGoal / 100} goal!`,
        };
      }
    }

    // Perform atomic transaction
    const createdExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description: description.trim(),
          amount: totalAmount,
          category: category || "Other",
          splitType: splitType || "EQUAL",
          receiptUrl: receiptUrl?.trim() || null,
          isRecurring: Boolean(isRecurring),
          recurringInterval: isRecurring ? recurringInterval || "MONTHLY" : null,
          nextDueDate: isRecurring && nextDueDate ? new Date(nextDueDate) : null,
          groupId,
          paidById: payerId,
          expenseDate: expDate,
        },
      });

      const splitRecords = splits.map((s: { userId: string; amount: number }) => ({
        expenseId: expense.id,
        userId: s.userId,
        amount: Math.round(Number(s.amount)),
      }));

      await tx.expenseSplit.createMany({
        data: splitRecords,
      });

      return await tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          paidBy: { select: { id: true, name: true, email: true, upiId: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true, upiId: true } },
            },
          },
          comments: true,
        },
      });
    });

    return NextResponse.json(
      {
        expense: createdExpense,
        overBudgetWarning,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
