import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";
import { getDefaultModels, testProviderConnection } from "@/lib/provider-tester";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const providers = await prisma.userProvider.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        keyMask: true,
        models: true,
        status: true,
        lastTestedAt: true,
        lastTestMessage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ providers });
  } catch (err) {
    console.error("Failed to fetch user providers:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const providerType = (body.providerType || "").toLowerCase().trim();
  const baseUrl = body.baseUrl ? body.baseUrl.trim() : null;
  const apiKey = (body.apiKey || "").trim();
  const testNow = Boolean(body.testNow);

  if (!name) {
    return NextResponse.json({ error: "نام پروایدر الزامی است." }, { status: 400 });
  }

  if (!["openai", "anthropic", "google", "custom"].includes(providerType)) {
    return NextResponse.json(
      { error: "نوع پروایدر نامعتبر است. (openai, anthropic, google, custom)" },
      { status: 400 },
    );
  }

  if (!apiKey) {
    return NextResponse.json({ error: "کلید API الزامی است." }, { status: 400 });
  }

  // Optional connection test
  let status = "untested";
  let lastTestMessage: string | null = null;
  let detectedModels = getDefaultModels(providerType);

  if (testNow) {
    const testResult = await testProviderConnection({
      providerType,
      apiKey,
      baseUrl,
    });
    status = testResult.ok ? "connected" : "disconnected";
    lastTestMessage = testResult.message;
    if (testResult.models && testResult.models.length > 0) {
      detectedModels = testResult.models;
    }
  }

  try {
    // Encrypt the sensitive key before DB insertion (AES-256-GCM)
    const encryptedApiKey = encryptApiKey(apiKey);
    const keyMask = maskApiKey(apiKey);

    const provider = await prisma.userProvider.create({
      data: {
        userId: user.id,
        name,
        providerType,
        baseUrl,
        encryptedApiKey,
        keyMask,
        models: detectedModels.join(","),
        status,
        lastTestedAt: testNow ? new Date() : null,
        lastTestMessage,
      },
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        keyMask: true,
        models: true,
        status: true,
        lastTestedAt: true,
        lastTestMessage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ provider, testResult: { status, message: lastTestMessage } }, { status: 201 });
  } catch (err) {
    console.error("Failed to create user provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
