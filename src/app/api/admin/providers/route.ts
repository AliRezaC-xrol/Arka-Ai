/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";
import { verifyProvider, resolveApiFormat } from "@/lib/ai-client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KEY_SELECT = {
  id: true,
  label: true,
  keyMask: true,
  status: true,
  lastUsedAt: true,
  lastErrorMessage: true,
  lastTestedAt: true,
  lastTestMessage: true,
  usageCount: true,
  createdAt: true,
} as const;

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
          select: KEY_SELECT,
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
  const apiFormat = resolveApiFormat(type, body.apiFormat);
  const modelsConfig = Array.isArray(body.modelsConfig) ? body.modelsConfig : null;

  if (!name) {
    return NextResponse.json({ error: "نام پروایدر الزامی است." }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.create({
      data: {
        name,
        type,
        apiFormat,
        baseUrl,
        // No fake placeholder: an empty catalogue is resolved by the live
        // verification below, or left empty so the provider stays hidden
        // from users until real models are known.
        models: models || null,
        modelsConfig: modelsConfig ?? undefined,
        isActive: true,
      },
    });

    let verification: { ok: boolean; message: string; models: string[] } | null = null;

    // If an initial API key was provided, verify it against the real API and
    // publish the discovered catalogue so it appears in every user's picker.
    if (initialApiKey) {
      const encryptedApiKey = encryptApiKey(initialApiKey);
      const keyMask = maskApiKey(initialApiKey);

      const check = await verifyProvider({
        type,
        apiFormat,
        apiKey: initialApiKey,
        baseUrl,
        model: models ? models.split(",")[0].trim() : null,
      });

      verification = { ok: check.ok, message: check.message, models: check.models || [] };

      await prisma.providerApiKey.create({
        data: {
          providerId: provider.id,
          encryptedApiKey,
          keyMask,
          label: initialKeyLabel,
          status: check.ok ? "active" : "error",
          lastErrorMessage: check.ok ? null : check.message.slice(0, 900),
          lastTestedAt: new Date(),
          lastTestMessage: check.message.slice(0, 900),
        },
      });

      if (check.ok && check.models && check.models.length > 0) {
        await prisma.provider.update({
          where: { id: provider.id },
          data: { models: check.models.join(",") },
        });
      }
    }

    const fullProvider = await prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        apiKeys: {
          select: KEY_SELECT,
        },
      },
    });

    return NextResponse.json({ provider: fullProvider, verification }, { status: 201 });
  } catch (err) {
    console.error("Failed to create provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
