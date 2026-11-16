import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const group = await prisma.group.findUnique({
      where: { inviteCode: cleanCode },
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Invalid invite code. Group not found." }, { status: 404 });
    }

    const alreadyMember = group.members.some((m) => m.userId === userId);
    if (alreadyMember) {
      return NextResponse.json({
        message: "You are already a member of this group",
        group: { id: group.id, name: group.name, emoji: group.emoji },
      });
    }

    await prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
      },
    });

    return NextResponse.json({
      message: `Successfully joined ${group.name}!`,
      group: { id: group.id, name: group.name, emoji: group.emoji },
    });
  } catch (error) {
    console.error("POST /api/groups/join error:", error);
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}
