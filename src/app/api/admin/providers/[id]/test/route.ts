/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Admin: verify a provider's real connectivity against the live upstream API.
 * Writes the outcome back onto the key row so the dashboard can show it.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { verifyProvider } from "@/lib/ai-client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id: providerId } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedKeyId: string | undefined = body?.keyId;

  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { apiKeys: { orderBy: { createdAt: "asc" } } },
    });

    if (!provider) {
      return NextResponse.json({ error: "پروایدر پیدا نشد." }, { status: 404 });
    }

    if (provider.apiKeys.length === 0) {
      return NextResponse.json(
        { ok: false, message: "برای این پروایدر هیچ کلیدی ثبت نشده است. ابتدا یک کلید API اضافه کنید." },
        { status: 400 },
      );
    }

    const keysToTest = requestedKeyId
      ? provider.apiKeys.filter((k) => k.id === requestedKeyId)
      : provider.apiKeys;

    if (keysToTest.length === 0) {
      return NextResponse.json({ error: "کلید موردنظر پیدا نشد." }, { status: 404 });
    }

    const configuredModels = (provider.models || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const probeModel = configuredModels[0] || null;

    const results: Array<{
      keyId: string;
      keyMask: string;
      label: string | null;
      ok: boolean;
      message: string;
      models: string[];
    }> = [];

    for (const keyRecord of keysToTest) {
      let plainKey: string;
      try {
        plainKey = decryptApiKey(keyRecord.encryptedApiKey);
      } catch {
        const msg = "رمزگشایی کلید ناموفق بود. مقدار BYOK_ENCRYPTION_KEY سرور تغییر کرده است.";
        await prisma.providerApiKey.update({
          where: { id: keyRecord.id },
          data: { status: "error", lastErrorMessage: msg, lastTestedAt: new Date(), lastTestMessage: msg },
        });
        results.push({ keyId: keyRecord.id, keyMask: keyRecord.keyMask || "••••", label: keyRecord.label, ok: false, message: msg, models: [] });
        continue;
      }

      const verification = await verifyProvider({
        type: provider.type,
        apiFormat: provider.apiFormat,
        apiKey: plainKey,
        baseUrl: provider.baseUrl,
        model: probeModel,
      });

      await prisma.providerApiKey.update({
        where: { id: keyRecord.id },
        data: {
          status: verification.ok ? "active" : "error",
          lastTestedAt: new Date(),
          lastTestMessage: verification.message.slice(0, 900),
          lastErrorMessage: verification.ok ? null : verification.message.slice(0, 900),
        },
      });

      results.push({
        keyId: keyRecord.id,
        keyMask: keyRecord.keyMask || "••••",
        label: keyRecord.label,
        ok: verification.ok,
        message: verification.message,
        models: verification.models || [],
      });
    }

    // Publish the real model catalogue so it shows up in every user's picker.
    const anyOk = results.some((r) => r.ok);
    const discovered = Array.from(new Set(results.flatMap((r) => r.models)));

    let updatedModels = configuredModels;
    if (anyOk && discovered.length > 0 && body?.updateModels !== false) {
      updatedModels = discovered;
      await prisma.provider.update({
        where: { id: providerId },
        data: { models: discovered.join(",") },
      });
    }

    const summary = results.map((r) => `${r.label || r.keyMask}: ${r.ok ? "موفق ✓" : "ناموفق ✗"}`).join(" | ");

    return NextResponse.json({
      ok: anyOk,
      message: anyOk
        ? `اتصال تأیید شد ✓ ${summary}${discovered.length ? ` — ${discovered.length} مدل شناسایی و در فهرست مدل‌ها منتشر شد.` : ""}`
        : `اتصال ناموفق ✗ ${summary}`,
      results,
      models: updatedModels,
    });
  } catch (err) {
    console.error("Admin provider test error:", err);
    return NextResponse.json({ error: "خطای داخلی سرور در بررسی اتصال." }, { status: 500 });
  }
}
