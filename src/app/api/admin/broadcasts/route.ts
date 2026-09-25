import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const messages = await prisma.adminMessage.findMany({
      orderBy: { sentAt: "desc" },
      include: {
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const formattedMessages = messages.map((msg) => {
      // Exclude deleted recipients for active counts
      const activeRecipients = msg.recipients.filter((r) => !r.isDeleted);
      const totalRecipients = activeRecipients.length;
      const readRecipients = activeRecipients.filter((r) => r.isRead).length;
      const readPercentage =
        totalRecipients > 0 ? Math.round((readRecipients / totalRecipients) * 100) : 0;

      return {
        id: msg.id,
        title: msg.title,
        content: msg.content,
        sentAt: msg.sentAt,
        sentToAll: msg.sentToAll,
        stats: {
          totalRecipients,
          readRecipients,
          unreadRecipients: totalRecipients - readRecipients,
          readPercentage,
          deletedRecipients: msg.recipients.filter((r) => r.isDeleted).length,
        },
        recipients: msg.recipients.map((r) => ({
          recipientId: r.id,
          userId: r.userId,
          name: r.user.name,
          email: r.user.email,
          avatarUrl: r.user.avatarUrl,
          isRead: r.isRead,
          readAt: r.readAt,
          isDeleted: r.isDeleted,
        })),
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (err) {
    console.error("Fetch admin broadcasts error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const content = (body.content || "").trim();
  const title = (body.title || "").trim() || null;
  const sentToAll = Boolean(body.sentToAll);
  const recipientUserIds: string[] = Array.isArray(body.recipientUserIds)
    ? body.recipientUserIds
    : body.recipientUserId
      ? [body.recipientUserId]
      : [];

  if (!content) {
    return NextResponse.json({ error: "متن پیام الزامی است." }, { status: 400 });
  }

  try {
    let targetUserIds: string[] = [];

    if (sentToAll) {
      const allUsers = await prisma.user.findMany({
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    } else {
      if (recipientUserIds.length === 0) {
        return NextResponse.json(
          { error: "حداقل یک کاربر گیرنده باید انتخاب شود یا گزینه ارسال به همه فعال گردد." },
          { status: 400 },
        );
      }
      targetUserIds = recipientUserIds;
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: "هیچ کاربری در سیستم برای دریافت پیام یافت نشد." },
        { status: 400 },
      );
    }

    // Create admin message and recipient records in transaction
    const newAdminMessage = await prisma.adminMessage.create({
      data: {
        title,
        content,
        sentToAll,
        sentAt: new Date(),
        recipients: {
          create: targetUserIds.map((userId) => ({
            userId,
            isRead: false,
            isDeleted: false,
          })),
        },
      },
      include: {
        recipients: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ message: newAdminMessage }, { status: 201 });
  } catch (err) {
    console.error("Create admin broadcast error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
