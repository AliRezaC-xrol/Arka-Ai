/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedAt: null,
        banReason: null,
        bannedReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Unban user error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
