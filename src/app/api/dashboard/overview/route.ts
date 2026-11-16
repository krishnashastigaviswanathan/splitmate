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
    const now = new Date();
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10); // 1-12

    // Get all groups user is member of
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            emoji: true,
            currency: true,
            monthlyGoal: true,
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    const groupIds = memberships.map((m) => m.group.id);

    // Collect all unique members across user's groups
    const allUniqueMembersMap: Record<string, { id: string; name: string; email: string }> = {};
    for (const m of memberships) {
      for (const gm of m.group.members) {
        allUniqueMembersMap[gm.user.id] = gm.user;
      }
    }
    const totalHouseholdMembers = Math.max(1, Object.keys(allUniqueMembersMap).length);

    // 1. Fetch all expenses in the requested calendar month for this user's groups
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const monthExpenses = await prisma.expense.findMany({
      where: {
        groupId: { in: groupIds },
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        group: { select: { id: true, name: true, emoji: true, currency: true } },
        paidBy: { select: { id: true, name: true, email: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { expenseDate: "asc" },
    });

    // Group expenses by calendar date
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarDays: Record<number, {
      day: number;
      dateStr: string;
      totalAmount: number;
      expenses: any[];
    }> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      calendarDays[d] = {
        day: d,
        dateStr,
        totalAmount: 0,
        expenses: [],
      };
    }

    let monthTotalSpending = 0;
    let highestDay = { day: 1, amount: 0, title: "None" };

    // Calculate exact per-person splits for this month
    const memberMonthlyShares: Record<string, { id: string; name: string; amount: number }> = {};
    for (const mem of Object.values(allUniqueMembersMap)) {
      memberMonthlyShares[mem.id] = { id: mem.id, name: mem.name, amount: 0 };
    }

    for (const exp of monthExpenses) {
      const expDate = new Date(exp.expenseDate);
      const dayNum = expDate.getDate();

      if (calendarDays[dayNum]) {
        calendarDays[dayNum].totalAmount += exp.amount;
        calendarDays[dayNum].expenses.push(exp);
      }
      monthTotalSpending += exp.amount;

      if (calendarDays[dayNum] && calendarDays[dayNum].totalAmount > highestDay.amount) {
        highestDay = {
          day: dayNum,
          amount: calendarDays[dayNum].totalAmount,
          title: exp.description,
        };
      }

      // Add to member splits
      for (const split of exp.splits) {
        if (!memberMonthlyShares[split.userId]) {
          memberMonthlyShares[split.userId] = {
            id: split.userId,
            name: split.user.name,
            amount: 0,
          };
        }
        memberMonthlyShares[split.userId].amount += split.amount;
      }
    }

    const memberSharesList = Object.values(memberMonthlyShares).sort((a, b) => b.amount - a.amount);
    const averagePerPersonMonthly = Math.round(monthTotalSpending / totalHouseholdMembers);

    // 2. Fetch past 6 months overall spending across all user groups for the overall bar graph
    const sixMonthsData: {
      key: string;
      label: string;
      monthName: string;
      year: number;
      month: number;
      total: number;
      totalDecimal: number;
      perPersonSplit: number;
      perPersonSplitDecimal: number;
      funRemark: string;
      groupBreakdown: { name: string; emoji: string; amount: number }[];
    }[] = [];

    const FUN_REMARKS = [
      "Peak adulting achieved! 🏆",
      "Swiggy was the true winner 🍕",
      "Wallet crying softly in the corner 💸",
      "Dost dost na raha (until UPI arrived) 🤝",
      "Chai & Maggi diplomacy era ☕",
      "Financial stability: 404 Not Found 🕵️‍♂️",
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const fullLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

      const mExpenses = await prisma.expense.findMany({
        where: {
          groupId: { in: groupIds },
          expenseDate: { gte: start, lte: end },
        },
        include: {
          group: { select: { id: true, name: true, emoji: true } },
        },
      });

      const total = mExpenses.reduce((sum, e) => sum + e.amount, 0);
      const perPersonSplit = Math.round(total / totalHouseholdMembers);

      // Group breakdown
      const gMap: Record<string, { name: string; emoji: string; amount: number }> = {};
      for (const e of mExpenses) {
        if (!gMap[e.group.id]) {
          gMap[e.group.id] = { name: e.group.name, emoji: e.group.emoji, amount: 0 };
        }
        gMap[e.group.id].amount += e.amount;
      }

      sixMonthsData.push({
        key: `${y}-${m}`,
        label: fullLabel,
        monthName: label,
        year: y,
        month: m,
        total,
        totalDecimal: total / 100,
        perPersonSplit,
        perPersonSplitDecimal: perPersonSplit / 100,
        funRemark: FUN_REMARKS[i % FUN_REMARKS.length],
        groupBreakdown: Object.values(gMap),
      });
    }

    return NextResponse.json({
      selectedMonth: {
        year,
        month,
        monthName: new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long" }),
        daysInMonth,
        firstDayOfWeek: new Date(year, month - 1, 1).getDay(), // 0 = Sunday
        totalSpending: monthTotalSpending,
        averagePerPersonMonthly,
        totalHouseholdMembers,
        memberShares: memberSharesList,
        highestDay,
      },
      calendarDays: Object.values(calendarDays),
      overallBarGraph: sixMonthsData,
    });
  } catch (error) {
    console.error("GET /api/dashboard/overview error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard overview" }, { status: 500 });
  }
}
