import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/crypto";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const provider = await prisma.userProvider.findFirst({
      where: { id, userId: user.id },
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

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (err) {
    console.error("Failed to fetch provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const existing = await prisma.userProvider.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      dataToUpdate.name = body.name.trim();
    }

    if (body.baseUrl !== undefined) {
      dataToUpdate.baseUrl = body.baseUrl ? body.baseUrl.trim() : null;
    }

    if (typeof body.models === "string") {
      dataToUpdate.models = body.models.trim();
    }

    // If updating the API key, re-encrypt it
    if (typeof body.apiKey === "string" && body.apiKey.trim()) {
      dataToUpdate.encryptedApiKey = encryptApiKey(body.apiKey.trim());
      dataToUpdate.keyMask = maskApiKey(body.apiKey.trim());
      dataToUpdate.status = "untested";
    }

    const updated = await prisma.userProvider.update({
      where: { id },
      data: dataToUpdate,
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

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Failed to update provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.userProvider.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    await prisma.userProvider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete provider:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
