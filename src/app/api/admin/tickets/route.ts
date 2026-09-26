/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Admin: the support ticket inbox.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const status = request.nextUrl.searchParams.get("status");

  try {
    const where = status && ["open", "answered", "closed"].includes(status) ? { status } : {};

    const [tickets, openCount, answeredCount, closedCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: { select: { messages: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, isAdmin: true } },
        },
      }),
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.ticket.count({ where: { status: "answered" } }),
      prisma.ticket.count({ where: { status: "closed" } }),
    ]);

    return NextResponse.json({
      tickets,
      counts: { open: openCount, answered: answeredCount, closed: closedCount, total: openCount + answeredCount + closedCount },
    });
  } catch (err) {
    console.error("Admin tickets error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}
