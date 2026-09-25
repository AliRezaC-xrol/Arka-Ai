import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.adminMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Deleting adminMessage cascades and deletes all recipients
    await prisma.adminMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedForAll: true });
  } catch (err) {
    console.error("Delete broadcast for all error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
