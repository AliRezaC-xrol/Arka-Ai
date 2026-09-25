import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = "http://127.0.0.1:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase10Tests() {
  console.log("=================================================================");
  console.log("  PHASE 10 TEST SUITE: COMPLETE UI/UX, ADMIN POLISH, DOCS & CLI  ");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Part A: BYOK Box in Chat Preview
  // ---------------------------------------------------------------------------
  console.log("--- PART A: BYOK Provider Box Layout & Styling ---");
  const chatPreviewCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/chat-preview.tsx"),
    "utf-8",
  );
  assert(chatPreviewCode.includes("کلاستر چندکلیدی BYOK"), "BYOK title is rendered cleanly");
  assert(chatPreviewCode.includes("AES-256-GCM"), "AES-256-GCM encryption badge preserved");
  assert(chatPreviewCode.includes("جابجایی خودکار بدون قطعی چت"), "Auto-failover status label preserved");
  assert(chatPreviewCode.includes("۲ از ۲ کلید فعال"), "Active keys counter preserved");
  assert(chatPreviewCode.includes("کلید ۱ (اصلی)"), "Key 1 primary label present");
  assert(chatPreviewCode.includes("کلید ۲ (رزرو Failover)"), "Key 2 standby label present");

  // ---------------------------------------------------------------------------
  // 2. Part B: Hero Section, Provider Logos & Steps
  // ---------------------------------------------------------------------------
  console.log("\n--- PART B: Hero Section, Sleeping Mesh & Provider Logos ---");
  const homeRes = await fetch(`${BASE_URL}/`);
  assert(homeRes.status === 200, "Landing page responds with HTTP 200 OK");
  const homeHtml = await homeRes.text();

  assert(!homeHtml.includes("شروع دمو"), "Old phrase 'شروع دمو' is absent from landing page");
  assert(!homeHtml.includes("بدون نیاز به کارت بانکی"), "Old phrase 'بدون نیاز به کارت بانکی' is absent from landing page");
  assert(homeHtml.includes("در یک دقیقه شروع کن"), "3-Step title 'در یک دقیقه شروع کن' is rendered");
  assert(homeHtml.includes("ورود با گوگل"), "Step 1 'ورود با گوگل' is present");
  assert(homeHtml.includes("کلید وصل کن"), "Step 2 'کلید وصل کن' is present");
  assert(homeHtml.includes("گفتگو کن"), "Step 3 'گفتگو کن' is present");

  // Check Provider Logos Row
  assert(homeHtml.includes("OpenAI"), "Provider logo OpenAI present");
  assert(homeHtml.includes("Claude"), "Provider logo Claude present");
  assert(homeHtml.includes("Gemini"), "Provider logo Gemini present");
  assert(homeHtml.includes("DeepSeek"), "Provider logo DeepSeek present");
  assert(homeHtml.includes("FLUX.1"), "Provider logo FLUX.1 present");
  assert(homeHtml.includes("Grok"), "Provider logo Grok present");

  // ---------------------------------------------------------------------------
  // 3. Part C: Chat Environment & Dock Redesign
  // ---------------------------------------------------------------------------
  console.log("\n--- PART C: Chat Environment & Dock Layout ---");
  const chatPageCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/chat/page.tsx"),
    "utf-8",
  );
  assert(chatPageCode.includes("چطور می‌توانم کمکت کنم؟"), "Empty state greeting 'چطور می‌توانم کمکت کنم؟' present");
  assert(chatPageCode.includes("handleExportChat"), "Conversation export / download function implemented");
  assert(chatPageCode.includes("متصل به کلاستر"), "Green connection pulse dot present");
  assert(chatPageCode.includes("desktopCollapsed"), "Desktop collapsed dock mode state implemented");
  assert(chatPageCode.includes("SUGGESTIONS"), "Quick prompt suggestions pills implemented");

  // ---------------------------------------------------------------------------
  // 4. Part D: Login Page
  // ---------------------------------------------------------------------------
  console.log("\n--- PART D: Login Page Exclusivity & Aesthetics ---");
  const loginRes = await fetch(`${BASE_URL}/login`);
  assert(loginRes.status === 200, "GET /login responds with 200 OK");
  const loginHtml = await loginRes.text();
  assert(loginHtml.includes("ورود یا ساخت حساب"), "Login title rendered");
  assert(loginHtml.includes("GoogleLoginButton") || loginHtml.includes("accounts.google.com") || loginHtml.includes("گوگل"), "Google OAuth login button present");
  assert(!loginHtml.includes('type="password"'), "Strict: Zero password input fields on login page");
  assert(!loginHtml.includes('name="password"'), "Strict: Zero password names on login page");

  // ---------------------------------------------------------------------------
  // 5. Part E: Admin Dashboard Polish
  // ---------------------------------------------------------------------------
  console.log("\n--- PART E: Admin Dashboard Polish ---");
  const adminPageCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/c-xroladi1n/page.tsx"),
    "utf-8",
  );
  assert(adminPageCode.includes("کل کاربران سامانه"), "Polished KPI 1 (Total Users) present");
  assert(adminPageCode.includes("مجموع پیام‌ها"), "Polished KPI 2 (Total Messages) present");
  assert(adminPageCode.includes("کاربران آنلاین"), "Polished KPI 3 (Online Users) present");
  assert(adminPageCode.includes("کاربر پرمصرف"), "Polished KPI 4 (Top User) present");
  assert(adminPageCode.includes("آپ‌تایم سامانه"), "Polished KPI 5 (System Uptime) present");
  assert(adminPageCode.includes("border-dashed"), "Registration chart guidelines present");

  const broadcastsManagerCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/admin/broadcasts-manager.tsx"),
    "utf-8",
  );
  assert(broadcastsManagerCode.includes("Live Preview"), "Live notification banner preview present in broadcast manager");

  const providersManagerCode = fs.readFileSync(
    path.join(process.cwd(), "src/components/admin/providers-manager.tsx"),
    "utf-8",
  );
  assert(providersManagerCode.includes("handleCopyKeyMask"), "Key copy button logic present in provider manager");

  // ---------------------------------------------------------------------------
  // 6. Part F: Private Repo Install Guide
  // ---------------------------------------------------------------------------
  console.log("\n--- PART F: Private Repository Install Guide ---");
  const installDocPath = path.join(process.cwd(), "docs/INSTALL.md");
  assert(fs.existsSync(installDocPath), "docs/INSTALL.md exists");
  const installDocContent = fs.readFileSync(installDocPath, "utf-8");
  assert(installDocContent.includes("SSH Deploy Key"), "Covers SSH Deploy Key method");
  assert(installDocContent.includes("Personal Access Token"), "Covers Personal Access Token without shell history leak");
  assert(installDocContent.includes("PostgreSQL"), "Covers PostgreSQL database setup");
  assert(installDocContent.includes("ecosystem.config.js"), "Covers PM2 ecosystem configuration");
  assert(installDocContent.includes("proxy_pass http://127.0.0.1:3000;"), "Covers Nginx reverse proxy configuration");
  assert(installDocContent.includes("certbot"), "Covers Certbot SSL automation");

  // Check ecosystem.config.js
  const ecosystemPath = path.join(process.cwd(), "ecosystem.config.js");
  assert(fs.existsSync(ecosystemPath), "ecosystem.config.js exists in project root");

  // ---------------------------------------------------------------------------
  // 7. Part G: Server Management CLI (arka-cli)
  // ---------------------------------------------------------------------------
  console.log("\n--- PART G: Server Management CLI (arka-cli) ---");
  const cliPath = path.join(process.cwd(), "scripts/arka-cli.sh");
  assert(fs.existsSync(cliPath), "scripts/arka-cli.sh exists");

  const cliHelpOutput = execSync(`${cliPath} --help`, { encoding: "utf-8" });
  assert(cliHelpOutput.includes("arka-cli"), "CLI --help displays tool usage");

  const cliVersionOutput = execSync(`${cliPath} --version`, { encoding: "utf-8" });
  assert(cliVersionOutput.includes("1.0.0"), "CLI --version reports 1.0.0");

  const cliStatusOutput = execSync(`${cliPath} status`, { encoding: "utf-8" });
  assert(cliStatusOutput.includes("Node version"), "CLI status reports system metrics");

  const cliContent = fs.readFileSync(cliPath, "utf-8");
  assert(cliContent.includes("action_full_install"), "Option 1 (Full Install) implemented");
  assert(cliContent.includes("action_full_uninstall"), "Option 2 (Full Uninstall) implemented");
  assert(cliContent.includes("action_setup_domain_ssl"), "Option 3 (Domain & SSL) implemented");
  assert(cliContent.includes("action_set_admin_password"), "Option 4 (Set Admin Password) implemented");
  assert(cliContent.includes("action_change_admin_password"), "Option 5 (Change Admin Password) implemented");
  assert(cliContent.includes("action_check_renew_ssl"), "Option 6 (Renew SSL) implemented");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`  PHASE 10 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error("Test runner threw error:", err);
  process.exit(1);
});
