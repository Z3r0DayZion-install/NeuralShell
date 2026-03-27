const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Onboarding flow", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-onboarding-"));
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
  });

  test.afterAll(async () => {
    if (app) await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  test("first run wizard opens and executes a step", async () => {
    const runStepButton = page.getByTestId("onboarding-step-provider_sweep");
    await expect(runStepButton).toBeVisible({ timeout: 20000 });
    await runStepButton.click();
    await expect(runStepButton).toContainText("Done", { timeout: 5000 });
    await page.getByTestId("onboarding-close-btn").click();
    await expect(runStepButton).toBeHidden({ timeout: 5000 });
  });
});
