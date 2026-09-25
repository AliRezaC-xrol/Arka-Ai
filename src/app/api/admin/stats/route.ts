import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  formatUptime,
  getServerStartTime,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);

  // Return 404 if not authenticated to prevent path disclosure
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    // 1. Total users
    const totalUsers = await prisma.user.count();

    // 2. Total messages across system
    const totalMessages = await prisma.message.count();

    // 3. Online users (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: fiveMinutesAgo,
        },
      },
    });

    // 4. Top user by message count
    const usersWithMessages = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        conversations: {
          select: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    let topUserName = "بدون پیام";
    let maxMessageCount = 0;

    for (const u of usersWithMessages) {
      const userMessageTotal = u.conversations.reduce(
        (sum, c) => sum + (c._count?.messages || 0),
        0,
      );
      if (userMessageTotal > maxMessageCount) {
        maxMessageCount = userMessageTotal;
        topUserName = u.name || u.email.split("@")[0] || "کاربر";
      }
    }

    // 5. System uptime
    const startedAt = getServerStartTime();
    const uptime = formatUptime(startedAt);

    return NextResponse.json({
      totalUsers,
      totalMessages,
      onlineUsers,
      topUser: {
        name: topUserName,
        messageCount: maxMessageCount,
      },
      uptime,
      startedAt,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
