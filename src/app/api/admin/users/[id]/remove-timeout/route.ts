import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        timeoutUntil: null,
        timeoutReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        timeoutUntil: true,
        timeoutReason: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Remove timeout error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
