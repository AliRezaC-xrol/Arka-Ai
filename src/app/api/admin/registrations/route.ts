/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
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

  const { searchParams } = new URL(request.url);
  const daysParam = parseInt(searchParams.get("days") || "30", 10);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

  try {
    const totalUsers = await prisma.user.count();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Bucket counts by day
    const dayBuckets: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dayBuckets[key] = 0;
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().split("T")[0];
      if (dayBuckets[key] !== undefined) {
        dayBuckets[key] += 1;
      }
    }

    const chartData = Object.entries(dayBuckets).map(([dateStr, count]) => {
      const d = new Date(dateStr);
      // Format as Persian month/day or simple label
      const label = d.toLocaleDateString("fa-IR", {
        month: "numeric",
        day: "numeric",
      });
      return {
        date: dateStr,
        label,
        count,
      };
    });

    return NextResponse.json({
      totalUsers,
      rangeDays: days,
      chartData,
    });
  } catch (err) {
    console.error("Admin registrations error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
