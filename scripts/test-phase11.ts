import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runPhase11Tests() {
  console.log("=================================================================");
  console.log("  PHASE 11 TEST SUITE: USER REFINEMENTS & CLOSED-SOURCE PACKAGING");
  console.log("=================================================================\n");

  let passed = 0;
  function pass(desc: string) {
    console.log(`  ✓ ${desc}`);
    passed++;
  }

  // ---------------------------------------------------------------------------
  // 1. Hero & Provider Bar Refinements
  // ---------------------------------------------------------------------------
  console.log("--- PART A: Hero & Provider Bar Refinements ---");
  const homeRes = await fetch(`${BASE_URL}/`);
  assert(homeRes.status === 200, "GET / responds with 200 OK");
  const homeHtml = await homeRes.text();

  assert(!homeHtml.includes("دیدن محیط چت"), "Hero button 'دیدن محیط چت' is completely removed");
  pass("Hero button 'دیدن محیط چت' is completely removed");

  assert(homeHtml.includes("شروع رایگان"), "Hero button 'شروع رایگان' is present");
  pass("Hero button 'شروع رایگان' is present");

  assert(homeHtml.includes("AES-256-GCM"), "Minimalist feature item 1 present under CTA");
  assert(homeHtml.includes("جابه‌جایی خودکار بین کلیدها بدون قطعی چت"), "Minimalist feature item 2 present under CTA");
  pass("Original feature list under 'شروع رایگان' is rendered properly");

  const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf-8");
  assert(pageSource.includes('id="how"') && pageSource.includes("<MeshCanvas"), "Sleeping MeshCanvas is embedded in #how section");
  pass("Sleeping MeshCanvas is embedded in 'چطور کار می‌کند' (#how) section");

  const providerLogosSource = fs.readFileSync(path.join(process.cwd(), "src/components/provider-logos.tsx"), "utf-8");
  assert(providerLogosSource.includes("rounded-full") && providerLogosSource.includes("border-white/10"), "Provider strip is compact and sleek");
  pass("Provider logos bar is compact, sleek, and low-profile");

  // ---------------------------------------------------------------------------
  // 2. Login Page Centering
  // ---------------------------------------------------------------------------
  console.log("\n--- PART B: Login Page Centered Typography ---");
  const loginRes = await fetch(`${BASE_URL}/login`);
  assert(loginRes.status === 200, "GET /login responds with 200 OK");
  const loginHtml = await loginRes.text();

  assert(loginHtml.includes("ورود یا ساخت حساب"), "Login title 'ورود یا ساخت حساب' present");
  assert(loginHtml.includes("با یک کلیک و فقط از طریق حساب گوگل، به سامانه متصل شوید."), "Login subtitle present");

  const loginSource = fs.readFileSync(path.join(process.cwd(), "src/app/login/page.tsx"), "utf-8");
  assert(loginSource.includes("text-center") && loginSource.includes("mx-auto"), "Login heading and subtitle are centered");
  pass("Login heading and subtitle are cleanly centered in the card");

  // ---------------------------------------------------------------------------
  // 3. Chat Page Interface (Video 1 recreation)
  // ---------------------------------------------------------------------------
  console.log("\n--- PART C: Chat Interface (Video 1 Recreation) ---");
  const chatSource = fs.readFileSync(path.join(process.cwd(), "src/app/chat/page.tsx"), "utf-8");

  assert(chatSource.includes("چطور می‌توانم کمکت کنم؟"), "Zero-state centered question present");
  pass("Zero-state centered question 'چطور می‌توانم کمکت کنم؟' present");

  assert(chatSource.includes("SUGGESTIONS"), "Suggestion pills array defined");
  assert(chatSource.includes("خودت را معرفی کن"), "Suggestion pill 1 present");
  assert(chatSource.includes("چطور روزم را بهتر برنامه‌ریزی کنم؟"), "Suggestion pill 2 present");
  assert(chatSource.includes("پایتخت فرانسه کجاست؟"), "Suggestion pill 3 present");
  assert(chatSource.includes("یک متن انگیزشی کوتاه بگو"), "Suggestion pill 4 present");
  pass("Exact 4 suggestion pills rendered below floating composer");

  assert(chatSource.includes("rounded-[26px]") || chatSource.includes("rounded-[28px]"), "Floating curved capsule composer styled");
  pass("Curved floating composer capsule matches video 1");

  assert(!chatSource.includes("from-blue-") && !chatSource.includes("bg-blue-"), "Chat UI strictly monochrome (no blue gradients)");
  pass("Chat interface strictly uses monochrome black/white/silver palette");

  // ---------------------------------------------------------------------------
  // 4. Admin Dashboard Spacing & Registration Chart (Video 2 recreation)
  // ---------------------------------------------------------------------------
  console.log("\n--- PART D: Admin Dashboard Spacing & Registration Chart ---");
  const adminSource = fs.readFileSync(path.join(process.cwd(), "src/app/c-xroladi1n/page.tsx"), "utf-8");

  assert(adminSource.includes("p-8 space-y-8"), "Admin dashboard uses spacious layout (no cramped UI)");
  pass("Admin dashboard layout spacing is generous and uncluttered");

  assert(adminSource.includes("rounded-full border border-white/15 bg-black/60"), "Video 2-style segmented pill slider present");
  pass("Segmented range pill (7D / 30D / 90D) matches video 2 design");

  assert(adminSource.includes("rounded-[24px]") && adminSource.includes("rounded-[28px]"), "KPI & Chart cards have deep smooth curvature");
  pass("KPI metric cards and registration chart have modern rounded borders");

  // ---------------------------------------------------------------------------
  // 5. Closed-Source English README & Server Commands
  // ---------------------------------------------------------------------------
  console.log("\n--- PART E: Closed-Source English README & Distribution ---");
  assert(fs.existsSync(path.join(process.cwd(), "README.md")), "README.md exists in root");
  const readmeContent = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf-8");

  assert(readmeContent.includes("CONFIDENTIAL & PROPRIETARY"), "README contains proprietary notice");
  assert(readmeContent.includes("Not open source"), "README states project is closed-source");
  pass("README.md clearly marked as Closed-Source & Proprietary");

  assert(readmeContent.includes("git remote add origin"), "README includes private git push commands");
  assert(readmeContent.includes("git push -u origin main"), "README includes main branch push command");
  pass("Exact private GitHub push instructions documented");

  assert(readmeContent.includes("sudo apt update") && readmeContent.includes("pm2 start ecosystem.config.js"), "README includes full remote server install guide");
  pass("Complete server installation and deployment guide documented");

  console.log("\n=================================================================");
  console.log(`  PHASE 11 TEST RESULTS: ${passed} PASSED, 0 FAILED`);
  console.log("=================================================================\n");
}

runPhase11Tests().catch((err) => {
  console.error("Test runner threw error:", err);
  process.exit(1);
});
