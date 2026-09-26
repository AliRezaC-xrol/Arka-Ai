/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Admin: read a ticket thread, reply to it, and change its status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

async function authorize(request: NextRequest): Promise<boolean> {
  const token = getAdminTokenFromRequest(request);
  return verifyAdminSession(token);
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("Admin get ticket error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}

/** Admin reply. Moves the ticket to "answered" so it leaves the open queue. */
export async function POST(request: NextRequest, { params }: Params) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const text = String(body?.body || "").trim();

  if (!text) {
    return NextResponse.json({ error: "متن پاسخ الزامی است." }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
    }

    await prisma.ticketMessage.create({
      data: { ticketId: id, authorId: null, isAdmin: true, body: text },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: "answered", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin reply error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}

/** Change status: open (re-open), answered, or closed. */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "").trim();

  if (!["open", "answered", "closed"].includes(status)) {
    return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  try {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === "closed" ? new Date() : null,
        updatedAt: new Date(),
      },
      select: { id: true, status: true, closedAt: true, updatedAt: true },
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    console.error("Admin ticket status error:", err);
    return NextResponse.json({ error: "تیکت پیدا نشد." }, { status: 404 });
  }
}
