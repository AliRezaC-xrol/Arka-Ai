/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { testProviderConnection } from "@/lib/provider-tester";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const provider = await prisma.userProvider.findFirst({
      where: { id, userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Decrypt API key safely on the server
    const plainApiKey = decryptApiKey(provider.encryptedApiKey);

    const testResult = await testProviderConnection({
      providerType: provider.providerType,
      apiKey: plainApiKey,
      baseUrl: provider.baseUrl,
      apiFormat: provider.apiFormat,
    });

    const status = testResult.ok ? "connected" : "disconnected";
    const now = new Date();

    const updated = await prisma.userProvider.update({
      where: { id },
      data: {
        status,
        lastTestedAt: now,
        lastTestMessage: testResult.message,
        models: testResult.models && testResult.models.length > 0
          ? testResult.models.join(",")
          : provider.models,
      },
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        keyMask: true,
        models: true,
        status: true,
        lastTestedAt: true,
        lastTestMessage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: testResult.ok,
      message: testResult.message,
      provider: updated,
    });
  } catch (err) {
    console.error("Failed to test provider connection:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
