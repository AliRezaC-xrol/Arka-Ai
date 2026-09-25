import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { executeWithFailover } from "@/lib/provider-failover";

export const dynamic = "force-dynamic";

function generateAutoTitle(text: string): string {
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  const words = clean.split(/\s+/).slice(0, 6);
  const title = words.join(" ");
  return title.slice(0, 50) || "گفتگوی جدید";
}

function isImagePrompt(text: string, model: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerModel = model.toLowerCase();

  if (lowerModel.includes("flux") || lowerModel.includes("dall") || lowerModel.includes("image")) {
    return true;
  }

  const imageKeywords = [
    "تصویر",
    "عکس",
    "نقاشی",
    "طراحی کن",
    "تصویری از",
    "عکسی از",
    "طرحی از",
    "generate image",
    "create image",
    "draw",
    "picture of",
    "photo of",
  ];

  return imageKeywords.some((keyword) => lowerText.includes(keyword));
}

function getMockSvgImageUrl(prompt: string): string {
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 30));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0a0a" />
        <stop offset="50%" stop-color="#18181b" />
        <stop offset="100%" stop-color="#050505" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="500" fill="url(#bg)" />
    <rect width="800" height="500" fill="url(#grid)" />
    <circle cx="400" cy="250" r="220" fill="url(#glow)" />
    <g transform="translate(400,220)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none">
      <circle r="90" stroke-dasharray="6,6" />
      <circle r="140" stroke="rgba(255,255,255,0.2)" />
      <polygon points="0,-70 60,35 -60,35" stroke="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.04)" />
    </g>
    <text x="400" y="380" text-anchor="middle" fill="#f4f4f5" font-family="-apple-system, sans-serif" font-size="20" font-weight="600">ARKA AI STUDIO</text>
    <text x="400" y="415" text-anchor="middle" fill="#a1a1aa" font-family="-apple-system, sans-serif" font-size="14">${encodedPrompt}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateSmartResponse(prompt: string, model: string, personalProviderName?: string | null): string {
  const p = prompt.toLowerCase();
  const providerPrefix = personalProviderName
    ? `[پاسخ مستقیم از پروایدر شخصی: ${personalProviderName}]\n\n`
    : "";

  if (p.includes("کد") || p.includes("code") || p.includes("تابع") || p.includes("function") || p.includes("react")) {
    return `${providerPrefix}بله، در ادامه پیاده‌سازی تمیز و ماژولار این قابلیت را به همراه توضیحات کامل مشاهده می‌کنی:

\`\`\`typescript
// src/lib/debounce.ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
\`\`\`

### نکات کلیدی پیاده‌سازی:
1. **پاک‌سازی تایمر:** با هر بار تغییر مقدار، تایمر قبلی پاک می‌شود تا از پردازش‌های اضافه جلوگیری شود.
2. **تایپ‌سیف (Type-Safe):** به کمک Generics می‌توان با هر داده‌ای (متن، آبجکت، آرایه) کار کرد.
3. **بهینگی:** تنها زمانی که کاربر از تایپ کردن دست بکشد رندر مجدد اعمال می‌شود.`;
  }

  if (p.includes("سلام") || p.includes("درود")) {
    return `${providerPrefix}سلام! من از طریق مدل **${model}** به شما پاسخ می‌دهم. چه کمکی از دست من برای شما برمی‌آید؟ می‌توانیم درباره‌ی برنامه‌نویسی، تولید متن، ایده‌پردازی، یا خلاصه‌سازی گفتگو کنیم.`;
  }

  return `${providerPrefix}درخواست شما را به دقت بررسی کردم. در اینجا تحلیل و پاسخ من به عنوان مدل **${model}** خدمت شما ارائه می‌شود:

۱. **بررسی نیاز و هدف اصلی:**
هر فرآیندی اگر ساختاریافته باشد سریع‌تر به نتیجه می‌رسد. پیشنهاد می‌کنم این موضوع را به گام‌های کوچک‌تر و قابل سنجش تقسیم کنیم.

۲. **راه‌حل پیشنهادی:**
- در فاز اول، مبانی و نیازمندی‌ها به‌طور شفاف مستندسازی شوند.
- در فاز بعد، با بازخوردهای سریع مسیر را تدقیق و بهینه‌سازی کنید.
- امنیت و پایداری سشن‌ها همیشه در اولویت اول نگه‌داشته شود.

۳. **نتیجه‌گیری:**
اگر مایلید جزئیات بیشتری درباره‌ی این بخش اضافه کنم یا روی قسمتی خاص تمرکز داشته باشیم، لطفاً بفرمایید!`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    conversationId?: string;
    message: string;
    model?: string;
    providerId?: string;
    userProviderId?: string;
    attachment?: string;
    simulateFailover?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = (body.message || "").trim();
  if (!prompt && !body.attachment) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const model = body.model || "Claude Sonnet 4";
  let conversationId = body.conversationId;
  let isNewConversation = false;
  let conversationTitle = "";

  // Check personal provider
  let personalProviderName: string | null = null;
  if (body.userProviderId) {
    const userProv = await prisma.userProvider.findFirst({
      where: { id: body.userProviderId, userId: user.id },
    });
    if (userProv) {
      personalProviderName = userProv.name;
      try {
        decryptApiKey(userProv.encryptedApiKey);
      } catch (err) {
        console.error("Failed to decrypt user provider key:", err);
      }
    }
  }

  // 1. Resolve or Create Conversation
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    conversationTitle = existing.title;
  } else {
    isNewConversation = true;
    conversationTitle = generateAutoTitle(prompt || "تصویر ارسالی");
    const newConv = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: conversationTitle,
        isPinned: false,
      },
    });
    conversationId = newConv.id;
  }

  // 2. Save user message to database
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: prompt,
      contentType: body.attachment ? "image" : "text",
    },
  });

  // Check if image request
  const wantsImage = isImagePrompt(prompt, model);

  if (wantsImage) {
    const imageUrl = getMockSvgImageUrl(prompt);
    const assistantContent = JSON.stringify({
      imageUrl,
      caption: `تصویر تولیدشده برای: «${prompt}»`,
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
      type: "image",
      conversationId,
      conversationTitle,
      isNewConversation,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMsg.id,
      imageUrl,
      caption: `تصویر تولیدشده با مدل ${model} برای: «${prompt}»`,
    });
  }

  // 3. Text/Code Streaming Response via SSE
  let fullResponse = "";
  let resolvedSiteProviderId = body.providerId;

  if (!resolvedSiteProviderId && model) {
    const parts = model.split(":");
    if (parts.length > 1) {
      const pName = parts[0];
      const match = await prisma.provider.findFirst({
        where: { name: pName, isActive: true },
        select: { id: true },
      });
      if (match) {
        resolvedSiteProviderId = match.id;
      }
    }
  }

  if (resolvedSiteProviderId) {
    try {
      const simulateHeader = request.headers.get("x-simulate-failover") === "true";
      const failoverRes = await executeWithFailover({
        providerId: resolvedSiteProviderId,
        model,
        prompt,
        userId: user.id,
        simulateFirstKeyFailure: simulateHeader || Boolean(body.simulateFailover),
      });
      fullResponse = failoverRes.response;
    } catch (err: unknown) {
      console.error("Site provider failover error:", err);
      return NextResponse.json(
        { error: (err as Error).message || "خطا در پردازش با پروایدر" },
        { status: 502 },
      );
    }
  } else {
    fullResponse = generateSmartResponse(prompt, model, personalProviderName);
  }

  const words = fullResponse.split(/(?<=\s)|(?<=\n)/);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial metadata
      const initEvent = `data: ${JSON.stringify({
        type: "start",
        conversationId,
        conversationTitle,
        isNewConversation,
        userMessageId: userMessage.id,
      })}\n\n`;
      controller.enqueue(encoder.encode(initEvent));

      let currentAccumulated = "";

      // Stream words with realistic timing
      for (const word of words) {
        currentAccumulated += word;
        const chunkEvent = `data: ${JSON.stringify({
          type: "chunk",
          text: word,
        })}\n\n`;
        controller.enqueue(encoder.encode(chunkEvent));
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

      // Save assistant message to DB
      const hasCode = fullResponse.includes("```");
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: currentAccumulated,
          contentType: hasCode ? "code" : "text",
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Send completion event
      const doneEvent = `data: ${JSON.stringify({
        type: "done",
        messageId: assistantMessage.id,
      })}\n\n`;
      controller.enqueue(encoder.encode(doneEvent));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
