import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = (body.reason || "مسدودسازی توسط مدیر سیستم").trim();

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
        bannedReason: reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Ban user error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
