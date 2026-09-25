/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recipients = await prisma.messageRecipient.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      include: {
        adminMessage: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const unreadCount = recipients.filter((r) => !r.isRead).length;

    const notifications = recipients.map((r) => ({
      id: r.id, // recipient id
      adminMessageId: r.adminMessageId,
      title: r.adminMessage.title,
      content: r.adminMessage.content,
      sentAt: r.adminMessage.sentAt,
      sentToAll: r.adminMessage.sentToAll,
      isRead: r.isRead,
      readAt: r.readAt,
    }));

    return NextResponse.json({
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error("Fetch user notifications error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
