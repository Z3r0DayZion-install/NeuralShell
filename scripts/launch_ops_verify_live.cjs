#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "release", "launch-ops");
const SHOTS_DIR = path.join(ROOT, "screenshots", "launch-ops");

function ts() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function safeTextIncludes(page, text) {
  try {
    const body = await page.textContent("body");
    return String(body || "").toLowerCase().includes(String(text || "").toLowerCase());
  } catch {
    return false;
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const stamp = ts();
  const result = {
    generatedAt: new Date().toISOString(),
    checks: {
      livePageLoaded: false,
      liveHas149: false,
      liveHasSupport: false,
      liveHasGumroadLink: false,
      gumroadProductLoaded: false,
      gumroadHasProductName: false,
      gumroadHas149: false,
      checkoutPathReachable: false,
    },
    evidence: {
      liveScreenshot: `screenshots/launch-ops/live-${stamp}.png`,
      gumroadScreenshot: `screenshots/launch-ops/gumroad-${stamp}.png`,
      checkoutScreenshot: `screenshots/launch-ops/checkout-${stamp}.png`,
    },
    notes: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  const page = await context.newPage();

  try {
    // 1) Verify live launch page
    await page.goto("https://z3r0dayzion-install.github.io/NeuralShell/", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1200);

    const url = page.url();
    result.liveUrl = url;
    result.checks.livePageLoaded = url.includes("github.io/NeuralShell");

    result.checks.liveHas149 = await safeTextIncludes(page, "$149");
    result.checks.liveHasSupport = await safeTextIncludes(page, "support@neuralshell.app");

    const gumroadLinks = await page.locator('a[href*="gumroad.com/l/neuralshell-operator"]').count();
    result.checks.liveHasGumroadLink = gumroadLinks > 0;

    await page.screenshot({ path: path.join(ROOT, result.evidence.liveScreenshot), fullPage: true });

    // 2) Follow checkout CTA to Gumroad
    let gumroadPage = page;
    const firstCta = page.locator('a[href*="gumroad.com/l/neuralshell-operator"]').first();
    const popupPromise = page.waitForEvent("popup", { timeout: 7000 }).catch(() => null);
    await firstCta.click({ timeout: 15000 });
    const popup = await popupPromise;
    if (popup) {
      gumroadPage = popup;
    } else {
      // Same tab navigation fallback
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
      gumroadPage = page;
    }

    await gumroadPage.waitForTimeout(2200);
    const gumroadUrl = gumroadPage.url();
    result.gumroadUrl = gumroadUrl;
    result.checks.gumroadProductLoaded = gumroadUrl.includes("gumroad.com/l/neuralshell-operator");

    result.checks.gumroadHasProductName = await safeTextIncludes(gumroadPage, "NeuralShell Operator");
    result.checks.gumroadHas149 = await safeTextIncludes(gumroadPage, "$149") || await safeTextIncludes(gumroadPage, "149");

    await gumroadPage.screenshot({ path: path.join(ROOT, result.evidence.gumroadScreenshot), fullPage: true });

    // 3) Checkout path smoke (do not place order)
    const checkoutSelectors = [
      'button:has-text("I want this")',
      'button:has-text("Buy this")',
      'button:has-text("Checkout")',
      'a:has-text("I want this")',
      'a:has-text("Buy this")',
    ];

    let clicked = false;
    for (const sel of checkoutSelectors) {
      const loc = gumroadPage.locator(sel).first();
      if (await loc.count()) {
        try {
          await loc.click({ timeout: 4000 });
          clicked = true;
          break;
        } catch {
          // keep trying next selector
        }
      }
    }

    if (!clicked) {
      // fallback: explicit product URL reload to ensure buyer page
      await gumroadPage.goto("https://gumroad.com/l/neuralshell-operator", { waitUntil: "domcontentloaded", timeout: 30000 });
      await gumroadPage.waitForTimeout(1500);
      result.notes.push("Checkout CTA click was not deterministic in headless mode; used fallback buyer-page probe.");
    }

    await gumroadPage.waitForTimeout(2200);

    const checkoutSignals = [
      await safeTextIncludes(gumroadPage, "Email address"),
      await safeTextIncludes(gumroadPage, "Card number"),
      await safeTextIncludes(gumroadPage, "Pay"),
      await safeTextIncludes(gumroadPage, "Checkout"),
      gumroadPage.url().includes("checkout"),
      gumroadPage.url().includes("gumroad.com/checkout"),
    ];
    result.checks.checkoutPathReachable = checkoutSignals.some(Boolean);

    await gumroadPage.screenshot({ path: path.join(ROOT, result.evidence.checkoutScreenshot), fullPage: true });

    if (!result.checks.checkoutPathReachable) {
      result.notes.push("Reached product page but checkout form not reliably exposed headless; manual click-through recommended for final pay-step confirmation.");
    }

    result.ok = Object.values(result.checks).every(Boolean);

    const reportPath = path.join(OUT_DIR, `launch-readiness-${stamp}.json`);
    writeJson(reportPath, result);
    process.stdout.write(`${JSON.stringify({ ok: result.ok, reportPath: path.relative(ROOT, reportPath), checks: result.checks }, null, 2)}\n`);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

run().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
  process.exit(1);
});
