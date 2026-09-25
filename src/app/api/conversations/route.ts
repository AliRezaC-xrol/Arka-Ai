import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title || "گفتگوی جدید").trim().slice(0, 100);

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title,
        isPinned: Boolean(body.isPinned),
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err) {
    console.error("Failed to create conversation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
