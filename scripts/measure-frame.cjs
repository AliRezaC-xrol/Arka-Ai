// Report the natural (unclipped) height the mock conversation needs at a range
// of frame widths, so the hero screen height can be set from data, not guesswork.
const { chromium } = require("playwright-core");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://127.0.0.1:3177";
const WIDTHS = [300, 320, 336, 344, 360, 380, 400, 470, 560, 608];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(600);

  const rows = await page.evaluate((widths) => {
    const laptop = document.querySelector("section[aria-labelledby='hero-title'] .hidden.md\\:block");
    if (!laptop) return [{ error: "laptop frame not found" }];

    const screen = laptop.querySelector("div[class*='h-\\[400px\\]']") || laptop.querySelectorAll("div")[laptop.querySelectorAll("div").length - 1];
    const conv = screen ? screen.firstElementChild : null;
    if (!conv) return [{ error: "conversation not found" }];

    const holder = laptop.parentElement;
    const prevWidth = holder.style.width;
    const prevMax = holder.style.maxWidth;

    const out = [];
    for (const w of widths) {
      holder.style.width = w + "px";
      holder.style.maxWidth = w + "px";
      // Measure the natural height of the conversation content.
      screen.style.height = "auto";
      conv.style.height = "auto";
      const need = conv.scrollHeight;
      screen.style.height = "";
      conv.style.height = "";
      out.push({ width: w, naturalHeight: need });
    }

    holder.style.width = prevWidth;
    holder.style.maxWidth = prevMax;
    return out;
  }, WIDTHS);

  console.log(JSON.stringify(rows, null, 2));
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
