/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

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

  if (user.isBanned) {
    return NextResponse.json({ error: "حساب شما مسدود شده است", banned: true }, { status: 403 });
  }

  if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
    return NextResponse.json({ error: "شما موقتاً محدود شده‌اید", timedOut: true }, { status: 429 });
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
