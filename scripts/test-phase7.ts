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

async function runPhase7Tests() {
  console.log("=================================================");
  console.log("  PHASE 7 TEST SUITE: Admin Broadcasts,");
  console.log("  Per-User Notifications & Multi-tier Deletion");
  console.log("=================================================\n");

  const adminPassword = process.env.ADMIN_PASSWORD || "ArkaAdminSecure2026";

  // Step 1: Admin Authentication & Endpoint Protection
  console.log("Test 1: Admin Authentication & Route Hiding (404 for unauthenticated)");
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
  const unauthBroadcastsRes = await fetch(`${BASE_URL}/api/admin/broadcasts`);
  assert(unauthBroadcastsRes.status === 404, "Unauthenticated GET /api/admin/broadcasts returns 404 (hidden)");

  const unauthCreateRes = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "test" }),
  });
  assert(unauthCreateRes.status === 404, "Unauthenticated POST /api/admin/broadcasts returns 404 (hidden)");

  // Step 2: Create Test Users (User A & User B)
  console.log("\nTest 2: Setup Test Users (User A and User B)");
  const timestamp = Date.now();
  const userA = await prisma.user.create({
    data: {
      email: `userA.broadcast.${timestamp}@example.com`,
      googleId: `gid_p7_a_${timestamp}`,
      name: "کاربر الف (تست پیام)",
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: `userB.broadcast.${timestamp}@example.com`,
      googleId: `gid_p7_b_${timestamp}`,
      name: "کاربر ب (تست پیام)",
    },
  });

  assert(Boolean(userA.id && userB.id), "Test User A and User B created in database");

  const { token: userAToken } = await createSession(userA);
  const userACookie = `arka_session=${userAToken}`;

  const { token: userBToken } = await createSession(userB);
  const userBCookie = `arka_session=${userBToken}`;

  // Verify initial empty notifications for both users
  const initUserARes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  assert(initUserARes.status === 200, "GET /api/notifications returns 200 for User A");
  const initUserAData = await initUserARes.json();
  const initialUserACount = initUserAData.unreadCount;

  // Step 3: Send Message to Specific User A Only
  console.log("\nTest 3: Send Message to Specific User (User A Only)");
  const singleMsgRes = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "پیام اختصاصی تست",
      content: "این یک پیام خصوصی و اختصاصی برای کاربر الف است.",
      sentToAll: false,
      recipientUserId: userA.id,
    }),
  });
  assert(singleMsgRes.status === 201, "POST /api/admin/broadcasts (single user) returns 201 Created");
  const singleMsgData = await singleMsgRes.json();
  const singleMessageId = singleMsgData.message.id;
  assert(Boolean(singleMessageId), "Single message created with UUID");
  assert(singleMsgData.message.sentToAll === false, "Message marked as sentToAll=false");

  // Check User A's notifications -> MUST SEE THE MESSAGE
  const userANotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  const userANotifsData = await userANotifsRes.json();
  assert(userANotifsData.unreadCount === initialUserACount + 1, "User A unreadCount incremented by 1");
  const foundUserAMsg = userANotifsData.notifications.find(
    (n: { adminMessageId: string }) => n.adminMessageId === singleMessageId,
  );
  assert(Boolean(foundUserAMsg), "User A receives the single-user message");
  assert(foundUserAMsg.isRead === false, "Message starts as isRead=false");

  // Check User B's notifications -> MUST NOT SEE THE MESSAGE
  const userBNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userBCookie },
  });
  const userBNotifsData = await userBNotifsRes.json();
  const foundUserBMsg = userBNotifsData.notifications.find(
    (n: { adminMessageId: string }) => n.adminMessageId === singleMessageId,
  );
  assert(foundUserBMsg === undefined, "User B DOES NOT receive the message sent exclusively to User A");

  // Step 4: Send Broadcast Message to ALL Users
  console.log("\nTest 4: Broadcast Message to ALL Users");
  const broadcastRes = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "اطلاعیه سراسری سیستم",
      content: "توجه: سرورهای هوش مصنوعی آرکا فردا ساعت ۲ بامداد به نسخه جدید ارتقا می‌یابند.",
      sentToAll: true,
    }),
  });
  assert(broadcastRes.status === 201, "POST /api/admin/broadcasts (sentToAll=true) returns 201 Created");
  const broadcastData = await broadcastRes.json();
  const broadcastMessageId = broadcastData.message.id;
  assert(Boolean(broadcastMessageId), "Broadcast message created with UUID");
  assert(broadcastData.message.sentToAll === true, "Broadcast marked as sentToAll=true");

  // Both User A and User B MUST receive the broadcast
  const userABroadcastRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  const userABroadcastData = await userABroadcastRes.json();
  const userAHasBroadcast = userABroadcastData.notifications.find(
    (n: { adminMessageId: string }) => n.adminMessageId === broadcastMessageId,
  );
  assert(Boolean(userAHasBroadcast), "User A receives the global broadcast notification");

  const userBBroadcastRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userBCookie },
  });
  const userBBroadcastData = await userBBroadcastRes.json();
  const userBHasBroadcast = userBBroadcastData.notifications.find(
    (n: { adminMessageId: string }) => n.adminMessageId === broadcastMessageId,
  );
  assert(Boolean(userBHasBroadcast), "User B receives the global broadcast notification");

  // Step 5: User A Reads the Broadcast -> Admin Status Updates
  console.log("\nTest 5: User A Reads Notification & Admin Observes Read Status Update");
  const readRes = await fetch(`${BASE_URL}/api/notifications/${userAHasBroadcast.id}/read`, {
    method: "POST",
    headers: { Cookie: userACookie },
  });
  assert(readRes.status === 200, "POST /api/notifications/[id]/read returns 200 OK");

  // Verify in User A's notifications that it is read
  const userAAfterReadRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  const userAAfterReadData = await userAAfterReadRes.json();
  const readItem = userAAfterReadData.notifications.find(
    (n: { id: string }) => n.id === userAHasBroadcast.id,
  );
  assert(readItem.isRead === true, "Notification isRead is now true for User A");
  assert(Boolean(readItem.readAt), "Notification readAt timestamp is recorded");

  // Check from Admin Panel side: readRecipients count & percentage updated
  const adminBroadcastsRes = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminBroadcastsRes.status === 200, "GET /api/admin/broadcasts returns 200 OK");
  const adminBroadcastsData = await adminBroadcastsRes.json();
  const adminBroadcastItem = adminBroadcastsData.messages.find(
    (m: { id: string }) => m.id === broadcastMessageId,
  );
  assert(Boolean(adminBroadcastItem), "Broadcast item found in admin list");
  assert(adminBroadcastItem.stats.readRecipients >= 1, "Admin sees at least 1 recipient has read the message");
  const recipientA = adminBroadcastItem.recipients.find((r: { userId: string }) => r.userId === userA.id);
  const recipientB = adminBroadcastItem.recipients.find((r: { userId: string }) => r.userId === userB.id);
  assert(recipientA.isRead === true, "Admin recipient breakdown confirms User A read the message");
  assert(recipientB.isRead === false, "Admin recipient breakdown confirms User B has NOT read yet");

  // Step 6: Delete Single-User Message
  console.log("\nTest 6: Delete Single-User Message by Admin");
  const deleteSingleRes = await fetch(`${BASE_URL}/api/admin/broadcasts/${singleMessageId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert(deleteSingleRes.status === 200, "DELETE /api/admin/broadcasts/[id] returns 200 OK");

  // Verify User A no longer sees single message
  const userANotifsAfterDelete = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  const userANotifsAfterDeleteData = await userANotifsAfterDelete.json();
  const deletedStillExists = userANotifsAfterDeleteData.notifications.some(
    (n: { adminMessageId: string }) => n.adminMessageId === singleMessageId,
  );
  assert(deletedStillExists === false, "Single message completely removed from User A's notifications");

  // Step 7: Delete Broadcast for a SINGLE RECIPIENT (User A) only
  console.log("\nTest 7: Delete Broadcast for a SINGLE RECIPIENT Only (Multi-tier Deletion)");
  // Create another broadcast to test single-recipient deletion
  const broadcast2Res = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "تست حذف انتخابی برای یک نفر",
      content: "این پیام برای همه فرستاده می‌شود ولی فقط از حساب کاربر الف پاک خواهد شد.",
      sentToAll: true,
    }),
  });
  const broadcast2Data = await broadcast2Res.json();
  const broadcast2Id = broadcast2Data.message.id;

  // Admin deletes this broadcast ONLY for User A
  const deleteForUserARes = await fetch(
    `${BASE_URL}/api/admin/broadcasts/${broadcast2Id}/recipients/${userA.id}`,
    {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    },
  );
  assert(
    deleteForUserARes.status === 200,
    "DELETE /api/admin/broadcasts/[id]/recipients/[userId] returns 200 OK",
  );

  // Check User A: MUST NOT see broadcast 2
  const userANotifsBroadcast2 = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userACookie },
  });
  const userANotifsBroadcast2Data = await userANotifsBroadcast2.json();
  const userAStillHasBroadcast2 = userANotifsBroadcast2Data.notifications.some(
    (n: { adminMessageId: string }) => n.adminMessageId === broadcast2Id,
  );
  assert(userAStillHasBroadcast2 === false, "Message was deleted ONLY from User A's view");

  // Check User B: MUST STILL SEE broadcast 2!
  const userBNotifsBroadcast2 = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userBCookie },
  });
  const userBNotifsBroadcast2Data = await userBNotifsBroadcast2.json();
  const userBStillHasBroadcast2 = userBNotifsBroadcast2Data.notifications.some(
    (n: { adminMessageId: string }) => n.adminMessageId === broadcast2Id,
  );
  assert(
    userBStillHasBroadcast2 === true,
    "Other recipients (User B) STILL see the broadcast message (isolated deletion)",
  );

  // Step 8: Delete Broadcast for ALL Users
  console.log("\nTest 8: Delete Broadcast for ALL Users");
  const deleteAllRes = await fetch(`${BASE_URL}/api/admin/broadcasts/${broadcast2Id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert(deleteAllRes.status === 200, "DELETE broadcast for all returns 200 OK");

  // User B should no longer see it
  const userBAfterDeleteAll = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: userBCookie },
  });
  const userBAfterDeleteAllData = await userBAfterDeleteAll.json();
  const userBStillHasIt = userBAfterDeleteAllData.notifications.some(
    (n: { adminMessageId: string }) => n.adminMessageId === broadcast2Id,
  );
  assert(userBStillHasIt === false, "Broadcast completely removed from all users' inboxes");

  // Step 9: Cleanup
  console.log("\nCleaning up test data...");
  await prisma.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  }).catch(() => {});

  await prisma.adminMessage.deleteMany({
    where: { id: { in: [singleMessageId, broadcastMessageId, broadcast2Id] } },
  }).catch(() => {});

  console.log("\n=================================================");
  console.log(`  PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
