// Measure the landing page + chat layout at real device viewports.
const { chromium } = require("playwright-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://127.0.0.1:3177";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667, mobile: true },
  { name: "iphone-15", width: 393, height: 852, mobile: true },
  { name: "pixel-7", width: 412, height: 915, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: false },
  { name: "laptop", width: 1366, height: 768, mobile: false },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const out = {};

  // Sign in once with the dev-auth route so the chat page can be measured.
  // Only available when the server runs with ALLOW_DEV_AUTH=true.
  const authCtx = await browser.newContext();
  const authPage = await authCtx.newPage();
  let storageState = null;
  try {
    await authPage.goto(
      `${BASE}/api/auth/mock-login?email=measure%40arka.test&name=%D9%85%D8%B1%D8%B3%D8%B1&returnTo=%2Fchat`,
      { waitUntil: "domcontentloaded", timeout: 20000 },
    );
    if (authPage.url().includes("/chat")) {
      storageState = await authCtx.storageState();
      out.auth = "ok";
    } else {
      out.auth = "failed: " + authPage.url();
    }
  } catch (e) {
    out.auth = "error: " + String(e).slice(0, 120);
  }
  await authCtx.close();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      deviceScaleFactor: 1,
      ...(storageState ? { storageState } : {}),
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 200));
    });
    page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 200)));

    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1000);

    out[`landing@${vp.name}`] = await page.evaluate(() => {
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      const hero = document.querySelector("section[aria-labelledby='hero-title']");
      const laptop = document.querySelector("section[aria-labelledby='hero-title'] .hidden.md\\:block");
      const phone = document.querySelector("section[aria-labelledby='hero-title'] .md\\:hidden");
      const visible = (el) => !!el && el.getBoundingClientRect().width > 0;
      const h1 = document.querySelector("#hero-title");
      const h1Lines = h1
        ? (() => {
            const cs = getComputedStyle(h1);
            const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
            return Math.round(h1.getBoundingClientRect().height / lh);
          })()
        : 0;
      // Any element whose box is clipped by its own overflow container?
      let clipped = 0;
      document.querySelectorAll("section[aria-labelledby='hero-title'] *").forEach((el) => {
        const p = el.parentElement;
        if (!p) return;
        const pcs = getComputedStyle(p);
        if (pcs.overflow === "hidden" || pcs.overflowY === "hidden") {
          const e = el.getBoundingClientRect();
          const pr = p.getBoundingClientRect();
          if (e.bottom > pr.bottom + 1 || e.right > pr.right + 1) clipped++;
        }
      });

      return {
        overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroHeight: Math.round(rect(hero)?.height || 0),
        laptopVisible: visible(laptop),
        phoneVisible: visible(phone),
        laptopSize: laptop ? [Math.round(rect(laptop).width), Math.round(rect(laptop).height)] : null,
        phoneSize: phone ? [Math.round(rect(phone).width), Math.round(rect(phone).height)] : null,
        h1Lines,
        clippedChildren: clipped,
        sections: ["features", "models", "how", "faq"].every((id) => !!document.getElementById(id)),
        navLinks: Array.from(document.querySelectorAll("header nav a")).map((a) => a.textContent.trim()),
      };
    });
    out[`landing@${vp.name}`].errors = errors.slice(0, 6);

    await page.screenshot({ path: `/tmp/shot-landing-${vp.name}.png` });

    // ---- Chat page (best effort: needs a session) ----
    await page.goto(BASE + "/chat", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(900);
    const chatUrl = page.url();
    if (chatUrl.includes("/chat") && !chatUrl.includes("/login")) {
      out[`chat@${vp.name}`] = await page.evaluate(() => {
        const rect = (el) => (el ? el.getBoundingClientRect() : null);
        const header = document.querySelector("header");
        const aside = document.querySelector("aside");
        const main = document.querySelector("main");
        const compose = document.querySelector("form") || document.querySelector("textarea");
        const scroller = Array.from(document.querySelectorAll("div")).find(
          (d) => d.scrollHeight > d.clientHeight + 4 && d.clientHeight > 120,
        );
        const hb = rect(header);
        const ab = rect(aside);
        return {
          overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          header: hb ? [Math.round(hb.width), Math.round(hb.height)] : null,
          asideWidth: ab ? Math.round(ab.width) : 0,
          asideOffscreen: ab ? ab.right <= 1 : null,
          mainWidth: main ? Math.round(rect(main).width) : 0,
          composerWidth: compose ? Math.round(rect(compose).width) : 0,
          scrollHostHeight: scroller ? Math.round(scroller.clientHeight) : 0,
        };
      });
      out[`chat@${vp.name}`].errors = errors.slice(0, 6);
      await page.screenshot({ path: `/tmp/shot-chat-${vp.name}.png` });
    } else {
      out[`chat@${vp.name}`] = { skipped: "no session", url: chatUrl };
    }

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync("/tmp/measure.json", JSON.stringify(out, null, 2));
  console.log("MEASURE_OK");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
