/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Reports what the selected model can actually accept (images, files, limits),
 * asked straight from the provider rather than guessed in the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { getModelCapabilities, normalizeType } from "@/lib/ai-client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const model = (body?.model || "").trim();
  const userProviderId: string | undefined = body?.userProviderId;
  const providerId: string | undefined = body?.providerId;

  if (!model) {
    return NextResponse.json({ error: "نام مدل الزامی است." }, { status: 400 });
  }

  try {
    let type = "custom";
    let baseUrl: string | null = null;
    let apiKey: string | null = null;

    if (userProviderId) {
      const userProv = await prisma.userProvider.findFirst({
        where: { id: userProviderId, userId: user.id },
      });
      if (!userProv) {
        return NextResponse.json({ error: "پروایدر شخصی پیدا نشد." }, { status: 404 });
      }
      type = normalizeType(userProv.providerType);
      baseUrl = userProv.baseUrl;
      try {
        apiKey = decryptApiKey(userProv.encryptedApiKey);
      } catch {
        return NextResponse.json({ error: "رمزگشایی کلید ناموفق بود." }, { status: 500 });
      }
    } else if (providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: { apiKeys: { where: { status: "active" }, orderBy: { usageCount: "asc" }, take: 1 } },
      });
      if (!provider) {
        return NextResponse.json({ error: "پروایدر پیدا نشد." }, { status: 404 });
      }
      type = normalizeType(provider.type);
      baseUrl = provider.baseUrl;
      if (provider.apiKeys.length > 0) {
        try {
          apiKey = decryptApiKey(provider.apiKeys[0].encryptedApiKey);
        } catch {
          apiKey = null;
        }
      }
    } else {
      return NextResponse.json({ error: "پروایدر مشخص نشده است." }, { status: 400 });
    }

    // No key available: still return the name-based estimate so the UI has
    // something sensible to work with.
    const capabilities = await getModelCapabilities({
      type,
      apiKey: apiKey || "",
      baseUrl,
      model,
    });

    return NextResponse.json({ model, capabilities });
  } catch (err) {
    console.error("Model capabilities error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور." }, { status: 500 });
  }
}
