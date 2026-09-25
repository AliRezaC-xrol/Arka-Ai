/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest, clearAdminCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.adminSession.delete({ where: { tokenHash } }).catch(() => {});
  }

  const response = NextResponse.json({ success: true });
  clearAdminCookie(response);
  return response;
}
