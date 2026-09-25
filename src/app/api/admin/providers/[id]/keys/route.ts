import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = await verifyAdminSession(token);
  if (!isAuthed) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { id: providerId } = await params;
  const body = await request.json().catch(() => ({}));
  const apiKey = (body.apiKey || "").trim();
  const label = (body.label || "کلید جدید").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "کلید API الزامی است." }, { status: 400 });
  }

  try {
    const encryptedApiKey = encryptApiKey(apiKey);
    const keyMask = maskApiKey(apiKey);

    const newKey = await prisma.providerApiKey.create({
      data: {
        providerId,
        encryptedApiKey,
        keyMask,
        label,
        status: "active",
      },
      select: {
        id: true,
        label: true,
        keyMask: true,
        status: true,
        lastUsedAt: true,
        lastErrorMessage: true,
        usageCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ key: newKey }, { status: 201 });
  } catch (err) {
    console.error("Failed to add provider key:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
