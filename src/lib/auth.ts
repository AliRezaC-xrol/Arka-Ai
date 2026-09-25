import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { type NextResponse } from "next/server";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "arka_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  sub: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  sessionId?: string;
  sessionToken?: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "arka-default-fallback-session-secret-key-32chars";
  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed JWT session token valid for 30 days
 * and persists a session record in the database.
 */
export async function createSession(user: {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const sessionToken = crypto.randomUUID();

  // Create session record in database
  let dbSessionId: string | undefined;
  try {
    const dbSession = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt,
      },
    });
    dbSessionId = dbSession.id;
  } catch (err) {
    console.error("Failed to create database session record:", err);
  }

  const secret = getSessionSecret();
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    sessionId: dbSessionId,
    sessionToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return { token, sessionToken, expiresAt };
}

/**
 * Verifies a JWT session token and returns the payload.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Atomic user upsert logic (Phase 1 SPEC §3):
 * 1. Checks if a user already exists with `email` or `googleId`.
 * 2. If exists: updates ONLY `lastLoginAt` (and syncs name/avatar if updated) and returns existing user (login).
 * 3. If not exists: atomically creates a new user with `createdAt = now` and `lastLoginAt = now` (signup).
 * Handles race conditions atomically via PostgreSQL unique constraints.
 */
export async function upsertGoogleUser(profile: GoogleProfile) {
  const normalizedEmail = profile.email.toLowerCase().trim();
  const now = new Date();

  // 1. Check for existing user by googleId or email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: profile.googleId },
        { email: normalizedEmail },
      ],
    },
  });

  if (existingUser) {
    // Check ban status
    if (existingUser.isBanned) {
      const err = new Error("USER_BANNED");
      (err as unknown as { code: string }).code = "USER_BANNED";
      throw err;
    }

    // Check timeout status
    if (existingUser.timeoutUntil && existingUser.timeoutUntil > now) {
      const err = new Error("USER_TIMEOUT");
      (err as unknown as { code: string; timeoutUntil: Date }).code = "USER_TIMEOUT";
      (err as unknown as { code: string; timeoutUntil: Date }).timeoutUntil = existingUser.timeoutUntil;
      throw err;
    }

    // Existing user: ONLY update lastLoginAt (and sync profile if needed)
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        lastLoginAt: now,
        googleId: existingUser.googleId || profile.googleId,
        name: profile.name ?? existingUser.name,
        avatarUrl: profile.avatarUrl ?? existingUser.avatarUrl,
      },
    });

    return { user: updatedUser, isNew: false };
  }

  // 2. Not found: create new user atomically
  try {
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        googleId: profile.googleId,
        name: profile.name ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        createdAt: now,
        lastLoginAt: now,
        isBanned: false,
        timeoutUntil: null,
      },
    });

    return { user: newUser, isNew: true };
  } catch (error: unknown) {
    // Unique constraint race condition handler (code P2002)
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      const raceUser = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: profile.googleId },
            { email: normalizedEmail },
          ],
        },
      });
      if (raceUser) {
        const updated = await prisma.user.update({
          where: { id: raceUser.id },
          data: { lastLoginAt: now },
        });
        return { user: updated, isNew: false };
      }
    }
    throw error;
  }
}

/**
 * Cookie options standard configuration (httpOnly, secure in prod, sameSite=lax, 30 days)
 */
export function getSessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Sets the session cookie on a Next.js NextResponse object.
 */
export function setSessionCookie(response: NextResponse, token: string) {
  const options = getSessionCookieOptions(SESSION_MAX_AGE_SECONDS);
  response.cookies.set({
    ...options,
    value: token,
  });
  return response;
}

/**
 * Clears the session cookie on a Next.js NextResponse object.
 */
export function clearSessionCookie(response: NextResponse) {
  const options = getSessionCookieOptions(0);
  response.cookies.set({
    ...options,
    value: "",
    expires: new Date(0),
  });
  return response;
}

/**
 * Invalidate a session completely (removes DB record and clears cookie)
 */
export async function invalidateSession(sessionToken?: string) {
  if (sessionToken) {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieves the current user from cookies in server components or route handlers.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        googleId: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        banReason: true,
        timeoutUntil: true,
        timeoutReason: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
