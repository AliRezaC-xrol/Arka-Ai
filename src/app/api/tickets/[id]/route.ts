/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * One support ticket: the thread, and the user's reply.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("Get ticket error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const text = String(body?.body || "").trim();

  if (!text) {
    return NextResponse.json({ error: "متن پیام الزامی است." }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id } });
    if (!ticket) {
      return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
    }
    if (ticket.status === "closed") {
      return NextResponse.json(
        { error: "این تیکت بسته شده است. برای پیگیری، تیکت جدیدی باز کنید." },
        { status: 400 },
      );
    }

    await prisma.ticketMessage.create({
      data: { ticketId: id, authorId: user.id, isAdmin: false, body: text },
    });

    // A user reply puts the ticket back in the admin's queue.
    await prisma.ticket.update({
      where: { id },
      data: { status: "open", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reply to ticket error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}
