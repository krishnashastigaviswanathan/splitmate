import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { monthlyGoal } = body;

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        monthlyGoal: monthlyGoal ? Math.round(Number(monthlyGoal)) : null,
      },
    });

    return NextResponse.json({
      success: true,
      monthlyGoal: updated.monthlyGoal,
    });
  } catch (error) {
    console.error("PUT /api/groups/[groupId]/goal error:", error);
    return NextResponse.json({ error: "Failed to update monthly goal" }, { status: 500 });
  }
}
