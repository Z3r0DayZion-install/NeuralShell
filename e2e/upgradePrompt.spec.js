const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

test.describe("Upgrade prompt", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-upgrade-"));
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
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(100);
    }
  });

  test.afterAll(async () => {
    if (app) await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  test("opens upgrade modal when paid agent install is attempted on free tier", async () => {
    await page.getByTestId("settings-open-btn").click();
    await expect(page.getByTestId("settings-drawer")).toBeVisible();
    await expect(page.getByTestId("agent-store")).toBeVisible();

    await page.getByTestId("agent-store-install-refactor_pro").click();
    await expect(page.getByTestId("upgrade-modal-open-checkout")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("upgrade-modal-dismiss").click();
    await expect(page.getByTestId("upgrade-modal-open-checkout")).toBeHidden({ timeout: 5000 });
  });
});
