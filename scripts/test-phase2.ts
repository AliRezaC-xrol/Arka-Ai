import http from "http";
import { prisma } from "../src/lib/prisma";
import { createSession, upsertGoogleUser } from "../src/lib/auth";

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

async function runPhase2Tests() {
  console.log("=================================================");
  console.log("   ARKA — Phase 2 Main Chat Environment Tests    ");
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
    // Setup 2 distinct users for testing isolation
    const userAProfile = {
      email: `user.a.${Date.now()}@example.com`,
      googleId: `gid_a_${Date.now()}`,
      name: "کاربر الف",
    };
    const userBProfile = {
      email: `user.b.${Date.now()}@example.com`,
      googleId: `gid_b_${Date.now()}`,
      name: "کاربر ب",
    };

    const userAResult = await upsertGoogleUser(userAProfile);
    const userBResult = await upsertGoogleUser(userBProfile);

    const sessionA = await createSession(userAResult.user);
    const sessionB = await createSession(userBResult.user);

    const cookieA = `arka_session=${sessionA.token}`;
    const cookieB = `arka_session=${sessionB.token}`;

    // -------------------------------------------------------------
    // Test 1: Send new message & verify auto-title creation + SSE streaming
    // -------------------------------------------------------------
    console.log("Test 1: Send message & auto-generate title & streaming response");
    const sendPrompt = "چگونه یک ساختار میکروسرویس مقیاس‌پذیر در ارکا بسازیم؟";

    let chunkCount = 0;
    let fullResponseText = "";
    let conversationId = "";

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
          assert(res.statusCode === 200, "POST /api/chat returns HTTP 200");
          assert(
            res.headers["content-type"]?.includes("text/event-stream") ?? false,
            "Response is text/event-stream (SSE)",
          );

          res.on("data", (chunk: Buffer) => {
            const lines = chunk.toString().split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "start") {
                    conversationId = data.conversationId;
                  } else if (data.type === "chunk") {
                    chunkCount++;
                    fullResponseText += data.text;
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
          message: sendPrompt,
          model: "Claude Sonnet 4",
        }),
      );
      req.end();
    });

    assert(!!conversationId, "Conversation ID was returned from start event");
    assert(chunkCount > 5, `Streaming occurred gradually (${chunkCount} chunks received)`);
    assert(fullResponseText.length > 20, "Complete streamed text accumulated");

    // Verify conversation in DB
    const dbConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });
    assert(!!dbConv, "Conversation created in database");
    assert(
      dbConv?.title.includes("چگونه یک ساختار میکروسرویس") ?? false,
      `Conversation title auto-generated from prompt (got: "${dbConv?.title}")`,
    );
    assert(dbConv?.messages.length === 2, "Conversation has 2 messages (user + assistant)");
    assert(dbConv?.messages[0].role === "user", "First message role is user");
    assert(dbConv?.messages[1].role === "assistant", "Second message role is assistant");

    // -------------------------------------------------------------
    // Test 2: Rename conversation
    // -------------------------------------------------------------
    console.log("\nTest 2: Rename conversation");
    const newTitle = "معماری میکروسرویس‌ها در ارکا (ویرایش‌شده)";
    const renameRes = await makeRequest(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieA,
      },
      body: JSON.stringify({ title: newTitle }),
    });
    assert(renameRes.status === 200, "PATCH /api/conversations/[id] returns 200");
    const updatedConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    assert(updatedConv?.title === newTitle, "Conversation title updated in DB");

    // -------------------------------------------------------------
    // Test 3: Pin / Unpin conversation
    // -------------------------------------------------------------
    console.log("\nTest 3: Pin conversation");
    const pinRes = await makeRequest(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieA,
      },
      body: JSON.stringify({ isPinned: true }),
    });
    assert(pinRes.status === 200, "Pin returns 200");
    const pinnedConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    assert(pinnedConv?.isPinned === true, "Conversation isPinned is true in DB");

    // -------------------------------------------------------------
    // Test 4: User Isolation (Per-Account Privacy)
    // -------------------------------------------------------------
    console.log("\nTest 4: User isolation check (User A vs User B)");
    // User B requests their conversations list
    const listResB = await makeRequest("/api/conversations", {
      headers: { Cookie: cookieB },
    });
    assert(listResB.status === 200, "User B can list their own conversations");
    const listDataB = JSON.parse(listResB.data);
    const hasAConvInB = listDataB.conversations.some((c: { id: string }) => c.id === conversationId);
    assert(!hasAConvInB, "User B DOES NOT see User A's conversation");

    // User B tries to view User A's conversation directly
    const accessResB = await makeRequest(`/api/conversations/${conversationId}`, {
      headers: { Cookie: cookieB },
    });
    assert(
      accessResB.status === 404,
      "User B cannot access User A's conversation by ID (returns 404)",
      `got ${accessResB.status}`,
    );

    // User B tries to delete User A's conversation
    const deleteResB = await makeRequest(`/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    assert(
      deleteResB.status === 404,
      "User B cannot delete User A's conversation (returns 404)",
      `got ${deleteResB.status}`,
    );

    // -------------------------------------------------------------
    // Test 5: Image Generation Endpoint
    // -------------------------------------------------------------
    console.log("\nTest 5: Image generation detection");
    const imageChatRes = await makeRequest("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieA,
      },
      body: JSON.stringify({
        message: "یک تصویر مینیمال و تاریک از کوهستان ارکا بساز",
        model: "FLUX.1 Schnell",
      }),
    });
    assert(imageChatRes.status === 200, "Image request returns 200");
    const imageData = JSON.parse(imageChatRes.data);
    assert(imageData.type === "image", "Response type is image");
    assert(!!imageData.imageUrl, "Generated imageUrl exists in response");

    // -------------------------------------------------------------
    // Test 6: Delete conversation
    // -------------------------------------------------------------
    console.log("\nTest 6: Delete conversation by owner");
    const deleteResA = await makeRequest(`/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(deleteResA.status === 200, "User A can delete their own conversation");

    const deletedConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    assert(deletedConv === null, "Conversation was deleted from database");

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

runPhase2Tests();
