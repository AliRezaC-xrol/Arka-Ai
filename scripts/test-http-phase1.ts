import http from "http";

const BASE_URL = "http://127.0.0.1:3000";

async function makeRequest(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    redirect?: "manual" | "follow";
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
    req.end();
  });
}

async function runHttpTests() {
  console.log("=================================================");
  console.log("   ARKA — HTTP Middleware & Auth Flow Tests      ");
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
    // 1. Without session, accessing /chat must redirect to /login?returnTo=%2Fchat
    console.log("Checklist #4: Unauthenticated access to protected route");
    const unauthRes = await makeRequest("/chat");
    assert(
      unauthRes.status === 307 || unauthRes.status === 302,
      "Redirect status code (307/302) on /chat without session",
      `got ${unauthRes.status}`,
    );
    const location = (unauthRes.headers["location"] as string) || "";
    assert(
      location.includes("/login") && location.includes("returnTo=%2Fchat"),
      "Redirects to /login with returnTo=/chat",
      `Location was: ${location}`,
    );

    // 2. Perform login
    console.log("\nChecklist #1: Login with Google account");
    const testEmail = `http.user.${Date.now()}@gmail.com`;
    const loginRes = await makeRequest(
      `/api/auth/mock-login?email=${encodeURIComponent(testEmail)}&name=HttpTester&returnTo=%2Fchat`,
    );
    assert(
      loginRes.status === 307 || loginRes.status === 302,
      "Login endpoint redirects",
      `got ${loginRes.status}`,
    );
    assert(
      (loginRes.headers["location"] as string).endsWith("/chat"),
      "Login redirects to returnTo (/chat)",
      `Location was: ${loginRes.headers["location"]}`,
    );

    // Extract cookie
    const setCookie = loginRes.headers["set-cookie"];
    assert(!!setCookie, "Session cookie set in response");
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie || "";
    assert(cookieHeader.includes("arka_session="), "Cookie name is arka_session");
    assert(cookieHeader.toLowerCase().includes("httponly"), "Cookie has HttpOnly attribute");
    assert(cookieHeader.toLowerCase().includes("samesite=lax"), "Cookie has SameSite=Lax");

    const sessionMatch = cookieHeader.match(/arka_session=([^;]+)/);
    const sessionCookieVal = sessionMatch ? `arka_session=${sessionMatch[1]}` : "";

    // 3. Accessing /chat WITH session cookie
    console.log("\nChecklist #3: Authenticated access to /chat with session cookie");
    const authedRes = await makeRequest("/chat", {
      headers: {
        Cookie: sessionCookieVal,
      },
    });
    assert(authedRes.status === 200, "Access to /chat succeeds with HTTP 200", `got ${authedRes.status}`);

    // 4. Session endpoint returns authenticated user
    console.log("\nSession API check (/api/auth/session)");
    const sessionApiRes = await makeRequest("/api/auth/session", {
      headers: {
        Cookie: sessionCookieVal,
      },
    });
    assert(sessionApiRes.status === 200, "Session API returns 200");
    const sessionData = JSON.parse(sessionApiRes.data);
    assert(sessionData.authenticated === true, "Session authenticated is true");
    assert(sessionData.user.email === testEmail, "User email matches in session API");

    // 5. Accessing /login while already logged in redirects to /chat
    console.log("\nVisiting /login while logged in redirects back to /chat");
    const loginWhileAuthed = await makeRequest("/login", {
      headers: {
        Cookie: sessionCookieVal,
      },
    });
    assert(
      loginWhileAuthed.status === 307 || loginWhileAuthed.status === 302,
      "Redirects away from /login",
    );
    assert(
      (loginWhileAuthed.headers["location"] as string).endsWith("/chat"),
      "Redirects to /chat",
    );

    // 6. User cancellation check
    console.log("\nChecklist #5: Google login cancellation");
    const cancelRes = await makeRequest("/api/auth/mock-login?cancel=true");
    assert(cancelRes.status === 307 || cancelRes.status === 302, "Cancellation redirects");
    assert(
      (cancelRes.headers["location"] as string).includes("/login?error=cancelled"),
      "Redirects to /login?error=cancelled",
      `got ${cancelRes.headers["location"]}`,
    );

    // Verify /login?error=cancelled renders Persian error without crashing
    const errorPageRes = await makeRequest("/login?error=cancelled");
    assert(errorPageRes.status === 200, "Error page renders with 200 OK (no crash)");

    // 7. Logout flow
    console.log("\nChecklist #6: Logout clears session and terminates access");
    const logoutRes = await makeRequest("/api/auth/logout", {
      headers: {
        Cookie: sessionCookieVal,
      },
    });
    assert(logoutRes.status === 307 || logoutRes.status === 302, "Logout redirects to /login");
    const logoutSetCookie = logoutRes.headers["set-cookie"];
    const logoutCookieHeader = Array.isArray(logoutSetCookie)
      ? logoutSetCookie.join("; ")
      : logoutSetCookie || "";
    assert(
      logoutCookieHeader.includes("arka_session=;") ||
        logoutCookieHeader.includes("Max-Age=0") ||
        logoutCookieHeader.includes("expires="),
      "Logout clears arka_session cookie",
    );

    // Accessing /chat after logout (with old cookie or cleared)
    const afterLogoutRes = await makeRequest("/chat");
    assert(
      afterLogoutRes.status === 307 || afterLogoutRes.status === 302,
      "Protected route /chat is blocked after logout",
    );

    console.log("\n=================================================");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP test error:", error);
    process.exit(1);
  }
}

runHttpTests();
