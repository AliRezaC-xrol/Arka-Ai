import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Either by recipient id or adminMessageId
    const recipient = await prisma.messageRecipient.findFirst({
      where: {
        userId: user.id,
        OR: [
          { id },
          { adminMessageId: id },
        ],
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const updated = await prisma.messageRecipient.update({
      where: { id: recipient.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
