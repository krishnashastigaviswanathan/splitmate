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

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        expenses: {
          orderBy: { expenseDate: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const monthlyGoal = group.monthlyGoal || 0; // In smallest unit (paise)
    const now = new Date();

    // Prepare 6 month windows (current month + past 5 months)
    const monthsData: {
      key: string;
      label: string;
      year: number;
      month: number;
      total: number;
      totalDecimal: number;
      goal: number;
      goalDecimal: number;
      percentage: number;
      colorStatus: "emerald" | "amber" | "rose";
      barColor: string;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const fullLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthExpenses = group.expenses.filter((e) => {
        const expDate = new Date(e.expenseDate);
        return expDate >= start && expDate <= end;
      });

      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = monthlyGoal > 0 ? Math.round((total / monthlyGoal) * 100) : 0;

      let colorStatus: "emerald" | "amber" | "rose" = "emerald";
      let barColor = "#10b981"; // emerald

      if (monthlyGoal > 0) {
        if (total > monthlyGoal) {
          colorStatus = "rose";
          barColor = "#f43f5e"; // rose-500
        } else if (total >= monthlyGoal * 0.8) {
          colorStatus = "amber";
          barColor = "#f59e0b"; // amber-500
        }
      }

      monthsData.push({
        key: `${year}-${month}`,
        label: fullLabel,
        year,
        month,
        total,
        totalDecimal: total / 100,
        goal: monthlyGoal,
        goalDecimal: monthlyGoal / 100,
        percentage,
        colorStatus,
        barColor,
      });
    }

    // Category breakdown (across all time or current month)
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    let totalAllTime = 0;

    for (const exp of group.expenses) {
      const cat = exp.category || "Other";
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += exp.amount;
      categoryTotals[cat].count += 1;
      totalAllTime += exp.amount;
    }

    const CATEGORY_COLORS: Record<string, string> = {
      "Rent & Utilities": "#3b82f6", // blue
      "Groceries": "#10b981", // emerald
      "Food & Dining": "#f97316", // orange
      "Travel": "#8b5cf6", // purple
      "Entertainment": "#ec4899", // pink
      "Other": "#64748b", // slate
    };

    const categoryBreakdown = Object.entries(categoryTotals).map(([name, data]) => ({
      name,
      total: data.total,
      totalDecimal: data.total / 100,
      count: data.count,
      percentage: totalAllTime > 0 ? Math.round((data.total / totalAllTime) * 100) : 0,
      color: CATEGORY_COLORS[name] || "#64748b",
    }));

    // Current month status
    const currentMonthData = monthsData[monthsData.length - 1];
    const isOverBudget = monthlyGoal > 0 ? currentMonthData.total > monthlyGoal : false;
    const overBudgetAmount = isOverBudget ? currentMonthData.total - monthlyGoal : 0;
    const underBudgetRemaining = !isOverBudget && monthlyGoal > 0 ? monthlyGoal - currentMonthData.total : 0;

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
        monthlyGoal,
      },
      monthsData,
      categoryBreakdown,
      currentMonth: {
        total: currentMonthData.total,
        totalDecimal: currentMonthData.totalDecimal,
        goal: monthlyGoal,
        goalDecimal: monthlyGoal / 100,
        isOverBudget,
        overBudgetAmount,
        underBudgetRemaining,
        percentage: currentMonthData.percentage,
        colorStatus: currentMonthData.colorStatus,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
