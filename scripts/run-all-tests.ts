import { execSync } from "child_process";

const testFiles = [
  { phase: "Phase 1: Google Auth & Atomic User Creation", script: "scripts/test-phase1.ts" },
  { phase: "Phase 2: Main Chat & SSE Streaming", script: "scripts/test-phase2.ts" },
  { phase: "Phase 3: Personal Providers & AES-256-GCM Encryption", script: "scripts/test-phase3.ts" },
  { phase: "Phase 4: Hidden Admin Panel & Live Stats Dashboard", script: "scripts/test-phase4.ts" },
  { phase: "Phase 5: Site Providers, Multi-Key Failover & Usage Analytics", script: "scripts/test-phase5.ts" },
  { phase: "Phase 6: User Management, Ban & Auto-expiring Timeout", script: "scripts/test-phase6.ts" },
  { phase: "Phase 7: Admin Broadcasts, Notifications & Multi-tier Deletion", script: "scripts/test-phase7.ts" },
  { phase: "Phase 8: Hero Window, Dedicated Login & Smart Redirects", script: "scripts/test-phase8.ts" },
  { phase: "Phase 9: Comprehensive End-to-End & Stress Testing", script: "scripts/test-phase9.ts" },
];

console.log("=================================================================");
console.log("       ARKA AI PLATFORM — MASTER INTEGRATION TEST RUNNER         ");
console.log("=================================================================\n");

let grandTotalPassed = 0;

for (const item of testFiles) {
  console.log(`\n>>> RUNNING: ${item.phase} (${item.script})`);
  try {
    const output = execSync(`npx tsx ${item.script}`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    console.log(output);

    // Extract passed count from output
    const matchResults = output.match(/(\d+)\s+PASSED|Results:\s+(\d+)\s+passed/i);
    const passedCount = matchResults ? parseInt(matchResults[1] || matchResults[2], 10) : 0;
    grandTotalPassed += passedCount;
  } catch (err: unknown) {
    const errorOutput = (err as { stdout?: string; stderr?: string });
    console.error(errorOutput.stdout || "");
    console.error(errorOutput.stderr || "");
    console.error(`FAILED: ${item.phase}`);
    process.exit(1);
  }
}

console.log("\n=================================================================");
console.log(`  ALL PHASES COMPLETE: ${grandTotalPassed} TESTS PASSED, 0 FAILURES!`);
console.log("=================================================================");
