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

async function runPhase8Tests() {
  console.log("=================================================");
  console.log("  PHASE 8 TEST SUITE: Hero Finalization,");
  console.log("  Exclusive Google Login & Auto-Redirects");
  console.log("=================================================\n");

  // Step 1: Unauthenticated Visitor on Hero Landing Page (/)
  console.log("Test 1: Unauthenticated Hero Landing Page (/) & CTA Links");
  const heroRes = await fetch(`${BASE_URL}/`, {
    redirect: "manual",
  });
  assert(heroRes.status === 200, "Unauthenticated request to / returns HTTP 200 OK (no redirect for guests)");
  const heroHtml = await heroRes.text();
  assert(heroHtml.includes("/login"), "Hero page contains CTA links directing guests to /login");
  assert(heroHtml.includes("شروع"), "Hero page contains 'شروع' CTA buttons");
  assert(heroHtml.includes("Claude Sonnet 4"), "Hero showcase renders multimedia AI models (Claude Sonnet 4)");
  assert(heroHtml.includes("DeepSeek-R1"), "Hero showcase features syntax code generation (DeepSeek-R1)");
  assert(heroHtml.includes("FLUX.1 Schnell"), "Hero showcase features Image Studio (FLUX.1 Schnell)");
  assert(heroHtml.includes("BYOK") || heroHtml.includes("پروایدر شخصی"), "Hero showcase features personal providers & failover");

  // Step 2: Login Page Exclusivity (Google OAuth Only, NO Email/Password Forms)
  console.log("\nTest 2: Login Page Exclusivity (Only Google Button, Zero Credentials Form)");
  const loginRes = await fetch(`${BASE_URL}/login`, {
    redirect: "manual",
  });
  assert(loginRes.status === 200, "GET /login returns HTTP 200 OK");
  const loginHtml = await loginRes.text();
  assert(loginHtml.includes("ورود با حساب گوگل"), "Login page contains 'ورود با حساب گوگل' button");
  assert(!loginHtml.includes('type="password"'), "Strict Check: Zero password inputs on login page");
  assert(!loginHtml.includes('name="password"'), "Strict Check: Zero password field names on login page");
  assert(!loginHtml.includes('type="email"'), "Strict Check: Zero email form input on login page");

  // Step 3: Login Page Error States
  console.log("\nTest 3: Login Page Visual Error States");
  // Error: cancelled
  const errCancelledRes = await fetch(`${BASE_URL}/login?error=cancelled`);
  const errCancelledHtml = await errCancelledRes.text();
  assert(errCancelledHtml.includes("ورود با حساب گوگل لغو شد"), "Login page renders clear message for error=cancelled");

  // Error: timeout
  const errTimeoutRes = await fetch(`${BASE_URL}/login?error=timeout`);
  const errTimeoutHtml = await errTimeoutRes.text();
  assert(errTimeoutHtml.includes("Timeout") || errTimeoutHtml.includes("وقفه"), "Login page renders timeout error message");

  // Error: banned
  const errBannedRes = await fetch(`${BASE_URL}/login?error=banned`);
  const errBannedHtml = await errBannedRes.text();
  assert(errBannedHtml.includes("مسدود شده است"), "Login page renders banned account error message");

  // Step 4: Authenticated User Accessing Hero (/) MUST Redirect to /chat
  console.log("\nTest 4: Authenticated User Accessing / Automatically Redirects to /chat");
  const timestamp = Date.now();
  const testUser = await prisma.user.create({
    data: {
      email: `auth.redirect.${timestamp}@example.com`,
      googleId: `gid_redirect_${timestamp}`,
      name: "کاربر ریدایرکت",
    },
  });

  const { token: userToken } = await createSession(testUser);
  const userCookie = `arka_session=${userToken}`;

  const authHeroRes = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: userCookie },
    redirect: "manual",
  });
  const heroRedirectStatus = authHeroRes.status;
  const heroRedirectLocation = authHeroRes.headers.get("location") || "";
  assert(
    heroRedirectStatus === 307 || heroRedirectStatus === 302,
    `Authenticated user visiting / is redirected (got HTTP ${heroRedirectStatus})`,
  );
  assert(
    heroRedirectLocation.endsWith("/chat"),
    `Redirect target location is /chat (got: ${heroRedirectLocation})`,
  );

  // Step 5: Authenticated User Accessing /login MUST Redirect to /chat
  console.log("\nTest 5: Authenticated User Accessing /login Automatically Redirects to /chat");
  const authLoginRes = await fetch(`${BASE_URL}/login`, {
    headers: { Cookie: userCookie },
    redirect: "manual",
  });
  const loginRedirectStatus = authLoginRes.status;
  const loginRedirectLocation = authLoginRes.headers.get("location") || "";
  assert(
    loginRedirectStatus === 307 || loginRedirectStatus === 302,
    `Authenticated user visiting /login is redirected (got HTTP ${loginRedirectStatus})`,
  );
  assert(
    loginRedirectLocation.endsWith("/chat"),
    `Login redirect target location is /chat (got: ${loginRedirectLocation})`,
  );

  // Step 6: Mobile Simulation Viewport Request
  console.log("\nTest 6: Simulated Mobile Device Viewport Request");
  const mobileHeroRes = await fetch(`${BASE_URL}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    },
    redirect: "manual",
  });
  assert(mobileHeroRes.status === 200, "Mobile User-Agent visiting / receives HTTP 200 OK");
  const mobileHtml = await mobileHeroRes.text();
  assert(mobileHtml.includes("ARKA"), "Mobile response contains brand header");
  assert(mobileHtml.includes("/login"), "Mobile response contains login CTA buttons");

  // Step 7: Cleanup
  console.log("\nCleaning up test user...");
  await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});

  console.log("\n=================================================");
  console.log(`  PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
