import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export const ADMIN_COOKIE_NAME = "arka_admin_session";
export const ADMIN_SESSION_HOURS = 24;

// Global server start time for uptime calculation
const globalForUptime = globalThis as unknown as {
  __arkaServerStartedAt?: number;
};

if (!globalForUptime.__arkaServerStartedAt) {
  globalForUptime.__arkaServerStartedAt = Date.now();
}

export function getServerStartTime(): number {
  return globalForUptime.__arkaServerStartedAt || Date.now();
}

export function formatUptime(startedAt: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const days = Math.floor(diffSeconds / (24 * 3600));
  const hours = Math.floor((diffSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} روز`);
  if (hours > 0 || days > 0) parts.push(`${hours} ساعت`);
  parts.push(`${minutes} دقیقه`);

  return parts.join(" و ") || "کمتر از یک دقیقه";
}

// In-memory brute-force protection
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkAdminRateLimit(ipOrKey: string): {
  isLocked: boolean;
  remainingMinutes?: number;
} {
  const record = rateLimitMap.get(ipOrKey);
  const now = Date.now();

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Clear expired lock
  if (record && record.lockedUntil && record.lockedUntil <= now) {
    rateLimitMap.delete(ipOrKey);
  }

  return { isLocked: false };
}

export function recordFailedAdminAttempt(ipOrKey: string): {
  isLocked: boolean;
  remainingMinutes?: number;
  attempts: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ipOrKey) || { attempts: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 10 * 60 * 1000; // 10 minutes lock
    rateLimitMap.set(ipOrKey, record);
    return { isLocked: true, remainingMinutes: 10, attempts: record.attempts };
  }

  rateLimitMap.set(ipOrKey, record);
  return { isLocked: false, attempts: record.attempts };
}

export function resetAdminRateLimit(ipOrKey: string) {
  rateLimitMap.delete(ipOrKey);
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "c-xrol-arka-admin-2026";
}

/**
 * Creates an admin session record in PostgreSQL and returns the session token.
 */
export async function createAdminSession(): Promise<string> {
  const rawToken = crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Verifies if the request carries a valid admin session.
 */
export async function verifyAdminSession(rawToken?: string | null): Promise<boolean> {
  if (!rawToken) return false;

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
    });

    if (!session) return false;
    if (session.expiresAt <= new Date()) {
      // Session expired, remove it
      await prisma.adminSession.delete({ where: { tokenHash } }).catch(() => {});
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts admin token from cookie OR authorization header (x-admin-token)
 * ensuring seamless auth in iframes, cross-origin previews and native browsers.
 */
export function getAdminTokenFromRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
  headers: { get: (name: string) => string | null };
}): string | undefined {
  const cookieVal = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieVal) return cookieVal;

  const headerVal = request.headers.get("x-admin-token");
  if (headerVal) return headerVal;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

/**
 * Fast verification from cookieStore for server components
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSession(token);
}

/**
 * Sets admin session cookie on a response
 */
export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  return response;
}

/**
 * Clears admin session cookie
 */
export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
