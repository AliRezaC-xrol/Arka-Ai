import { prisma } from "../src/lib/prisma";
import { executeWithFailover } from "../src/lib/provider-failover";
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

async function runPhase5Tests() {
  console.log("=================================================");
  console.log("  PHASE 5 TEST SUITE: Admin Provider Management,");
  console.log("  Failover, Multiple Keys & Usage Analytics");
  console.log("=================================================\n");

  const adminPassword = process.env.ADMIN_PASSWORD || "ArkaAdminSecure2026";

  // Step 0: Login as Admin to get session cookie
  console.log("Test 1: Admin Authentication & Endpoint Protection");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: adminPassword }),
  });
  assert(loginRes.status === 200, "Admin login succeeds with 200 OK");
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const adminCookie = cookieHeader.split(";")[0];
  assert(adminCookie.includes("arka_admin_session="), "Received admin session cookie");

  // Verify unauthorized access returns 404
  const unauthRes = await fetch(`${BASE_URL}/api/admin/providers`, {
    method: "GET",
  });
  assert(unauthRes.status === 404, "Unauthenticated GET /api/admin/providers returns 404 (hidden)");

  const unauthUsageRes = await fetch(`${BASE_URL}/api/admin/usage`, {
    method: "GET",
  });
  assert(unauthUsageRes.status === 404, "Unauthenticated GET /api/admin/usage returns 404 (hidden)");

  // Step 1: Create a test user for chat and usage analytics
  console.log("\nTest 2: Setup Test User and Session");
  const testUserEmail = `test.p5.${Date.now()}@example.com`;
  const testUser = await prisma.user.create({
    data: {
      email: testUserEmail,
      googleId: `google_id_${Date.now()}`,
      name: "کاربر تست فاز پنج",
    },
  });
  assert(Boolean(testUser.id), "Test user created in database");

  // Create user session cookie
  const { token: userJwtToken } = await createSession(testUser);
  const userCookie = `arka_session=${userJwtToken}`;

  // Step 2: Create a Site Provider with Initial Key via Admin API
  console.log("\nTest 3: Add Provider with 2 API Keys via Admin API");
  const providerName = `OpenAI Enterprise Clustered ${Date.now()}`;
  const createProviderRes = await fetch(`${BASE_URL}/api/admin/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: providerName,
      type: "openai",
      models: "gpt-4o, gpt-4o-mini",
      apiKey: "sk-proj-primaryKeyForFailoverTest1234567890",
      keyLabel: "Primary Key 1",
    }),
  });
  assert(createProviderRes.status === 201, "POST /api/admin/providers returns 201 Created");
  const createData = await createProviderRes.json();
  const providerId = createData.provider?.id;
  assert(Boolean(providerId), "Created provider has valid UUID");
  assert(createData.provider.name === providerName, "Provider name matches custom display name");
  assert(createData.provider.apiKeys.length === 1, "Provider created with 1 initial key");
  assert(createData.provider.apiKeys[0].label === "Primary Key 1", "Key label saved correctly");
  assert(createData.provider.apiKeys[0].keyMask.startsWith("sk-..."), "Key mask generated correctly");

  // Add Key 2 to Provider
  const addKeyRes = await fetch(`${BASE_URL}/api/admin/providers/${providerId}/keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      label: "Backup Key 2",
      apiKey: "sk-proj-backupSecondaryKeyForFailover9876543210",
    }),
  });
  assert(addKeyRes.status === 201, "POST /api/admin/providers/[id]/keys returns 201 Created");
  const addKeyData = await addKeyRes.json();
  assert(addKeyData.key.label === "Backup Key 2", "Second key added with correct label");
  assert(addKeyData.key.status === "active", "Second key has 'active' status");

  // Step 3: Verify Provider appears in Public /api/site-providers for ModelPicker
  console.log("\nTest 4: Provider Visibility in ModelPicker API");
  const siteProvidersRes = await fetch(`${BASE_URL}/api/site-providers`);
  assert(siteProvidersRes.status === 200, "GET /api/site-providers returns 200 OK");
  const siteProvidersData = await siteProvidersRes.json();
  const foundSiteProvider = siteProvidersData.providers.find((p: { id: string }) => p.id === providerId);
  assert(Boolean(foundSiteProvider), "Active provider is visible in /api/site-providers");
  assert(foundSiteProvider.name === providerName, "Custom provider name exposed for ModelPicker");
  assert(foundSiteProvider.models.includes("gpt-4o"), "Available models exposed for ModelPicker");
  assert(foundSiteProvider.apiKeys === undefined, "Security: API keys are NEVER exposed publicly");

  // Step 4: Chat using Provider with normal 2-key cluster
  console.log("\nTest 5: Chat Execution with Site Provider");
  const chatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: userCookie,
    },
    body: JSON.stringify({
      message: "تست ارسال پیام با پروایدر کلاستر شده آرکا",
      model: "gpt-4o",
      providerId: providerId,
    }),
  });
  assert(chatRes.status === 200, "Chat request with site provider returns 200 OK");
  const chatText = await chatRes.text();
  const assembledText = chatText
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => {
      try {
        return JSON.parse(line.replace("data: ", ""));
      } catch {
        return null;
      }
    })
    .filter((c) => c && c.type === "chunk")
    .map((c) => c.text)
    .join("");

  assert(assembledText.includes(providerName), "Chat response contains site provider custom name");

  // Step 5: Test Simulated Key Failure and Automatic Failover to Key 2
  console.log("\nTest 6: Automatic Key Failover (Simulated Key 1 Quota Failure)");
  // Direct test of failover engine
  const failoverDirectRes = await executeWithFailover({
    providerId,
    model: "gpt-4o",
    prompt: "تست فیل‌اور خودکار سیستم در صورت اتمام موجودی کلید اول",
    userId: testUser.id,
    simulateFirstKeyFailure: true,
  });

  assert(failoverDirectRes.success === true, "Failover call succeeded with zero disruption");
  assert(failoverDirectRes.attempts === 2, "Failover engine attempted 2 keys (failed key 1 -> succeeded key 2)");
  assert(failoverDirectRes.tokensUsed > 0, "Tokens calculated and logged correctly");

  // Step 6: Verify Key 1 is marked as "exhausted" but not deleted, and Key 2 remains active
  console.log("\nTest 7: Verify Key Statuses in DB after Failover");
  const dbKeys = await prisma.providerApiKey.findMany({
    where: { providerId },
    orderBy: { createdAt: "asc" },
  });
  assert(dbKeys.length === 2, "Both keys still exist in DB (exhausted key is NOT deleted)");
  const exhaustedKey = dbKeys.find((k) => k.status === "exhausted");
  const activeKey = dbKeys.find((k) => k.status === "active");
  assert(Boolean(exhaustedKey), "Faulty key marked as 'exhausted'");
  assert(Boolean(exhaustedKey?.lastErrorMessage?.includes("Quota exceeded")), "Faulty key records failure reason");
  assert(Boolean(activeKey), "Second key remains 'active'");
  assert(Boolean(activeKey && activeKey.usageCount >= 1), "Second key usageCount was incremented");

  // Step 7: Usage Analytics Verification
  console.log("\nTest 8: Usage Analytics Aggregation, Top Provider/Model & Top User");
  const usageRes = await fetch(`${BASE_URL}/api/admin/usage?period=week&providerId=${providerId}`, {
    headers: { Cookie: adminCookie },
  });
  assert(usageRes.status === 200, "GET /api/admin/usage returns 200 OK");
  const usageData = await usageRes.json();
  assert(usageData.summary.totalTokens > 0, "Total tokens aggregated accurately");
  assert(usageData.summary.totalRequests >= 1, "Total requests count recorded");
  assert(usageData.summary.topProvider !== null, "Top provider calculated");
  assert(usageData.summary.topModel !== null, "Top model calculated");
  assert(usageData.topUsers.length > 0, "Top users list populated");
  assert(usageData.topUsers[0].userId === testUser.id, "Top user correctly identified as our test user");

  // Step 8: Toggle Provider Inactive -> verify immediate disappearance from ModelPicker
  console.log("\nTest 9: Deactivate Provider & Verify ModelPicker Disappearance");
  const deactivateRes = await fetch(`${BASE_URL}/api/admin/providers/${providerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ isActive: false }),
  });
  assert(deactivateRes.status === 200, "PATCH /api/admin/providers/[id] (isActive=false) returns 200 OK");

  // Check public site providers
  const siteProvidersAfterDeactivate = await fetch(`${BASE_URL}/api/site-providers`);
  const inactiveCheckData = await siteProvidersAfterDeactivate.json();
  const hiddenProvider = inactiveCheckData.providers.find((p: { id: string }) => p.id === providerId);
  assert(hiddenProvider === undefined, "Deactivated provider is immediately hidden from /api/site-providers");

  // Historical logs are preserved even when provider is inactive
  const usageAfterDeactivate = await fetch(`${BASE_URL}/api/admin/usage?period=week&providerId=${providerId}`, {
    headers: { Cookie: adminCookie },
  });
  const usageAfterData = await usageAfterDeactivate.json();
  assert(usageAfterData.summary.totalTokens > 0, "Historical usage logs preserved when provider is inactive");

  // Step 9: Re-activate Key from exhausted back to active
  console.log("\nTest 10: Admin Key Reactivation");
  const keyToReactivate = exhaustedKey || dbKeys[0];
  const reactivateKeyRes = await fetch(`${BASE_URL}/api/admin/providers/${providerId}/keys/${keyToReactivate.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ status: "active" }),
  });
  assert(reactivateKeyRes.status === 200, "PATCH key status back to 'active' returns 200 OK");
  const reactivatedKeyData = await reactivateKeyRes.json();
  assert(reactivatedKeyData.key.status === "active", "Key status successfully restored to active");
  assert(reactivatedKeyData.key.lastErrorMessage === null, "Error message cleared upon reactivation");

  // Step 10: Provider Deletion (Cascade delete keys & usage logs)
  console.log("\nTest 11: Provider Deletion & Cascading");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/providers/${providerId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert(deleteRes.status === 200, "DELETE /api/admin/providers/[id] returns 200 OK");

  const checkProviderDeleted = await prisma.provider.findUnique({
    where: { id: providerId },
  });
  assert(checkProviderDeleted === null, "Provider completely removed from database");

  const checkKeysDeleted = await prisma.providerApiKey.findMany({
    where: { providerId },
  });
  assert(checkKeysDeleted.length === 0, "Associated keys cascaded and deleted");

  // Cleanup test user
  await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});

  console.log("\n=================================================");
  console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
