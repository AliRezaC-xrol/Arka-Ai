import http from "http";
import { prisma } from "../src/lib/prisma";
import { getAdminPassword, resetAdminRateLimit } from "../src/lib/admin-auth";
import { upsertGoogleUser } from "../src/lib/auth";

const BASE_URL = "http://127.0.0.1:3000";

async function makeRequest(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) {
  return new Promise<{
    status: number;
    headers: Record<string, string | string[] | undefined>;
    data: string;
  }>((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            data: body,
          });
        });
      },
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runPhase4Tests() {
  console.log("=================================================");
  console.log("   ARKA — Phase 4 Admin Panel & Dashboard Tests  ");
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
    const testIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
    resetAdminRateLimit(testIp);

    const adminPassword = getAdminPassword();

    // -------------------------------------------------------------
    // Test 1: Access /api/admin/* without session -> MUST return 404
    // -------------------------------------------------------------
    console.log("Test 1: Unauthenticated request to /api/admin/* returns 404 (route hiding)");
    const unauthStatsRes = await makeRequest("/api/admin/stats");
    assert(
      unauthStatsRes.status === 404,
      "Direct unauthenticated GET /api/admin/stats returns HTTP 404",
      `got ${unauthStatsRes.status}`,
    );

    const unauthRegRes = await makeRequest("/api/admin/registrations");
    assert(
      unauthRegRes.status === 404,
      "Direct unauthenticated GET /api/admin/registrations returns HTTP 404",
      `got ${unauthRegRes.status}`,
    );

    // -------------------------------------------------------------
    // Test 2: Admin login with wrong password -> error 401
    // -------------------------------------------------------------
    console.log("\nTest 2: Admin login with wrong password");
    const wrongLoginRes = await makeRequest("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": testIp,
      },
      body: JSON.stringify({ password: "wrong-password-123" }),
    });
    assert(wrongLoginRes.status === 401, "Wrong password returns HTTP 401");
    const wrongData = JSON.parse(wrongLoginRes.data);
    assert(
      wrongData.error.includes("نادرست"),
      `Error message received (got: ${wrongData.error})`,
    );

    // -------------------------------------------------------------
    // Test 3: Brute-force protection: 5 failed attempts -> 429 lockout
    // -------------------------------------------------------------
    console.log("\nTest 3: Brute-force rate limiting (lockout after 5 attempts)");
    // Already did 1 attempt above; do 4 more to reach 5
    for (let i = 2; i <= 5; i++) {
      await makeRequest("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": testIp,
        },
        body: JSON.stringify({ password: `wrong-${i}` }),
      });
    }

    // 6th attempt should be blocked with 429
    const lockedRes = await makeRequest("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": testIp,
      },
      body: JSON.stringify({ password: adminPassword }),
    });
    assert(
      lockedRes.status === 429,
      "6th attempt is locked out with HTTP 429",
      `got ${lockedRes.status}`,
    );
    const lockedData = JSON.parse(lockedRes.data);
    assert(lockedData.locked === true, "Locked flag is true");
    assert(
      lockedData.error.includes("قفل"),
      `Lockout message received (got: ${lockedData.error})`,
    );

    // -------------------------------------------------------------
    // Test 4: Admin login with correct password -> 200 & cookie
    // -------------------------------------------------------------
    console.log("\nTest 4: Admin login with correct password");
    const validIp = `10.0.0.${Math.floor(Math.random() * 200) + 10}`;
    const loginRes = await makeRequest("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": validIp,
      },
      body: JSON.stringify({ password: adminPassword }),
    });

    assert(loginRes.status === 200, "Valid password returns HTTP 200");
    const setCookie = loginRes.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie || "";
    assert(cookieHeader.includes("arka_admin_session="), "Cookie arka_admin_session set");
    assert(cookieHeader.toLowerCase().includes("httponly"), "Admin cookie is HttpOnly");

    const sessionMatch = cookieHeader.match(/arka_admin_session=([^;]+)/);
    const adminCookie = sessionMatch ? `arka_admin_session=${sessionMatch[1]}` : "";

    // -------------------------------------------------------------
    // Test 5: Dashboard statistics matching real database records
    // -------------------------------------------------------------
    console.log("\nTest 5: Dashboard stats verification against real DB");
    const statsRes = await makeRequest("/api/admin/stats", {
      headers: { Cookie: adminCookie },
    });
    assert(statsRes.status === 200, "GET /api/admin/stats returns 200 with admin session");
    const statsData = JSON.parse(statsRes.data);

    const actualDbUsersCount = await prisma.user.count();
    const actualDbMessagesCount = await prisma.message.count();

    assert(
      statsData.totalUsers === actualDbUsersCount,
      `totalUsers matches DB count (${statsData.totalUsers} === ${actualDbUsersCount})`,
    );
    assert(
      statsData.totalMessages === actualDbMessagesCount,
      `totalMessages matches DB count (${statsData.totalMessages} === ${actualDbMessagesCount})`,
    );
    assert(typeof statsData.uptime === "string", `Uptime string present: "${statsData.uptime}"`);
    assert(typeof statsData.onlineUsers === "number", `Online users count is number: ${statsData.onlineUsers}`);

    // -------------------------------------------------------------
    // Test 6: Online users update when user acts (lastActiveAt)
    // -------------------------------------------------------------
    console.log("\nTest 6: Online users count updates when a user is active");
    const initialOnline = statsData.onlineUsers;

    // Create an active user right now
    const activeUser = await upsertGoogleUser({
      email: `online.user.${Date.now()}@example.com`,
      googleId: `gid_online_${Date.now()}`,
      name: "کاربر آنلاین",
    });

    await prisma.user.update({
      where: { id: activeUser.user.id },
      data: { lastActiveAt: new Date() },
    });

    const refreshedStatsRes = await makeRequest("/api/admin/stats", {
      headers: { Cookie: adminCookie },
    });
    const refreshedData = JSON.parse(refreshedStatsRes.data);
    assert(
      refreshedData.onlineUsers >= initialOnline + 1,
      `Online users incremented after user activity (${refreshedData.onlineUsers} >= ${initialOnline + 1})`,
    );

    // -------------------------------------------------------------
    // Test 7: Registration trend chart endpoint
    // -------------------------------------------------------------
    console.log("\nTest 7: Daily registration trend chart data");
    const chartRes = await makeRequest("/api/admin/registrations?days=30", {
      headers: { Cookie: adminCookie },
    });
    assert(chartRes.status === 200, "GET /api/admin/registrations returns 200");
    const chartData = JSON.parse(chartRes.data);
    assert(chartData.rangeDays === 30, "Range days is 30");
    assert(chartData.chartData.length === 30, "Chart data has 30 data points");
    const sumPoints = chartData.chartData.reduce(
      (sum: number, item: { count: number }) => sum + item.count,
      0,
    );
    assert(
      sumPoints >= 1,
      `Registration counts contain real data points (total counted in 30 days: ${sumPoints})`,
    );

    // -------------------------------------------------------------
    // Test 8: Admin logout terminates session
    // -------------------------------------------------------------
    console.log("\nTest 8: Admin logout");
    const logoutRes = await makeRequest("/api/admin/logout", {
      method: "POST",
      headers: { Cookie: adminCookie },
    });
    assert(logoutRes.status === 200, "POST /api/admin/logout returns 200");
    const logoutCookie = logoutRes.headers["set-cookie"] || "";
    assert(
      logoutCookie.toString().includes("arka_admin_session=;") ||
        logoutCookie.toString().includes("Max-Age=0"),
      "Admin cookie is cleared",
    );

    // Verify stats access is blocked again
    const postLogoutStats = await makeRequest("/api/admin/stats", {
      headers: { Cookie: adminCookie },
    });
    assert(postLogoutStats.status === 404, "Access to stats returns 404 after logout");

    console.log("\n=================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
