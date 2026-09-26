// Verify the CHAT page layout at phone + desktop viewports.
//
// measure-hero.cjs covers the landing page; this one drives the real chat
// route (authenticated via the dev mock-login route, which only exists when
// the server runs with ALLOW_DEV_AUTH=true) and reports the numbers that
// matter for the mobile audit:
//
//   - horizontal overflow (the #1 symptom of a non-responsive layout)
//   - the sidebar drawer: is it really off-canvas when closed?
//   - header / composer widths vs the viewport
//   - whether any element is wider than the viewport
//
// Usage: PORT=3178 bash scripts/run-chat-measure.sh   (or set BASE)
const { chromium } = require("playwright-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://127.0.0.1:3178";
const OUT = process.env.OUT || "C:/tmp/chat-measure.json";
const SHOTS = process.env.SHOTS || "C:/tmp";

const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 640, mobile: true },
  { name: "iphone-se", width: 375, height: 667, mobile: true },
  { name: "iphone-15", width: 393, height: 852, mobile: true },
  { name: "pixel-7", width: 412, height: 915, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: false },
  { name: "laptop", width: 1366, height: 768, mobile: false },
];

/** Probe the chat shell. Everything here is read-only DOM inspection. */
function probe() {
  const doc = document.documentElement;
  const rect = (sel) => {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
    };
  };

  // Anything poking outside the viewport horizontally.
  const overflowing = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Ignore the deliberately off-canvas drawer.
    if (el.closest("[data-open='false']")) continue;
    if (r.right > window.innerWidth + 1 || r.left < -1) {
      overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 70)) || "",
        left: Math.round(r.left),
        right: Math.round(r.right),
      });
      if (overflowing.length >= 8) break;
    }
  }

  const aside = document.querySelector("aside");
  const asideRect = aside ? aside.getBoundingClientRect() : null;
  const asideOpen = aside?.getAttribute("data-open");

  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
    overflowPx: doc.scrollWidth - doc.clientWidth,
    bodyOverflowPx: document.body.scrollWidth - document.body.clientWidth,
    header: rect("header"),
    main: rect("main"),
    composer: rect("form"),
    textarea: rect("textarea"),
    // The docked composer, if a conversation exists.
    dockRow: rect("form > div"),
    aside: asideRect
      ? {
          x: Math.round(asideRect.x),
          w: Math.round(asideRect.width),
          right: Math.round(asideRect.right),
          open: asideOpen,
          // A closed drawer must be entirely outside the viewport.
          offCanvas:
            asideOpen === "false"
              ? asideRect.right <= 1 || asideRect.left >= window.innerWidth - 1
              : null,
          // Is it a fixed overlay, or a static column?
          position: getComputedStyle(aside).position,
          visibility: getComputedStyle(aside).visibility,
        }
      : null,
    overflowing,
    // How much of the viewport the scroll pane gets after header + composer.
    scrollPaneHeight: (() => {
      const pane = document.querySelector("main > div.overflow-y-auto, main > div[class*='overflow-y-auto']");
      if (!pane) return null;
      return Math.round(pane.getBoundingClientRect().height);
    })(),
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const out = { base: BASE };

  // ---- Authenticate once, reuse the storage state. ----
  const authCtx = await browser.newContext();
  const authPage = await authCtx.newPage();
  let storageState = null;
  try {
    await authPage.goto(
      `${BASE}/api/auth/mock-login?email=measure%40arka.test&name=%D9%85%D8%B1%D8%B3%D8%B1&returnTo=%2Fchat`,
      { waitUntil: "domcontentloaded", timeout: 30000 },
    );
    if (authPage.url().includes("/chat")) {
      storageState = await authCtx.storageState();
      out.auth = "ok";
    } else {
      out.auth = "failed: " + authPage.url();
    }
  } catch (e) {
    out.auth = "error: " + String(e).slice(0, 160);
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
    page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 200)));

    try {
      await page.goto(`${BASE}/chat`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1200);

      const url = page.url();
      if (url.includes("/login")) {
        out[`chat@${vp.name}`] = { skipped: "redirected to login", url };
        await ctx.close();
        continue;
      }

      out[`chat@${vp.name}`] = { ...(await page.evaluate(probe)), errors: errors.slice(0, 6) };
      await page.screenshot({ path: `${SHOTS}/chat-${vp.name}.png`, fullPage: false });

      // On phones, also open the sidebar drawer and confirm it lands on-screen.
      if (vp.mobile) {
        const opened = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("header button"));
          const toggle = btns[0];
          if (!toggle) return "no toggle";
          toggle.click();
          return "clicked";
        });
        await page.waitForTimeout(600);
        out[`chat@${vp.name}`].drawerAfterOpen = await page.evaluate(() => {
          const aside = document.querySelector("aside");
          if (!aside) return null;
          const r = aside.getBoundingClientRect();
          const cs = getComputedStyle(aside);
          return {
            action: "none",
            open: aside.getAttribute("data-open"),
            x: Math.round(r.x),
            w: Math.round(r.width),
            right: Math.round(r.right),
            visibility: cs.visibility,
            pointerEvents: cs.pointerEvents,
            // Visible and on-screen means the drawer actually opened.
            onScreen: r.left < window.innerWidth - 1 && r.right > 1,
          };
        });
        out[`chat@${vp.name}`].drawerOpenAction = opened;
        await page.screenshot({ path: `${SHOTS}/chat-${vp.name}-drawer.png` });
        // Close it again so the next probe starts clean.
        await page.keyboard.press("Escape").catch(() => {});
      }
    } catch (e) {
      out[`chat@${vp.name}`] = { error: String(e).slice(0, 200) };
    }

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log("CHAT_MEASURE_OK ->", OUT);
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
