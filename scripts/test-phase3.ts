import http from "http";
import { prisma } from "../src/lib/prisma";
import { createSession, upsertGoogleUser } from "../src/lib/auth";
import { decryptApiKey } from "../src/lib/crypto";

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

async function runPhase3Tests() {
  console.log("=================================================");
  console.log("   ARKA — Phase 3 Personal Providers Tests       ");
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
    // 1. Create two users for privacy / isolation tests
    const userA = await upsertGoogleUser({
      email: `prov.a.${Date.now()}@example.com`,
      googleId: `gid_prov_a_${Date.now()}`,
      name: "کاربر پروایدر الف",
    });
    const userB = await upsertGoogleUser({
      email: `prov.b.${Date.now()}@example.com`,
      googleId: `gid_prov_b_${Date.now()}`,
      name: "کاربر پروایدر ب",
    });

    const sessionA = await createSession(userA.user);
    const sessionB = await createSession(userB.user);

    const cookieA = `arka_session=${sessionA.token}`;
    const cookieB = `arka_session=${sessionB.token}`;

    // -------------------------------------------------------------
    // Test 1: Add new provider with valid key and test connection success
    // -------------------------------------------------------------
    console.log("Test 1: Add provider with valid key & successful connection test");
    const validApiKey = "sk-test-valid-openai-key-secret-1234567890";
    const createRes1 = await makeRequest("/api/user-providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: "OpenAI شخصی من",
        providerType: "openai",
        apiKey: validApiKey,
        testNow: true,
      }),
    });

    assert(createRes1.status === 201, "POST /api/user-providers returns HTTP 201 Created");
    const createData1 = JSON.parse(createRes1.data);
    const providerId1 = createData1.provider?.id;
    assert(!!providerId1, "Provider ID generated");
    assert(createData1.provider?.status === "connected", "Provider status is 'connected'");
    assert(
      createData1.provider?.keyMask.startsWith("sk-..."),
      `API key is masked in response (got: ${createData1.provider?.keyMask})`,
    );

    // -------------------------------------------------------------
    // Test 2: Add provider with invalid key -> error status & appropriate message
    // -------------------------------------------------------------
    console.log("\nTest 2: Add provider with invalid key -> connection error");
    const invalidApiKey = "sk-test-invalid-key-xyz-error";
    const createRes2 = await makeRequest("/api/user-providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieA,
      },
      body: JSON.stringify({
        name: "Anthropic ناموفق",
        providerType: "anthropic",
        apiKey: invalidApiKey,
        testNow: true,
      }),
    });

    assert(createRes2.status === 201, "POST invalid provider returns 201");
    const createData2 = JSON.parse(createRes2.data);
    assert(createData2.provider?.status === "disconnected", "Status is 'disconnected'");
    assert(
      createData2.testResult?.message.includes("نامعتبر") ||
        createData2.testResult?.message.includes("401"),
      `Error message describes invalid key (got: ${createData2.testResult?.message})`,
    );

    // -------------------------------------------------------------
    // Test 3: Verify encryption in database (NO plain text API key!)
    // -------------------------------------------------------------
    console.log("\nTest 3: Database security check (AES-256-GCM encryption)");
    const dbProvider1 = await prisma.userProvider.findUnique({
      where: { id: providerId1 },
    });
    assert(!!dbProvider1, "Provider found in PostgreSQL database");
    assert(
      !dbProvider1?.encryptedApiKey.includes(validApiKey),
      "Encrypted column DOES NOT contain the plain text API key!",
    );
    assert(
      dbProvider1?.encryptedApiKey.split(":").length === 3,
      "Encrypted column has AES-256-GCM structure (iv:tag:ciphertext)",
    );

    // Verify decryption produces original plain text key
    const decrypted = decryptApiKey(dbProvider1!.encryptedApiKey);
    assert(decrypted === validApiKey, "Server can decrypt key with AES-256-GCM successfully");

    // -------------------------------------------------------------
    // Test 4: User Isolation (User A's providers NOT visible to User B)
    // -------------------------------------------------------------
    console.log("\nTest 4: User isolation check (User A vs User B)");
    const listResB = await makeRequest("/api/user-providers", {
      headers: { Cookie: cookieB },
    });
    assert(listResB.status === 200, "User B can list providers");
    const listDataB = JSON.parse(listResB.data);
    const hasAInB = listDataB.providers.some((p: { id: string }) => p.id === providerId1);
    assert(!hasAInB, "User B DOES NOT see User A's personal provider");

    // User B tries to test User A's provider
    const testByB = await makeRequest(`/api/user-providers/${providerId1}/test`, {
      method: "POST",
      headers: { Cookie: cookieB },
    });
    assert(testByB.status === 404, "User B cannot test User A's provider (HTTP 404)");

    // User B tries to delete User A's provider
    const deleteByB = await makeRequest(`/api/user-providers/${providerId1}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    assert(deleteByB.status === 404, "User B cannot delete User A's provider (HTTP 404)");

    // -------------------------------------------------------------
    // Test 5: Chat with personal provider
    // -------------------------------------------------------------
    console.log("\nTest 5: Chat using personal provider");
    let chatResponseText = "";
    await new Promise<void>((resolve, reject) => {
      const url = new URL("/api/chat", BASE_URL);
      const req = http.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieA,
          },
        },
        (res) => {
          assert(res.statusCode === 200, "Chat request with personal provider returns 200");
          res.on("data", (chunk: Buffer) => {
            const lines = chunk.toString().split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "chunk") {
                    chatResponseText += data.text;
                  }
                } catch {
                  // partial json
                }
              }
            }
          });
          res.on("end", () => resolve());
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      req.write(
        JSON.stringify({
          message: "سلام پروایدر من",
          model: "GPT-4o",
          userProviderId: providerId1,
        }),
      );
      req.end();
    });

    assert(
      chatResponseText.includes("پروایدر شخصی: OpenAI شخصی من"),
      "Response confirms generation via personal provider",
    );

    // -------------------------------------------------------------
    // Test 6: Delete provider & verify removal
    // -------------------------------------------------------------
    console.log("\nTest 6: Delete provider");
    const deleteResA = await makeRequest(`/api/user-providers/${providerId1}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(deleteResA.status === 200, "DELETE /api/user-providers/[id] returns 200");

    const dbDeleted = await prisma.userProvider.findUnique({
      where: { id: providerId1 },
    });
    assert(dbDeleted === null, "Provider record removed from database");

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

runPhase3Tests();
