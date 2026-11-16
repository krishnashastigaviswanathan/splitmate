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

    // Fetch user groups
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const userGroupIds = memberships.map((m) => m.groupId);

    const targetGroupId = groupId || (userGroupIds.length > 0 ? userGroupIds[0] : null);

    if (!targetGroupId) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.roommateMessage.findMany({
      where: {
        groupId: targetGroupId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true, emoji: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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
    const { groupId, content, emoji, tag } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Group is required" }, { status: 400 });
    }

    // Verify user is in group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: currentUserId, groupId },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden. Not a member of this group." }, { status: 403 });
    }

    const created = await prisma.roommateMessage.create({
      data: {
        groupId,
        userId: currentUserId,
        content: content.trim(),
        emoji: emoji?.trim() || "💬",
        tag: tag || "CHAT",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true, emoji: true } },
      },
    });

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
