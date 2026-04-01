#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("playwright");

async function dismissLegacyOnboarding(page) {
  const close = page.getByTestId("onboarding-close-btn");
  if (await close.count()) {
    await close.first().click().catch(() => {});
    await page.waitForTimeout(120);
  }
}

async function ensureReady(page) {
  await page.getByTestId("top-status-bar").waitFor({ timeout: 15000 });
  await dismissLegacyOnboarding(page);
  await page.getByTestId("firstboot-progress-rail").waitFor({ timeout: 10000 });
}

async function capture(page, filePath) {
  await page.waitForTimeout(220);
  await page.screenshot({ path: filePath, fullPage: false });
}

async function openMissionControl(page) {
  await page.getByTestId("mission-control-open-btn").click();
  await page.getByTestId("mission-control").waitFor({ timeout: 10000 });
}

async function closeMissionControl(page) {
  const close = page.getByTestId("mission-control-close-btn");
  if (await close.count()) {
    await close.click();
    await page.getByTestId("mission-control").waitFor({ state: "hidden", timeout: 10000 });
  }
}

async function main() {
  const root = process.cwd();
  const screenshotDir = path.resolve(root, "screenshots", "delta11");
  fs.mkdirSync(screenshotDir, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-delta11-shots-"));
  let app = null;

  try {
    app = await electron.launch({
      args: ["."],
      cwd: root,
      env: {
        ...process.env,
        LICENSE_MODE: "enterprise",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
      },
    });
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1680, height: 980 });
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.removeItem("neuralshell_first_boot_dismissed_v1");
      globalThis.localStorage.removeItem("neuralshell_first_boot_progress_v1");
      globalThis.localStorage.removeItem("neuralshell_first_boot_events_v1");
      globalThis.localStorage.removeItem("neuralshell_runtime_snapshots_v1");
      globalThis.localStorage.removeItem("neuralshell_runtime_event_feed_v1");
    });
    await page.reload();

    await ensureReady(page);
    await capture(page, path.join(screenshotDir, "firstboot-progress-rail.png"));

    await page.getByTestId("firstboot-reopen-btn").click();
    await page.getByTestId("firstboot-authority-wizard").waitFor({ timeout: 10000 });
    await capture(page, path.join(screenshotDir, "firstboot-authority-wizard.png"));
    await page.getByTestId("firstboot-close-btn").click();
    await page.getByTestId("firstboot-authority-wizard").waitFor({ state: "hidden", timeout: 10000 });

    await openMissionControl(page);
    await capture(page, path.join(screenshotDir, "mission-control.png"));

    await page.getByTestId("mission-control-open-nodechain-btn").click();
    await page.getByTestId("nodechain-panel").waitFor({ timeout: 10000 });
    await capture(page, path.join(screenshotDir, "nodechain-rules.png"));
    await page.getByTestId("nodechain-close-btn").click();
    await page.getByTestId("nodechain-panel").waitFor({ state: "hidden", timeout: 10000 });

    await page.getByTestId("mission-control-open-splitworkspace-btn").click();
    await page.getByTestId("split-workspace").waitFor({ timeout: 10000 });
    await page.getByTestId("split-pane-proof-btn").click();
    await capture(page, path.join(screenshotDir, "split-workspace-proof-pane.png"));
    await page.getByTestId("split-workspace-close-btn").click();
    await page.getByTestId("split-workspace").waitFor({ state: "hidden", timeout: 10000 });

    await closeMissionControl(page);

    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_vault_last_action_v1", "error: simulated vault io failure");
    });
    await page.waitForTimeout(7000);
    await page.getByTestId("watchdog-status-badge").click();
    await page.getByTestId("runtime-alerts-drawer").waitFor({ timeout: 10000 });
    await capture(page, path.join(screenshotDir, "watchdog-degraded-alerts.png"));
    await page.getByTestId("runtime-alerts-close-btn").click();
    await page.getByTestId("runtime-alerts-drawer").waitFor({ state: "hidden", timeout: 10000 });

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

