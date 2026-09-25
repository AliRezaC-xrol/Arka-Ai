/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string; keyId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id: providerId, keyId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const dataToUpdate: Record<string, unknown> = {};
    if (typeof body.label === "string" && body.label.trim()) {
      dataToUpdate.label = body.label.trim();
    }
    if (typeof body.status === "string") {
      const s = body.status.toLowerCase();
      if (["active", "exhausted", "error"].includes(s)) {
        dataToUpdate.status = s;
        if (s === "active") {
          dataToUpdate.lastErrorMessage = null;
        }
      }
    }

    // Verify key belongs to provider
    const existingKey = await prisma.providerApiKey.findFirst({
      where: { id: keyId, providerId },
    });
    if (!existingKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const updated = await prisma.providerApiKey.update({
      where: { id: keyId },
      data: dataToUpdate,
      select: {
        id: true,
        label: true,
        keyMask: true,
        status: true,
        lastUsedAt: true,
        lastErrorMessage: true,
        usageCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ key: updated });
  } catch (err) {
    console.error("Update provider key error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id: providerId, keyId } = await params;

  try {
    const existingKey = await prisma.providerApiKey.findFirst({
      where: { id: keyId, providerId },
    });
    if (!existingKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await prisma.providerApiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete provider key error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
