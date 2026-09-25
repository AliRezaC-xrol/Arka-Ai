import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updated = await prisma.messageRecipient.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
