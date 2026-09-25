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
  const search = (searchParams.get("search") || "").trim();
  const statusFilter = searchParams.get("status") || "all"; // "all" | "active" | "banned" | "timeout"
  const sort = searchParams.get("sort") || "createdAt_desc"; // "createdAt_desc" | "createdAt_asc" | "messages_desc" | "tokens_desc"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const now = new Date();

  try {
    // Global status counts
    const [totalCount, bannedCount, timeoutCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({
        where: {
          isBanned: false,
          timeoutUntil: { gt: now },
        },
      }),
    ]);
    const activeCount = Math.max(0, totalCount - bannedCount - timeoutCount);

    // Build Prisma where clause
    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusFilter === "banned") {
      whereClause.isBanned = true;
    } else if (statusFilter === "timeout") {
      whereClause.isBanned = false;
      whereClause.timeoutUntil = { gt: now };
    } else if (statusFilter === "active") {
      whereClause.isBanned = false;
      whereClause.OR = [
        { timeoutUntil: null },
        { timeoutUntil: { lte: now } },
      ];
    }

    // Determine query ordering
    let orderBy: Record<string, string> | Array<Record<string, string>> = { createdAt: "desc" };
    if (sort === "createdAt_asc") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "createdAt_desc") {
      orderBy = { createdAt: "desc" };
    }

    // Fetch users with related counts and usageLogs aggregation
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy,
      include: {
        _count: {
          select: {
            conversations: true,
            userProviders: true,
            usageLogs: true,
          },
        },
        usageLogs: {
          select: {
            tokensUsed: true,
          },
        },
        conversations: {
          select: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    // Post-process computed fields (total messages, total tokens, computed status)
    const processedUsers = users.map((u) => {
      const isUserBanned = u.isBanned;
      const isUserTimedOut = Boolean(!isUserBanned && u.timeoutUntil && u.timeoutUntil > now);
      const computedStatus: "banned" | "timeout" | "active" = isUserBanned
        ? "banned"
        : isUserTimedOut
          ? "timeout"
          : "active";

      const totalMessages = u.conversations.reduce((acc, c) => acc + c._count.messages, 0);
      const totalTokensUsed = u.usageLogs.reduce((acc, l) => acc + l.tokensUsed, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        lastActiveAt: u.lastActiveAt,
        isBanned: u.isBanned,
        bannedAt: u.bannedAt,
        banReason: u.banReason || u.bannedReason || null,
        timeoutUntil: u.timeoutUntil,
        timeoutReason: u.timeoutReason,
        computedStatus,
        totalMessages,
        totalTokensUsed,
        personalProvidersCount: u._count.userProviders,
        conversationsCount: u._count.conversations,
      };
    });

    // Custom sorting for usage/activity if requested
    if (sort === "messages_desc") {
      processedUsers.sort((a, b) => b.totalMessages - a.totalMessages);
    } else if (sort === "tokens_desc") {
      processedUsers.sort((a, b) => b.totalTokensUsed - a.totalTokensUsed);
    }

    const totalFiltered = processedUsers.length;
    const paginatedUsers = processedUsers.slice(skip, skip + limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
      stats: {
        total: totalCount,
        active: activeCount,
        banned: bannedCount,
        timedOut: timeoutCount,
      },
    });
  } catch (err) {
    console.error("Fetch admin users error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
