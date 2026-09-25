/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week"; // "day" | "week" | "month"
  const providerId = searchParams.get("providerId") || undefined;

  // Determine date threshold
  const now = new Date();
  const startDate = new Date();
  if (period === "day") {
    startDate.setHours(now.getHours() - 24);
  } else if (period === "month") {
    startDate.setDate(now.getDate() - 30);
  } else {
    // "week" default
    startDate.setDate(now.getDate() - 7);
  }

  try {
    // 1. Fetch raw logs in date range (filter by providerId if specified)
    const logs = await prisma.usageLog.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(providerId ? { providerId } : {}),
      },
      include: {
        provider: {
          select: { id: true, name: true, type: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Aggregate time-series
    // For "day": group by "HH:00"
    // For "week" & "month": group by "YYYY-MM-DD"
    const timeSeriesMap = new Map<string, { label: string; tokens: number; requests: number }>();

    if (period === "day") {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = `${String(d.getHours()).padStart(2, "0")}:00`;
        timeSeriesMap.set(key, { label: key, tokens: 0, requests: 0 });
      }
    } else {
      const days = period === "month" ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        timeSeriesMap.set(key, { label: key, tokens: 0, requests: 0 });
      }
    }

    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    const totalRequests = logs.length;

    // Per-provider accumulator
    const providerStatsMap = new Map<
      string,
      {
        providerId: string;
        name: string;
        type: string;
        tokens: number;
        promptTokens: number;
        completionTokens: number;
        requests: number;
      }
    >();

    // Per-model accumulator
    const modelStatsMap = new Map<string, { model: string; tokens: number; requests: number }>();

    // Per-user accumulator
    const userStatsMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        tokens: number;
        requests: number;
      }
    >();

    for (const log of logs) {
      totalTokens += log.tokensUsed;
      totalPromptTokens += log.promptTokens;
      totalCompletionTokens += log.completionTokens;

      // Time series
      let timeKey: string;
      if (period === "day") {
        timeKey = `${String(log.createdAt.getHours()).padStart(2, "0")}:00`;
      } else {
        timeKey = log.createdAt.toISOString().split("T")[0];
      }
      if (timeSeriesMap.has(timeKey)) {
        const slot = timeSeriesMap.get(timeKey)!;
        slot.tokens += log.tokensUsed;
        slot.requests += 1;
      }

      // Provider stats
      const pId = log.providerId;
      const pName = log.provider?.name || "نامشخص";
      const pType = log.provider?.type || "unknown";
      if (!providerStatsMap.has(pId)) {
        providerStatsMap.set(pId, {
          providerId: pId,
          name: pName,
          type: pType,
          tokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          requests: 0,
        });
      }
      const pSlot = providerStatsMap.get(pId)!;
      pSlot.tokens += log.tokensUsed;
      pSlot.promptTokens += log.promptTokens;
      pSlot.completionTokens += log.completionTokens;
      pSlot.requests += 1;

      // Model stats
      const mName = log.model;
      if (!modelStatsMap.has(mName)) {
        modelStatsMap.set(mName, { model: mName, tokens: 0, requests: 0 });
      }
      const mSlot = modelStatsMap.get(mName)!;
      mSlot.tokens += log.tokensUsed;
      mSlot.requests += 1;

      // User stats
      const uId = log.userId || "anonymous";
      const uName = log.user?.name || "کاربر ناشناس";
      const uEmail = log.user?.email || "-";
      if (!userStatsMap.has(uId)) {
        userStatsMap.set(uId, {
          userId: uId,
          name: uName,
          email: uEmail,
          tokens: 0,
          requests: 0,
        });
      }
      const uSlot = userStatsMap.get(uId)!;
      uSlot.tokens += log.tokensUsed;
      uSlot.requests += 1;
    }

    // Top provider
    const providerComparison = Array.from(providerStatsMap.values()).sort((a, b) => b.tokens - a.tokens);
    const topProvider = providerComparison[0] || null;

    // Top model
    const modelComparison = Array.from(modelStatsMap.values()).sort((a, b) => b.tokens - a.tokens);
    const topModel = modelComparison[0] || null;

    // Top users
    const topUsers = Array.from(userStatsMap.values())
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    return NextResponse.json({
      period,
      providerId: providerId || null,
      summary: {
        totalTokens,
        totalPromptTokens,
        totalCompletionTokens,
        totalRequests,
        topProvider,
        topModel,
      },
      timeSeries: Array.from(timeSeriesMap.values()),
      providerComparison,
      topUsers,
    });
  } catch (err) {
    console.error("Usage analytics error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
