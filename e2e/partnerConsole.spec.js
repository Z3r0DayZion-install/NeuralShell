const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Partner Console Flow", () => {
  let app;
  let page;
  let userDataDir;

  async function ensureShellReady() {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(120);
    }
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-partner-"));
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

  test("partner registration works and role gating locks non-allowed access", async () => {
    await ensureShellReady();
    await page.getByTestId("ecosystem-open-btn").click();
    await expect(page.getByTestId("ecosystem-launcher")).toBeVisible();

    await page.getByTestId("ecosystem-module-partner_console").click();
    const partnerConsole = page.getByTestId("partner-console");
    await expect(partnerConsole).toBeVisible();
    await page.getByTestId("partner-console-add-row-btn").click();
    await expect(page.locator('[data-testid="partner-console"] tbody tr')).toHaveCount(1, { timeout: 10000 });

    await page.getByTestId("ecosystem-role-select").selectOption("operator");
    await expect(page.getByTestId("ecosystem-module-locked-partner_console")).toBeVisible();
  });
});
