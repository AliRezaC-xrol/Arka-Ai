/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: "desc" },
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
        _count: {
          select: {
            apiKeys: true,
            usageLogs: true,
          },
        },
      },
    });

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("Admin providers error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const type = (body.type || "openai").toLowerCase().trim();
  const baseUrl = body.baseUrl ? body.baseUrl.trim() : null;
  const models = (body.models || "").trim();
  const initialApiKey = (body.apiKey || "").trim();
  const initialKeyLabel = (body.keyLabel || "کلید اولیه").trim();

  if (!name) {
    return NextResponse.json({ error: "نام پروایدر الزامی است." }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.create({
      data: {
        name,
        type,
        baseUrl,
        models: models || "Default Model",
        isActive: true,
      },
    });

    // If an initial API key was provided, create it
    if (initialApiKey) {
      const encryptedApiKey = encryptApiKey(initialApiKey);
      const keyMask = maskApiKey(initialApiKey);

      await prisma.providerApiKey.create({
        data: {
          providerId: provider.id,
          encryptedApiKey,
          keyMask,
          label: initialKeyLabel,
          status: "active",
        },
      });
    }

    const fullProvider = await prisma.provider.findUnique({
      where: { id: provider.id },
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

    return NextResponse.json({ provider: fullProvider }, { status: 201 });
  } catch (err) {
    console.error("Failed to create provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
