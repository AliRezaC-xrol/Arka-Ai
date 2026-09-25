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
