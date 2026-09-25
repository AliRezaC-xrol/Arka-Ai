/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        models: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("Fetch site providers error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
