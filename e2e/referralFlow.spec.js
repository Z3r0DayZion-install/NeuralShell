const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

test.describe("Referral flow", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-referral-"));
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

  test("creates and exports referral attribution report", async () => {
    await page.getByTestId("settings-open-btn").click();
    await expect(page.getByTestId("referral-card")).toBeVisible();

    await page.getByTestId("referral-base-url").fill("https://gumroad.com/l/neuralshell-operator");
    await page.getByTestId("referral-generate-btn").click();
    await expect(page.getByTestId("referral-status")).toContainText(/Created referral NSREF-/i, { timeout: 10000 });

    await page.getByTestId("referral-export-btn").click();
    await expect(page.getByTestId("referral-status")).toContainText(/Referral report exported/i, { timeout: 10000 });
  });
});
