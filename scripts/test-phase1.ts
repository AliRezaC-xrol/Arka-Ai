import { prisma } from "../src/lib/prisma";
import {
  createSession,
  verifySessionToken,
  upsertGoogleUser,
  SESSION_COOKIE_NAME,
} from "../src/lib/auth";

async function runTests() {
  console.log("=================================================");
  console.log("   ARKA — Phase 1 Authentication Test Suite      ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // Clean test data before run
    const testEmail1 = `test.user.${Date.now()}@example.com`;
    const testGoogleId1 = `g_id_${Date.now()}`;

    // -------------------------------------------------------------
    // Test 1: First login with new Google account -> new record in DB
    // -------------------------------------------------------------
    console.log("Test 1: First login with new Google account");
    const result1 = await upsertGoogleUser({
      email: testEmail1,
      googleId: testGoogleId1,
      name: "کاربر تستی ۱",
      avatarUrl: "https://example.com/avatar1.png",
    });

    assert(result1.isNew === true, "isNew is true on first login");
    assert(!!result1.user.id, "User ID is generated (UUID)");
    assert(result1.user.email === testEmail1, "Email matches correctly");
    assert(result1.user.googleId === testGoogleId1, "Google ID matches correctly");
    assert(result1.user.isBanned === false, "Default isBanned is false");
    assert(result1.user.timeoutUntil === null, "Default timeoutUntil is null");

    const dbUser1 = await prisma.user.findUnique({
      where: { email: testEmail1 },
    });
    assert(!!dbUser1, "User record exists in PostgreSQL users table");

    // -------------------------------------------------------------
    // Test 2: Second login with same Google account -> NO duplicate, lastLoginAt updated
    // -------------------------------------------------------------
    console.log("\nTest 2: Second login with same Google account (no duplicate)");
    const initialCreatedAt = dbUser1!.createdAt;
    const initialLastLoginAt = dbUser1!.lastLoginAt;

    // Small delay so timestamps differ
    await new Promise((r) => setTimeout(r, 100));

    const result2 = await upsertGoogleUser({
      email: testEmail1,
      googleId: testGoogleId1,
      name: "کاربر تستی ۱ (آپدیت)",
    });

    assert(result2.isNew === false, "isNew is false on repeated login");
    assert(result2.user.id === dbUser1!.id, "User ID is identical (same record)");
    assert(
      result2.user.createdAt.getTime() === initialCreatedAt.getTime(),
      "createdAt is preserved and not modified",
    );
    assert(
      result2.user.lastLoginAt.getTime() > initialLastLoginAt.getTime(),
      "lastLoginAt is updated to newer time",
    );

    const count = await prisma.user.count({
      where: { email: testEmail1 },
    });
    assert(count === 1, "Exactly one record exists in DB for this email (count === 1)");

    // -------------------------------------------------------------
    // Test 3: Concurrency / race condition test (atomic unique constraint)
    // -------------------------------------------------------------
    console.log("\nTest 3: Concurrency / race condition atomic check");
    const concurrentEmail = `race.${Date.now()}@example.com`;
    const concurrentGoogleId = `race_gid_${Date.now()}`;

    const concurrentResults = await Promise.all(
      Array.from({ length: 8 }).map((_, idx) =>
        upsertGoogleUser({
          email: concurrentEmail,
          googleId: `${concurrentGoogleId}_${idx === 0 ? "main" : "sub"}`,
          name: `Concurrent User ${idx}`,
        }).catch((e) => ({ user: null, error: e })),
      ),
    );

    const raceUsers = await prisma.user.findMany({
      where: { email: concurrentEmail },
    });
    assert(raceUsers.length === 1, "Concurrency test: exactly 1 user created under race conditions");

    // -------------------------------------------------------------
    // Test 4: Session creation, 30-day JWT, and DB session record
    // -------------------------------------------------------------
    console.log("\nTest 4: Session generation and JWT validation");
    const sessionRes = await createSession(result1.user);
    assert(!!sessionRes.token, "JWT token string generated");
    assert(!!sessionRes.sessionToken, "sessionToken UUID generated");

    const payload = await verifySessionToken(sessionRes.token);
    assert(payload?.sub === result1.user.id, "JWT sub matches user.id");
    assert(payload?.email === result1.user.email, "JWT email matches user.email");

    // Check expiration ~ 30 days (2592000 seconds)
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = payload?.exp || 0;
    const diffDays = (expSec - nowSec) / (24 * 3600);
    assert(
      Math.round(diffDays) === 30,
      `Session expiration is ~30 days (got ${diffDays.toFixed(1)} days)`,
    );

    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: sessionRes.sessionToken },
    });
    assert(!!dbSession, "Session record persisted in database sessions table");
    assert(dbSession?.userId === result1.user.id, "Session references correct user.id");

    console.log("\n=================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test suite encountered unexpected error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
