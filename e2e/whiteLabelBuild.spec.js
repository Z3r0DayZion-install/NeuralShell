const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("White-Label Build Flow", () => {
  let app;
  let page;
  let userDataDir;
  const signedConfigPath = path.resolve(__dirname, "..", "config", "white_label.json");

  async function ensureShellReady() {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(120);
    }
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-whitelabel-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        LICENSE_MODE: "enterprise",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1"
      }
    });
    page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
    });
    await page.reload();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  });

  test("signed white-label profile imports and can reset defaults", async () => {
    await ensureShellReady();
    await expect(page.getByTestId("ecosystem-open-btn")).toBeVisible();
    await page.getByTestId("ecosystem-open-btn").click();
    await expect(page.getByTestId("ecosystem-launcher")).toBeVisible();

    await page.getByTestId("ecosystem-module-white_label").click();
    await expect(page.getByTestId("branding-overrides")).toBeVisible();

    await page.getByTestId("branding-overrides-import-input").setInputFiles(signedConfigPath);
    await expect(page.getByTestId("branding-overrides")).toContainText("Applied signed profile", { timeout: 10000 });

    await page.getByTestId("branding-overrides-reset-btn").click();
    await expect(page.getByTestId("branding-overrides")).toContainText("Restored default NeuralShell branding profile.", { timeout: 10000 });
  });
});
