/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Support tickets — the signed-in user's own list.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("List tickets error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  const priority = ["low", "normal", "high"].includes(body?.priority) ? body.priority : "normal";

  if (!subject) {
    return NextResponse.json({ error: "موضوع تیکت الزامی است." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "متن پیام الزامی است." }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: subject.slice(0, 160),
        priority,
        messages: {
          create: { authorId: user.id, isAdmin: false, body: message },
        },
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error("Create ticket error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}
