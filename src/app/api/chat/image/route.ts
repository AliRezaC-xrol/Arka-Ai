/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const model = body.model || "FLUX.1 Schnell";
  let conversationId = body.conversationId;

  if (!conversationId) {
    const newConv = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: `تولید تصویر: ${prompt.slice(0, 30)}`,
        isPinned: false,
      },
    });
    conversationId = newConv.id;
  }

  // Create user prompt message
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: prompt,
      contentType: "text",
    },
  });

  // Generate SVG visual mock
  const encoded = encodeURIComponent(prompt.slice(0, 40));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="100%" height="100%">
    <rect width="1024" height="768" fill="#0d0d0d" />
    <circle cx="512" cy="384" r="300" fill="#18181b" />
    <circle cx="512" cy="384" r="220" stroke="#3f3f46" stroke-width="2" fill="none" />
    <path d="M 312 384 L 712 384 M 512 184 L 512 584" stroke="#52525b" stroke-width="1.5" />
    <text x="512" y="370" text-anchor="middle" fill="#ffffff" font-size="28" font-family="sans-serif" font-weight="bold">${model}</text>
    <text x="512" y="420" text-anchor="middle" fill="#a1a1aa" font-size="18" font-family="sans-serif">${encoded}</text>
  </svg>`;
  const imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const assistantContent = JSON.stringify({
    imageUrl,
    caption: `تصویر تولیدشده برای پرامپت: «${prompt}»`,
  });

  const assistantMsg = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: assistantContent,
      contentType: "image",
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    conversationId,
    messageId: assistantMsg.id,
    imageUrl,
    contentType: "image",
  });
}
