import { prisma } from "../src/lib/prisma";
import { createSession } from "../src/lib/auth";

const BASE_URL = "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runPhase6Tests() {
  console.log("=================================================");
  console.log("  PHASE 6 TEST SUITE: Admin User Management,");
  console.log("  Ban, Timeout & Server-side Restrictions");
  console.log("=================================================\n");

  const adminPassword = process.env.ADMIN_PASSWORD || "ArkaAdminSecure2026";

  // Step 1: Admin Authentication & Endpoint Protection
  console.log("Test 1: Admin Authentication & Security Check (Route Hiding)");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: adminPassword }),
  });
  assert(loginRes.status === 200, "Admin login succeeds with 200 OK");
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const adminCookie = cookieHeader.split(";")[0];
  assert(adminCookie.includes("arka_admin_session="), "Admin session cookie obtained");

  // Unauthenticated requests MUST return 404
  const unauthUsersRes = await fetch(`${BASE_URL}/api/admin/users`);
  assert(unauthUsersRes.status === 404, "Unauthenticated GET /api/admin/users returns 404 (hidden)");

  const unauthBanRes = await fetch(`${BASE_URL}/api/admin/users/dummy-id/ban`, {
    method: "POST",
  });
  assert(unauthBanRes.status === 404, "Unauthenticated POST /api/admin/users/[id]/ban returns 404 (hidden)");

  // Step 2: Create Distinct Test Users
  console.log("\nTest 2: Create Test Users for Search, Ban & Timeout");
  const timestamp = Date.now();
  const user1Email = `reza.tester.${timestamp}@gmail.com`;
  const user2Email = `sara.developer.${timestamp}@yahoo.com`;
  const user3Email = `ali.searchtest.${timestamp}@company.org`;

  const user1 = await prisma.user.create({
    data: {
      email: user1Email,
      googleId: `gid_${timestamp}_1`,
      name: "رضا تستری",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: user2Email,
      googleId: `gid_${timestamp}_2`,
      name: "سارا دولوپر",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: user3Email,
      googleId: `gid_${timestamp}_3`,
      name: "علی جستجوپذیر",
    },
  });

  assert(Boolean(user1.id && user2.id && user3.id), "3 test users created in database");

  // Create session cookies for test users
  const { token: user1Token } = await createSession(user1);
  const user1Cookie = `arka_session=${user1Token}`;

  const { token: user2Token } = await createSession(user2);
  const user2Cookie = `arka_session=${user2Token}`;

  // Step 3: Search Functionality (by partial name & email)
  console.log("\nTest 3: Search User by Partial Name and Email");
  // Search by name "دولوپر"
  const searchNameRes = await fetch(`${BASE_URL}/api/admin/users?search=دولوپر`, {
    headers: { Cookie: adminCookie },
  });
  assert(searchNameRes.status === 200, "GET /api/admin/users?search=دولوپر returns 200 OK");
  const searchNameData = await searchNameRes.json();
  assert(
    searchNameData.users.some((u: { id: string }) => u.id === user2.id),
    "Search by partial Persian name matches user2 (سارا دولوپر)",
  );

  // Search by partial email "tester"
  const searchEmailRes = await fetch(`${BASE_URL}/api/admin/users?search=tester`, {
    headers: { Cookie: adminCookie },
  });
  assert(searchEmailRes.status === 200, "GET /api/admin/users?search=tester returns 200 OK");
  const searchEmailData = await searchEmailRes.json();
  assert(
    searchEmailData.users.some((u: { id: string }) => u.id === user1.id),
    "Search by partial email matches user1 (reza.tester)",
  );

  // Search non-existent
  const searchNoneRes = await fetch(`${BASE_URL}/api/admin/users?search=nonexistentxyz987654`, {
    headers: { Cookie: adminCookie },
  });
  const searchNoneData = await searchNoneRes.json();
  assert(searchNoneData.users.length === 0, "Search for non-existent keyword returns empty array");

  // Step 4: Verify Initial User Chat Works
  console.log("\nTest 4: User 1 Can Chat Normally Before Ban");
  const initialChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user1Cookie,
    },
    body: JSON.stringify({
      message: "پیام اولیه تست قبل از اعمال مسدودیت",
    }),
  });
  assert(initialChatRes.status === 200, "Active user chat succeeds with 200 OK");

  // Step 5: Ban User 1 & Verify Backend Rejection
  console.log("\nTest 5: Ban User 1 & Verify Direct API Block (Backend Enforcement)");
  const banRes = await fetch(`${BASE_URL}/api/admin/users/${user1.id}/ban`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      reason: "تست نقض قوانین امنیتی و ارسال اسپم",
    }),
  });
  assert(banRes.status === 200, "POST /api/admin/users/[id]/ban returns 200 OK");
  const banData = await banRes.json();
  assert(banData.user.isBanned === true, "User isBanned updated to true in DB");
  assert(banData.user.banReason === "تست نقض قوانین امنیتی و ارسال اسپم", "Ban reason saved correctly");

  // Check direct API call to /api/chat by Banned User 1 -> MUST BE REJECTED WITH 403
  const bannedChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user1Cookie,
    },
    body: JSON.stringify({
      message: "تلاش کاربر مسدودشده برای ارسال پیام",
    }),
  });
  assert(bannedChatRes.status === 403, "Direct chat API call by banned user blocked with HTTP 403 Forbidden");
  const bannedChatData = await bannedChatRes.json();
  assert(bannedChatData.error.includes("حساب شما مسدود شده است"), "Error message contains 'حساب شما مسدود شده است'");
  assert(bannedChatData.banned === true, "Response payload confirms banned: true");

  // Check /api/conversations by Banned User 1 -> MUST BE REJECTED WITH 403
  const bannedConvRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user1Cookie,
    },
    body: JSON.stringify({
      title: "تلاش برای ایجاد گفتگوی مسدود",
    }),
  });
  assert(bannedConvRes.status === 403, "Creating conversation by banned user blocked with HTTP 403 Forbidden");

  // Check /api/auth/session for Banned User 1
  const bannedSessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: user1Cookie },
  });
  const bannedSessionData = await bannedSessionRes.json();
  assert(bannedSessionData.user.isBanned === true, "/api/auth/session reports isBanned: true");

  // Step 6: Banned Users List Filtering
  console.log("\nTest 6: Banned Users Tab/Filter Verification");
  const bannedListRes = await fetch(`${BASE_URL}/api/admin/users?status=banned`, {
    headers: { Cookie: adminCookie },
  });
  assert(bannedListRes.status === 200, "GET /api/admin/users?status=banned returns 200 OK");
  const bannedListData = await bannedListRes.json();
  const foundInBanned = bannedListData.users.find((u: { id: string }) => u.id === user1.id);
  assert(Boolean(foundInBanned), "Banned user appears in banned users filter list");
  assert(foundInBanned.computedStatus === "banned", "Computed status is 'banned'");
  assert(Boolean(foundInBanned.bannedAt), "Ban date is recorded and returned");

  // Step 7: Unban User 1 & Verify Immediate Restoration
  console.log("\nTest 7: Unban User 1 & Immediate Access Restoration");
  const unbanRes = await fetch(`${BASE_URL}/api/admin/users/${user1.id}/unban`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(unbanRes.status === 200, "POST /api/admin/users/[id]/unban returns 200 OK");
  const unbanData = await unbanRes.json();
  assert(unbanData.user.isBanned === false, "User isBanned restored to false");
  assert(unbanData.user.banReason === null, "Ban reason cleared");

  // Chat again after unban -> MUST SUCCEED WITH 200
  const unbannedChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user1Cookie,
    },
    body: JSON.stringify({
      message: "پیام تستی پس از رفع مسدودیت موفق",
    }),
  });
  assert(unbannedChatRes.status === 200, "Unbanned user can immediately chat again (200 OK)");

  // Step 8: Apply 1-Second Timeout to User 2 (Testing auto-restoration without admin)
  console.log("\nTest 8: Short Timeout & Automatic Expiration Without Admin Intervention");
  // Set short timeout (0.05 min ≈ 3 seconds) directly or test 1-min timeout
  const timeoutUntilDate = new Date(Date.now() + 2500); // 2.5 seconds
  await prisma.user.update({
    where: { id: user2.id },
    data: {
      timeoutUntil: timeoutUntilDate,
      timeoutReason: "تست تایم‌اوت کوتاه خودکار",
    },
  });

  // Try chat immediately while timeout is active -> MUST BE REJECTED WITH 429
  const activeTimeoutChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user2Cookie,
    },
    body: JSON.stringify({
      message: "تلاش در حین تایم‌اوت",
    }),
  });
  assert(activeTimeoutChatRes.status === 429, "Chat attempt during timeout rejected with HTTP 429 Too Many Requests");
  const timeoutChatData = await activeTimeoutChatRes.json();
  assert(timeoutChatData.error.includes("شما موقتاً محدود شده‌اید"), "Error message contains 'شما موقتاً محدود شده‌اید'");

  // Wait 3 seconds for timeout to naturally expire
  console.log("    Waiting 3.2 seconds for timeout expiration...");
  await new Promise((resolve) => setTimeout(resolve, 3200));

  // Chat after natural expiration WITHOUT admin intervention -> MUST SUCCEED WITH 200
  const autoRestoredChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user2Cookie,
    },
    body: JSON.stringify({
      message: "پیام پس از انقضای خودکار تایم‌اوت",
    }),
  });
  assert(
    autoRestoredChatRes.status === 200,
    "After timeout expires, user access is automatically restored with zero admin intervention (200 OK)",
  );

  // Step 9: Early Timeout Removal by Admin
  console.log("\nTest 9: Admin Timeout & Early Removal");
  // Apply 60 minutes timeout via Admin API
  const applyTimeoutRes = await fetch(`${BASE_URL}/api/admin/users/${user2.id}/timeout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      durationMinutes: 60,
      reason: "تست محدودیت ۱ ساعته",
    }),
  });
  assert(applyTimeoutRes.status === 200, "POST /api/admin/users/[id]/timeout (60m) returns 200 OK");
  const applyTimeoutData = await applyTimeoutRes.json();
  assert(Boolean(applyTimeoutData.timeoutUntil), "timeoutUntil date returned in response");

  // Verify user appears in timedOut filter
  const timeoutListRes = await fetch(`${BASE_URL}/api/admin/users?status=timeout`, {
    headers: { Cookie: adminCookie },
  });
  const timeoutListData = await timeoutListRes.json();
  const foundTimedOut = timeoutListData.users.find((u: { id: string }) => u.id === user2.id);
  assert(Boolean(foundTimedOut), "User appears in timedOut users list");

  // Admin removes timeout early
  const removeTimeoutRes = await fetch(`${BASE_URL}/api/admin/users/${user2.id}/remove-timeout`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(removeTimeoutRes.status === 200, "POST /api/admin/users/[id]/remove-timeout returns 200 OK");
  const removeTimeoutData = await removeTimeoutRes.json();
  assert(removeTimeoutData.user.timeoutUntil === null, "User timeoutUntil cleared");

  // Chat succeeds immediately after early removal
  const chatAfterEarlyRemoveRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: user2Cookie,
    },
    body: JSON.stringify({
      message: "تست چت پس از حذف زودهنگام تایم‌اوت توسط ادمین",
    }),
  });
  assert(chatAfterEarlyRemoveRes.status === 200, "Chat immediately works after early timeout removal (200 OK)");

  // Step 10: User Detailed Profile & Zero Key Leak Verification
  console.log("\nTest 10: User Detailed Profile & Security Check (Zero Key Leaks)");
  // Add a personal provider to user3
  await prisma.userProvider.create({
    data: {
      userId: user3.id,
      name: "User3 Secret Provider",
      providerType: "openai",
      encryptedApiKey: "encrypted_secret_data_never_leak",
      keyMask: "sk-...9999",
      status: "connected",
    },
  });

  const userDetailsRes = await fetch(`${BASE_URL}/api/admin/users/${user3.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert(userDetailsRes.status === 200, "GET /api/admin/users/[id] returns 200 OK");
  const detailsData = await userDetailsRes.json();
  assert(detailsData.user.id === user3.id, "User ID matches");
  assert(detailsData.user.name === "علی جستجوپذیر", "User name matches");
  assert(detailsData.user.personalProvidersCount === 1, "Personal providers count matches (1)");
  assert(detailsData.user.userProviders === undefined, "Security: userProviders array NOT exposed");
  assert(JSON.stringify(detailsData).includes("encrypted_secret_data") === false, "Security: Zero key data leakage in user details");

  // Step 11: Cleanup Test Users
  console.log("\nCleaning up test users...");
  await prisma.user.deleteMany({
    where: {
      id: { in: [user1.id, user2.id, user3.id] },
    },
  }).catch(() => {});

  console.log("\n=================================================");
  console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
