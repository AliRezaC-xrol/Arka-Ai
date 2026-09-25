/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string; userId: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const token = getAdminTokenFromRequest(request);
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id: adminMessageId, userId } = await params;

  try {
    const recipient = await prisma.messageRecipient.findFirst({
      where: {
        adminMessageId,
        userId,
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Mark as deleted for this specific user
    const updated = await prisma.messageRecipient.update({
      where: { id: recipient.id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, recipient: updated });
  } catch (err) {
    console.error("Delete broadcast for single recipient error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
