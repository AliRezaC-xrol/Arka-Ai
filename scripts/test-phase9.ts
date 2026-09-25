import { prisma } from "../src/lib/prisma";
import { createSession, upsertGoogleUser } from "../src/lib/auth";

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

async function runPhase9Tests() {
  console.log("=================================================================");
  console.log("  PHASE 9: COMPREHENSIVE END-TO-END & SYSTEM INTEGRATION TESTING  ");
  console.log("=================================================================\n");

  const timestamp = Date.now();

  // =================================================================
  // SECTION 1: COMPREHENSIVE PROVIDER & API FAILOVER / SWITCHING
  // =================================================================
  console.log("--- SECTION 1: Complete Provider & API Failover / Switching ---");

  // Setup: Admin session to create a site provider with 2 keys
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || "arka-secure-admin-2026" }),
  });
  assert(adminLoginRes.status === 200, "Admin login successful for test setup");
  const adminCookie = adminLoginRes.headers.get("set-cookie") || "";

  // 1.1 Create Site Provider with 2 Keys (Primary + Backup Failover)
  const createProvRes = await fetch(`${BASE_URL}/api/admin/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `TestFailoverProvider_${timestamp}`,
      type: "openai",
      baseUrl: "https://api.openai.com/v1",
      models: "gpt-4o, gpt-4o-mini",
      apiKey: "sk-fail-primary-test-key-1",
      keyLabel: "Primary Key 1",
    }),
  });
  assert(createProvRes.status === 201, "Site provider created with primary key");
  const provData = await createProvRes.json();
  const providerId = provData.provider.id;

  // Add Backup Key 2
  const addBackupKeyRes = await fetch(`${BASE_URL}/api/admin/providers/${providerId}/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      label: "Backup Key 2",
      apiKey: "sk-live-backup-test-key-2",
    }),
  });
  assert(addBackupKeyRes.status === 201, "Backup key added to site provider");
  await addBackupKeyRes.json();

  // Create a regular test user for chat
  const userA = await prisma.user.create({
    data: {
      email: `user.a.${timestamp}@example.com`,
      googleId: `gid_a_${timestamp}`,
      name: "کاربر آزمایشی الف",
    },
  });
  const { token: tokenA } = await createSession(userA);
  const cookieA = `arka_session=${tokenA}`;

  // 1.2 Intentionally Trigger Failover on Key 1 -> verify seamless switch to Key 2
  const failoverChatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieA,
      "x-simulate-failover": "true",
    },
    body: JSON.stringify({
      message: "تست فیل‌اور خودکار بدون قطعی",
      model: "gpt-4o",
      providerId,
    }),
  });
  assert(failoverChatRes.status === 200, "Chat request with simulated Key 1 failure returns 200 OK");
  assert(
    failoverChatRes.headers.get("content-type")?.includes("text/event-stream") || false,
    "Chat response is uninterrupted SSE stream",
  );
  const failoverStreamText = await failoverChatRes.text();
  assert(failoverStreamText.includes("done"), "SSE stream completes with 'done' event");

  // Verify Key 1 was marked exhausted and Key 2 remained active with incremented usage
  const provKeysInDb = await prisma.providerApiKey.findMany({
    where: { providerId },
  });
  const primaryKey = provKeysInDb.find((k) => k.label?.includes("Primary"))!;
  const backupKey = provKeysInDb.find((k) => k.label?.includes("Backup"))!;
  assert(primaryKey?.status === "exhausted", "Faulty Primary Key marked as 'exhausted'");
  assert(backupKey?.status === "active", "Backup Key remains 'active'");
  assert(backupKey?.usageCount >= 1, "Backup Key usageCount was incremented");

  // 1.3 User Personal Provider (BYOK) Valid & Invalid Connection Tests
  // Valid key
  const validByokRes = await fetch(`${BASE_URL}/api/user-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      name: "OpenAI BYOK معتبر",
      providerType: "openai",
      apiKey: "sk-proj-valid-byok-test-key-1234",
      testNow: true,
    }),
  });
  assert(validByokRes.status === 201, "Add valid personal provider returns 201");
  const validByok = await validByokRes.json();
  assert(validByok.provider?.status === "connected", "Valid personal provider status is 'connected'");
  assert(
    validByok.provider?.keyMask?.startsWith("sk-") && validByok.provider?.keyMask?.includes("..."),
    "Key is masked in response",
  );

  // Invalid key
  const invalidByokRes = await fetch(`${BASE_URL}/api/user-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      name: "Anthropic BYOK نامعتبر",
      providerType: "anthropic",
      apiKey: "sk-ant-invalid-error-key",
      testNow: true,
    }),
  });
  assert(invalidByokRes.status === 201, "Add invalid personal provider returns 201");
  const invalidByok = await invalidByokRes.json();
  assert(invalidByok.provider?.status === "disconnected", "Invalid personal provider status is 'disconnected'");
  assert(Boolean(invalidByok.provider?.lastTestMessage), "Error message clearly explains connection failure");

  // Isolation check: User B must NOT see User A's personal provider
  const userB = await prisma.user.create({
    data: {
      email: `user.b.${timestamp}@example.com`,
      googleId: `gid_b_${timestamp}`,
      name: "کاربر آزمایشی ب",
    },
  });
  const { token: tokenB } = await createSession(userB);
  const cookieB = `arka_session=${tokenB}`;

  const userBProvidersRes = await fetch(`${BASE_URL}/api/user-providers`, {
    headers: { Cookie: cookieB },
  });
  const userBProvidersData = await userBProvidersRes.json();
  const userBProviders = userBProvidersData.providers || [];
  const userAProviderFoundInB = userBProviders.some((p: { id: string }) => p.id === validByok.provider.id);
  assert(!userAProviderFoundInB, "User B's provider list DOES NOT contain User A's personal provider (Isolation)");

  // 1.4 Hybrid / Mixed Switching within the Same Conversation
  // Start conversation with Site Provider
  const msg1Res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      message: "پیام اول: با استفاده از پروایدر سایت",
      model: "gpt-4o",
      providerId,
    }),
  });
  const msg1Text = await msg1Res.text();
  const convIdMatch = msg1Text.match(/"conversationId":"([^"]+)"/);
  const mixedConvId = convIdMatch ? convIdMatch[1] : "";
  assert(Boolean(mixedConvId), "Conversation created for hybrid switching test");

  // Send second message in same conversation using User Personal Provider (BYOK)
  const msg2Res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      conversationId: mixedConvId,
      message: "پیام دوم: سوییچ به پروایدر شخصی بدون تغییر پنجره چت",
      userProviderId: validByok.provider.id,
      model: "gpt-4o",
    }),
  });
  assert(msg2Res.status === 200, "Message with Personal Provider in existing conversation succeeds (200 OK)");
  await msg2Res.text();

  // Send third message in same conversation switching back to default/site provider
  const msg3Res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      conversationId: mixedConvId,
      message: "پیام سوم: سوییچ مجدد به مدل کلاستر داخلی",
      model: "Claude Sonnet 4",
    }),
  });
  assert(msg3Res.status === 200, "Message switching back to cluster provider succeeds (200 OK)");
  await msg3Res.text();

  // Verify conversation history integrity
  const convHistoryRes = await fetch(`${BASE_URL}/api/conversations/${mixedConvId}`, {
    headers: { Cookie: cookieA },
  });
  const convHistoryData = await convHistoryRes.json();
  const convMessages = convHistoryData.conversation?.messages || [];
  assert(
    convMessages.length === 6,
    `Conversation contains exactly 6 messages (3 user + 3 assistant) (got: ${convMessages.length})`,
  );
  assert(
    convMessages[0]?.role === "user" && convMessages[1]?.role === "assistant",
    "Chronological order preserved: User 1 -> Assistant 1",
  );
  assert(
    convMessages[2]?.role === "user" && convMessages[3]?.role === "assistant",
    "Chronological order preserved: User 2 -> Assistant 2",
  );
  assert(
    convMessages[4]?.role === "user" && convMessages[5]?.role === "assistant",
    "Chronological order preserved: User 3 -> Assistant 3",
  );

  // =================================================================
  // SECTION 2: BAN & TIMEOUT SCENARIOS UNDER REAL PRESSURE
  // =================================================================
  console.log("\n--- SECTION 2: Ban & Timeout Scenarios Under Real Pressure ---");

  const bannedTestUser = await prisma.user.create({
    data: {
      email: `pressure.ban.${timestamp}@example.com`,
      googleId: `gid_ban_pressure_${timestamp}`,
      name: "کاربر تست بن همزمان",
    },
  });
  // Generate 3 concurrent session tokens for 3 browser tabs/devices
  const { token: tab1Token } = await createSession(bannedTestUser);
  const { token: tab2Token } = await createSession(bannedTestUser);
  const { token: tab3Token } = await createSession(bannedTestUser);

  // Initial sanity check: User can chat before ban
  const initialChat = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `arka_session=${tab1Token}` },
    body: JSON.stringify({ message: "سلام قبل از بن" }),
  });
  assert(initialChat.status === 200, "User can chat normally prior to ban");
  await initialChat.text();

  // Ban user via Admin API
  const banRes = await fetch(`${BASE_URL}/api/admin/users/${bannedTestUser.id}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ reason: "تست بن همزمان تب‌ها" }),
  });
  assert(banRes.status === 200, "Admin bans user successfully");

  // 2.1 Concurrent requests from 3 tabs simultaneously after ban
  const [tab1Res, tab2Res, tab3Res] = await Promise.all([
    fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `arka_session=${tab1Token}` },
      body: JSON.stringify({ message: "تلاش تب ۱ بعد از بن" }),
    }),
    fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `arka_session=${tab2Token}` },
      body: JSON.stringify({ message: "تلاش تب ۲ بعد از بن" }),
    }),
    fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `arka_session=${tab3Token}` },
      body: JSON.stringify({ message: "تلاش تب ۳ بعد از بن" }),
    }),
  ]);
  assert(
    tab1Res.status === 403 && tab2Res.status === 403 && tab3Res.status === 403,
    "All concurrent requests across multiple tabs/devices are blocked with HTTP 403 Forbidden",
  );
  const tab1Body = await tab1Res.json();
  assert(tab1Body.banned === true, "Tab 1 response confirms banned state");

  // 2.2 Timeout Applied & Handled Cleanly Without Crashing
  const timeoutUser = await prisma.user.create({
    data: {
      email: `pressure.timeout.${timestamp}@example.com`,
      googleId: `gid_timeout_pressure_${timestamp}`,
      name: "کاربر تست تایم‌اوت",
    },
  });
  const { token: timeoutToken } = await createSession(timeoutUser);

  // Apply timeout of 10 minutes
  await fetch(`${BASE_URL}/api/admin/users/${timeoutUser.id}/timeout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ duration: "10m", reason: "تست فشار تایم‌اوت" }),
  });

  // Multiple concurrent attempts during timeout
  const timeoutAttempts = await Promise.all([
    fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `arka_session=${timeoutToken}` },
      body: JSON.stringify({ message: "تلاش اول در تایم‌اوت" }),
    }),
    fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `arka_session=${timeoutToken}` },
      body: JSON.stringify({ message: "تلاش دوم در تایم‌اوت" }),
    }),
  ]);
  assert(
    timeoutAttempts.every((r) => r.status === 429),
    "Concurrent requests during timeout all receive HTTP 429 Too Many Requests cleanly",
  );

  // 2.3 Concurrent Unban while User Retries
  await fetch(`${BASE_URL}/api/admin/users/${bannedTestUser.id}/unban`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  const postUnbanRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `arka_session=${tab1Token}` },
    body: JSON.stringify({ message: "پیام فوری پس از رفع مسدودی" }),
  });
  assert(postUnbanRes.status === 200, "Immediate chat request after unban succeeds with 200 OK");
  await postUnbanRes.text();

  // =================================================================
  // SECTION 3: MULTI-USER CONCURRENCY & REAL LOAD SIMULATION
  // =================================================================
  console.log("\n--- SECTION 3: Multi-User Concurrency & Real Load Simulation ---");

  // 3.1 Race Condition on Google Account Creation (10 simultaneous requests for same email)
  console.log("  Running 10 simultaneous login requests for a single new Google user...");
  const raceEmail = `race.user.${timestamp}@example.com`;
  const raceGoogleId = `gid_race_${timestamp}`;

  const concurrentLoginResults = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      upsertGoogleUser({
        email: raceEmail,
        googleId: raceGoogleId,
        name: "کاربر همزمان گوگل",
      }),
    ),
  );
  const firstId = concurrentLoginResults[0].user.id;
  const allSameId = concurrentLoginResults.every((res) => res.user.id === firstId);
  assert(allSameId, "All 10 concurrent account creation requests returned the exact same user ID");

  const duplicateUsersInDb = await prisma.user.count({ where: { email: raceEmail } });
  assert(duplicateUsersInDb === 1, "Exactly ONE user created in PostgreSQL (Atomic race protection)");

  // 3.2 High-Concurrency Load Simulation (25 concurrent active users performing operations)
  console.log("  Simulating 25 concurrent users executing simultaneous operations...");
  const loadUsers = await Promise.all(
    Array.from({ length: 25 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `load.user.${i}.${timestamp}@example.com`,
          googleId: `gid_load_${i}_${timestamp}`,
          name: `کاربر بارگذاری ${i}`,
        },
      }),
    ),
  );

  const loadSessions = await Promise.all(loadUsers.map((u) => createSession(u)));

  // Concurrent mixed operations across the 25 users
  const t0 = Date.now();
  const concurrentOps = await Promise.all(
    loadSessions.map((session, i) => {
      const cookie = `arka_session=${session.token}`;
      if (i % 3 === 0) {
        // Send chat message
        return fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ message: `پیام تست همزمانی از کاربر ${i}` }),
        }).then(async (r) => {
          await r.text();
          return { type: "chat", status: r.status };
        });
      } else if (i % 3 === 1) {
        // Fetch notifications
        return fetch(`${BASE_URL}/api/notifications`, {
          headers: { Cookie: cookie },
        }).then((r) => ({ type: "notifications", status: r.status }));
      } else {
        // List personal providers
        return fetch(`${BASE_URL}/api/user-providers`, {
          headers: { Cookie: cookie },
        }).then((r) => ({ type: "user-providers", status: r.status }));
      }
    }),
  );
  const durationMs = Date.now() - t0;
  console.log(`  25 concurrent operations finished in ${durationMs}ms`);

  const allOpsSucceeded = concurrentOps.every((op) => op.status === 200);
  assert(allOpsSucceeded, "All 25 concurrent multi-user operations completed with HTTP 200 OK");

  // 3.3 Atomic Provider API Usage Counting
  const currentBackupKey = await prisma.providerApiKey.findUnique({
    where: { id: backupKey.id },
  });
  const initialKeyUsage = currentBackupKey?.usageCount || 0;
  console.log(`  Executing 10 concurrent requests on backup key (initial usage: ${initialKeyUsage})...`);

  // We make 10 parallel chat calls using providerId
  await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieA },
        body: JSON.stringify({
          message: `پیام شمارش مصرف ${i}`,
          model: "gpt-4o",
          providerId,
        }),
      }).then((r) => r.text()),
    ),
  );

  const updatedKey = await prisma.providerApiKey.findUnique({
    where: { id: backupKey.id },
  });
  const expectedUsage = initialKeyUsage + 10;
  assert(
    updatedKey?.usageCount === expectedUsage,
    `Key usage count incremented atomically by exactly 10 (expected ${expectedUsage}, got ${updatedKey?.usageCount})`,
  );

  // 3.4 Admin Dashboard Performance Under Load
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: adminCookie },
  });
  assert(statsRes.status === 200, "Admin /api/admin/stats responds with 200 OK under load");
  const statsData = await statsRes.json();
  assert(statsData.totalUsers >= 25, `Admin stats accurately counts totalUsers (${statsData.totalUsers})`);

  // =================================================================
  // SECTION 4: BASIC SECURITY & PEN-TESTING
  // =================================================================
  console.log("\n--- SECTION 4: Basic Security & Pen-testing ---");

  // 4.1 Admin Route Hiding (Unauthenticated access returns 404/401)
  const adminEndpoints = [
    "/api/admin/stats",
    "/api/admin/registrations",
    "/api/admin/providers",
    "/api/admin/users",
    "/api/admin/broadcasts",
    "/api/admin/usage",
  ];
  let adminHiddenCount = 0;
  for (const ep of adminEndpoints) {
    const res = await fetch(`${BASE_URL}${ep}`);
    if (res.status === 404 || res.status === 401 || res.status === 403) {
      adminHiddenCount++;
    }
  }
  assert(
    adminHiddenCount === adminEndpoints.length,
    `All ${adminEndpoints.length} sensitive admin endpoints are hidden (returned 404/401/403 without admin session)`,
  );

  // 4.2 Insecure Direct Object Reference (IDOR) Checks
  // User B tries to view User A's conversation
  const idorConvRes = await fetch(`${BASE_URL}/api/conversations/${mixedConvId}`, {
    headers: { Cookie: cookieB },
  });
  assert(idorConvRes.status === 404, "IDOR: User B cannot view User A's conversation (returns 404 Not Found)");

  // User B tries to delete User A's conversation
  const idorDeleteConvRes = await fetch(`${BASE_URL}/api/conversations/${mixedConvId}`, {
    method: "DELETE",
    headers: { Cookie: cookieB },
  });
  assert(idorDeleteConvRes.status === 404, "IDOR: User B cannot delete User A's conversation (returns 404 Not Found)");

  // User B tries to access/test User A's personal provider
  const idorProviderRes = await fetch(`${BASE_URL}/api/user-providers/${validByok.provider.id}/test`, {
    method: "POST",
    headers: { Cookie: cookieB },
  });
  assert(idorProviderRes.status === 404, "IDOR: User B cannot test User A's personal provider (returns 404 Not Found)");

  // 4.3 Zero API Key Leakage (AES-256-GCM Protection)
  // Check personal provider list response for User A
  const provListRes = await fetch(`${BASE_URL}/api/user-providers`, {
    headers: { Cookie: cookieA },
  });
  const provListText = await provListRes.text();
  assert(
    !provListText.includes("sk-proj-valid-byok-test-key-1234"),
    "Security: User's raw plaintext API key NEVER leaks in /api/user-providers",
  );
  assert(
    !provListText.includes("encryptedApiKey"),
    "Security: User's encrypted ciphertext NEVER leaks in /api/user-providers JSON response",
  );

  // Check Admin User Details endpoint
  const adminUserDetailsRes = await fetch(`${BASE_URL}/api/admin/users/${userA.id}`, {
    headers: { Cookie: adminCookie },
  });
  const adminUserDetailsText = await adminUserDetailsRes.text();
  assert(
    !adminUserDetailsText.includes("sk-proj-valid-byok-test-key-1234"),
    "Security: User's raw API key NEVER leaks in /api/admin/users/[id]",
  );

  // Check Public Site Providers endpoint
  const publicProvRes = await fetch(`${BASE_URL}/api/site-providers`);
  const publicProvText = await publicProvRes.text();
  assert(!publicProvText.includes("sk-"), "Security: Zero API keys leak in public /api/site-providers");

  // =================================================================
  // SECTION 5: COMPLETE END-TO-END USER JOURNEY
  // =================================================================
  console.log("\n--- SECTION 5: Complete End-to-End User Journey ---");

  const e2eEmail = `e2e.journey.${timestamp}@example.com`;
  const e2eGoogleId = `gid_e2e_${timestamp}`;

  // 1. First Google Login
  const e2eLogin1 = await upsertGoogleUser({
    email: e2eEmail,
    googleId: e2eGoogleId,
    name: "کاربر سفر جامع",
  });
  assert(e2eLogin1.isNew === true, "E2E Step 1: First login creates new user (isNew = true)");
  const { token: e2eToken1 } = await createSession(e2eLogin1.user);
  const e2eCookie1 = `arka_session=${e2eToken1}`;

  // 2. First Chat
  const e2eChat1 = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: e2eCookie1 },
    body: JSON.stringify({ message: "سلام! این اولین گفتگوی من در آرکا است." }),
  });
  assert(e2eChat1.status === 200, "E2E Step 2: First chat completes successfully");
  const e2eChat1Text = await e2eChat1.text();
  const e2eConvIdMatch = e2eChat1Text.match(/"conversationId":"([^"]+)"/);
  const e2eConvId = e2eConvIdMatch ? e2eConvIdMatch[1] : "";
  assert(Boolean(e2eConvId), "E2E Step 2: Conversation ID generated and saved");

  // 3. Add Personal Provider (BYOK)
  const e2eAddProviderRes = await fetch(`${BASE_URL}/api/user-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: e2eCookie1 },
    body: JSON.stringify({
      name: "کلید شخصی کاربر سفر جامع",
      providerType: "openai",
      apiKey: "sk-proj-e2e-personal-key-9988",
      testNow: true,
    }),
  });
  assert(e2eAddProviderRes.status === 201, "E2E Step 3: Personal provider created");
  const e2eProvider = await e2eAddProviderRes.json();

  // 4. Send Chat with Personal Provider
  const e2eChat2 = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: e2eCookie1 },
    body: JSON.stringify({
      conversationId: e2eConvId,
      message: "پیام دوم با پروایدر شخصی من",
      userProviderId: e2eProvider.provider.id,
    }),
  });
  assert(e2eChat2.status === 200, "E2E Step 4: Chat with personal provider succeeds");
  await e2eChat2.text();

  // 5. Admin sends Broadcast Message
  const e2eBroadcastRes = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "پیام خوش‌آمد ویژه ادمین",
      content: "به سامانه آرکا خوش آمدید. کلیدهای شما امن هستند.",
      sentToAll: true,
    }),
  });
  assert(e2eBroadcastRes.status === 201, "E2E Step 5: Admin sends global broadcast");

  // 6. User marks notification as read
  const e2eNotifListRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: e2eCookie1 },
  });
  const e2eNotifList = await e2eNotifListRes.json();
  const welcomeNotif = e2eNotifList.notifications.find((n: { title: string }) =>
    n.title.includes("پیام خوش‌آمد"),
  );
  assert(Boolean(welcomeNotif), "E2E Step 6: User receives admin broadcast notification");

  const e2eMarkReadRes = await fetch(`${BASE_URL}/api/notifications/${welcomeNotif.id}/read`, {
    method: "POST",
    headers: { Cookie: e2eCookie1 },
  });
  assert(e2eMarkReadRes.status === 200, "E2E Step 6: User marks notification as read");

  // 7. User Logs Out
  const e2eLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: e2eCookie1 },
  });
  assert(e2eLogoutRes.status === 200, "E2E Step 7: User logs out successfully");

  // 8. User Logs Back In with Google (Second Login)
  const e2eLogin2 = await upsertGoogleUser({
    email: e2eEmail,
    googleId: e2eGoogleId,
    name: "کاربر سفر جامع",
  });
  assert(e2eLogin2.isNew === false, "E2E Step 8: Second login recognizes existing user (isNew = false)");
  assert(e2eLogin2.user.id === e2eLogin1.user.id, "E2E Step 8: User ID is identical across logins");

  const { token: e2eToken2 } = await createSession(e2eLogin2.user);
  const e2eCookie2 = `arka_session=${e2eToken2}`;

  // 9. Verify EVERYTHING is intact
  // Conversation History
  const e2eVerifyConvRes = await fetch(`${BASE_URL}/api/conversations/${e2eConvId}`, {
    headers: { Cookie: e2eCookie2 },
  });
  const e2eVerifyConvData = await e2eVerifyConvRes.json();
  const e2eMessages = e2eVerifyConvData.conversation?.messages || [];
  assert(e2eMessages.length === 4, "E2E Step 9: Conversation history intact (4 messages)");

  // Personal Provider
  const e2eVerifyProvRes = await fetch(`${BASE_URL}/api/user-providers`, {
    headers: { Cookie: e2eCookie2 },
  });
  const e2eVerifyProvData = await e2eVerifyProvRes.json();
  const e2eVerifyProv = e2eVerifyProvData.providers || [];
  const e2eSavedProv = e2eVerifyProv.find((p: { id: string }) => p.id === e2eProvider.provider.id);
  assert(Boolean(e2eSavedProv), "E2E Step 9: Personal provider intact and available after re-login");

  // Notification Status
  const e2eVerifyNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: e2eCookie2 },
  });
  const e2eVerifyNotif = await e2eVerifyNotifRes.json();
  const e2eCheckedNotif = e2eVerifyNotif.notifications.find((n: { id: string }) => n.id === welcomeNotif.id);
  assert(e2eCheckedNotif?.isRead === true, "E2E Step 9: Notification read status intact (isRead = true)");

  // =================================================================
  // SECTION 6: RESPONSIVE & CROSS-BROWSER SIMULATION
  // =================================================================
  console.log("\n--- SECTION 6: Responsive & Cross-Browser Simulation ---");

  const browserProfiles = [
    {
      name: "Mobile iPhone SE / WebKit Safari",
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    },
    {
      name: "Desktop Windows / Chromium Chrome 124",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    {
      name: "Desktop Linux / Mozilla Firefox 125",
      ua: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
    {
      name: "Tablet Apple iPad / Mobile Safari",
      ua: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    },
  ];

  for (const profile of browserProfiles) {
    const landingRes = await fetch(`${BASE_URL}/`, {
      headers: { "User-Agent": profile.ua },
    });
    assert(landingRes.status === 200, `${profile.name} loads Landing Page (HTTP 200 OK)`);
    const landingHtml = await landingRes.text();
    assert(
      landingHtml.includes('dir="rtl"') && landingHtml.includes("ARKA"),
      `${profile.name} landing renders RTL and brand branding`,
    );

    const loginRes = await fetch(`${BASE_URL}/login`, {
      headers: { "User-Agent": profile.ua },
    });
    assert(loginRes.status === 200, `${profile.name} loads Login Page (HTTP 200 OK)`);
    const loginHtml = await loginRes.text();
    assert(
      loginHtml.includes("ورود با حساب گوگل") && !loginHtml.includes('type="password"'),
      `${profile.name} login page is Google-only with zero password fields`,
    );
  }

  // =================================================================
  // CLEANUP TEST DATA
  // =================================================================
  console.log("\nCleaning up Phase 9 test artifacts...");
  await prisma.provider.delete({ where: { id: providerId } }).catch(() => {});
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          userA.email,
          userB.email,
          bannedTestUser.email,
          timeoutUser.email,
          raceEmail,
          e2eEmail,
          ...loadUsers.map((u) => u.email),
        ],
      },
    },
  }).catch(() => {});

  console.log("\n=================================================================");
  console.log(`  PHASE 9 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch((err) => {
  console.error("Fatal error during Phase 9 tests:", err);
  process.exit(1);
});
