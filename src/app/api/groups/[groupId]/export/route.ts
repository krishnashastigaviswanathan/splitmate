import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

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
          include: {
            paidBy: true,
            splits: { include: { user: true } },
          },
          orderBy: { expenseDate: "desc" },
        },
        settlements: {
          include: {
            fromUser: true,
            toUser: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const lines: string[] = [];

    // Header info
    lines.push(`Group Expense & Settlement Export`);
    lines.push(`Group: ${group.name} (${group.emoji})`);
    lines.push(`Currency: ${group.currency}`);
    lines.push(`Exported On: ${new Date().toISOString()}`);
    lines.push(``);

    // Section 1: Expenses
    lines.push(`=== EXPENSES ===`);
    lines.push(
      [
        "ID",
        "Date",
        "Description",
        "Category",
        "Paid By",
        `Amount (${group.currency})`,
        "Split Type",
        "Is Recurring",
        "Splits Detail",
      ].map(escapeCsv).join(",")
    );

    for (const exp of group.expenses) {
      const splitsDetail = exp.splits
        .map((s) => `${s.user.name}: ${(s.amount / 100).toFixed(2)}`)
        .join("; ");

      lines.push(
        [
          exp.id,
          new Date(exp.expenseDate).toLocaleDateString(),
          exp.description,
          exp.category,
          exp.paidBy.name,
          (exp.amount / 100).toFixed(2),
          exp.splitType,
          exp.isRecurring ? "Yes" : "No",
          splitsDetail,
        ].map(escapeCsv).join(",")
      );
    }

    lines.push(``);
    lines.push(`=== SETTLEMENTS ===`);
    lines.push(
      ["ID", "Date", "Paid By (From)", "Paid To", `Amount (${group.currency})`, "Note"]
        .map(escapeCsv)
        .join(",")
    );

    for (const st of group.settlements) {
      lines.push(
        [
          st.id,
          new Date(st.createdAt).toLocaleDateString(),
          st.fromUser.name,
          st.toUser.name,
          (st.amount / 100).toFixed(2),
          st.note || "",
        ].map(escapeCsv).join(",")
      );
    }

    const csvContent = lines.join("\n");
    const filename = `${group.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_expenses_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET export CSV error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
