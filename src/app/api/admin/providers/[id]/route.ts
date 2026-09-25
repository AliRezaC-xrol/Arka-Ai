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

export async function GET(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        apiKeys: {
          orderBy: { createdAt: "desc" },
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
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (err) {
    console.error("Fetch provider error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }
    if (typeof body.type === "string") {
      dataToUpdate.type = body.type.trim();
    }
    if (body.baseUrl !== undefined) {
      dataToUpdate.baseUrl = body.baseUrl ? body.baseUrl.trim() : null;
    }
    if (typeof body.models === "string") {
      dataToUpdate.models = body.models.trim();
    }
    if (typeof body.isActive === "boolean") {
      dataToUpdate.isActive = body.isActive;
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: dataToUpdate,
      include: {
        apiKeys: {
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
        },
      },
    });

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Update provider error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete provider error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
