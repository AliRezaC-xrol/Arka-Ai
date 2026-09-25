import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const now = new Date();

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            userProviders: true,
            usageLogs: true,
            sessions: true,
          },
        },
        conversations: {
          select: {
            id: true,
            title: true,
            isPinned: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        usageLogs: {
          select: {
            model: true,
            promptTokens: true,
            completionTokens: true,
            tokensUsed: true,
            createdAt: true,
            provider: {
              select: { name: true, type: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate aggregated tokens and messages
    const totalMessages = user.conversations.reduce((acc, c) => acc + c._count.messages, 0);

    const tokenAggregation = await prisma.usageLog.aggregate({
      where: { userId: id },
      _sum: {
        tokensUsed: true,
        promptTokens: true,
        completionTokens: true,
      },
    });

    const isUserBanned = user.isBanned;
    const isUserTimedOut = Boolean(!isUserBanned && user.timeoutUntil && user.timeoutUntil > now);
    const computedStatus = isUserBanned ? "banned" : isUserTimedOut ? "timeout" : "active";

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastActiveAt: user.lastActiveAt,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        banReason: user.banReason || user.bannedReason || null,
        timeoutUntil: user.timeoutUntil,
        timeoutReason: user.timeoutReason,
        computedStatus,
        totalMessages,
        personalProvidersCount: user._count.userProviders, // count only, NO key contents!
        conversationsCount: user._count.conversations,
        tokens: {
          total: tokenAggregation._sum.tokensUsed || 0,
          prompt: tokenAggregation._sum.promptTokens || 0,
          completion: tokenAggregation._sum.completionTokens || 0,
        },
        recentConversations: user.conversations,
        recentUsage: user.usageLogs,
      },
    });
  } catch (err) {
    console.error("Fetch user details error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const dataToUpdate: Record<string, unknown> = {};

    // 1. Ban action
    if (body.action === "ban" || body.isBanned === true) {
      dataToUpdate.isBanned = true;
      dataToUpdate.bannedAt = new Date();
      const reason = body.reason || body.banReason || "مسدودسازی توسط مدیر سیستم";
      dataToUpdate.banReason = reason;
      dataToUpdate.bannedReason = reason;
    }

    // 2. Unban action
    if (body.action === "unban" || body.isBanned === false) {
      dataToUpdate.isBanned = false;
      dataToUpdate.bannedAt = null;
      dataToUpdate.banReason = null;
      dataToUpdate.bannedReason = null;
    }

    // 3. Timeout action
    if (body.action === "timeout" || typeof body.durationMinutes === "number") {
      const minutes = Number(body.durationMinutes) || 10;
      dataToUpdate.timeoutUntil = new Date(Date.now() + minutes * 60 * 1000);
      dataToUpdate.timeoutReason = body.reason || body.timeoutReason || "محدودیت موقت دسترسی";
    }

    // 4. Remove timeout action
    if (body.action === "remove-timeout" || body.removeTimeout === true) {
      dataToUpdate.timeoutUntil = null;
      dataToUpdate.timeoutReason = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        bannedReason: true,
        timeoutUntil: true,
        timeoutReason: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
