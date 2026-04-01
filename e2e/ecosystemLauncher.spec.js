const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Ecosystem Launcher Access", () => {
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
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-ecosystem-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
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

  test("free tier shows launcher and locks enterprise/pro modules", async () => {
    await ensureShellReady();
    await page.getByTestId("ecosystem-open-btn").click();
    await expect(page.getByTestId("ecosystem-launcher")).toBeVisible();

    await expect(page.getByTestId("ecosystem-module-ecosystem_launcher")).toBeVisible();
    await expect(page.getByTestId("ecosystem-module-locked-sales_console")).toBeVisible();
    await expect(page.getByTestId("ecosystem-module-locked-white_label")).toBeVisible();
    await expect(page.getByTestId("ecosystem-module-locked-partner_console")).toBeVisible();

    await page.getByTestId("ecosystem-role-select").selectOption("operator");
    await expect(page.getByTestId("ecosystem-module-locked-board_console")).toBeVisible();
    await page.getByTestId("ecosystem-close-btn").click();
    await expect(page.getByTestId("ecosystem-launcher")).toBeHidden({ timeout: 5000 });
  });
});
