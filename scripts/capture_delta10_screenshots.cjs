#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("playwright");

async function dismissOnboarding(page) {
  const close = page.getByTestId("onboarding-close-btn");
  if (await close.count()) {
    await close.first().click().catch(() => {});
    await page.waitForTimeout(120);
  }
}

async function ensureReady(page) {
  await page.getByTestId("top-status-bar").waitFor({ timeout: 15000 });
  await dismissOnboarding(page);
}

async function capture(page, filePath) {
  await page.waitForTimeout(180);
  await page.screenshot({ path: filePath, fullPage: false });
}

async function main() {
  const root = process.cwd();
  const screenshotDir = path.resolve(root, "screenshots", "delta10");
  fs.mkdirSync(screenshotDir, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-delta10-shots-"));
  let app = null;

  try {
    app = await electron.launch({
      args: ["."],
      cwd: root,
      env: {
        ...process.env,
        LICENSE_MODE: "enterprise",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1"
      }
    });
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1680, height: 980 });
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
    });
    await page.reload();

    await ensureReady(page);
    await page.getByTestId("ecosystem-open-btn").click();
    await page.getByTestId("ecosystem-launcher").waitFor({ timeout: 10000 });

    await capture(page, path.join(screenshotDir, "ecosystem-launcher.png"));

    const modules = [
      {
        moduleId: "sales_console",
        readyTestId: "sales-console",
        fileName: "sales-console.png"
      },
      {
        moduleId: "partner_console",
        readyTestId: "partner-console",
        fileName: "partner-console.png"
      },
      {
        moduleId: "certifications",
        readyTestId: "certification-center",
        fileName: "certification-center.png"
      },
      {
        moduleId: "white_label",
        readyTestId: "branding-overrides",
        fileName: "branding-overrides.png"
      },
      {
        moduleId: "enterprise_policy",
        readyTestId: "enterprise-policy-suite",
        fileName: "enterprise-policy-suite.png"
      }
    ];

    for (const target of modules) {
      await page.getByTestId(`ecosystem-module-${target.moduleId}`).click();
      await page.getByTestId(target.readyTestId).waitFor({ timeout: 10000 });
      await capture(page, path.join(screenshotDir, target.fileName));
    }

    process.stdout.write(`${screenshotDir}\n`);
  } finally {
    if (app) {
      await app.close().catch(() => {});
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}

main().catch((err) => {
  process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
  process.exit(1);
});
