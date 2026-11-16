import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, email: true, upiId: true } },
        toUser: { select: { id: true, name: true, email: true, upiId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error("GET /api/settlements error:", error);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
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
    const { groupId, fromUserId, toUserId, amount, note } = body;

    const settleAmount = Math.round(Number(amount));
    if (!settleAmount || settleAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    if (!groupId || !fromUserId || !toUserId) {
      return NextResponse.json({ error: "groupId, fromUserId, and toUserId are required" }, { status: 400 });
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot settle with yourself" }, { status: 400 });
    }

    // Verify membership of all involved
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isCurrentMember = group.members.some((m) => m.userId === currentUserId);
    const isFromMember = group.members.some((m) => m.userId === fromUserId);
    const isToMember = group.members.some((m) => m.userId === toUserId);

    if (!isCurrentMember || !isFromMember || !isToMember) {
      return NextResponse.json({ error: "All users must be members of the group" }, { status: 403 });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: settleAmount,
        note: note?.trim() || null,
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, upiId: true } },
        toUser: { select: { id: true, name: true, email: true, upiId: true } },
      },
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/settlements error:", error);
    return NextResponse.json({ error: "Failed to record settlement" }, { status: 500 });
  }
}
