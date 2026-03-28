const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Training Delivery Pack", () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_first_boot_dismissed_v1", "1");
      globalThis.localStorage.removeItem("neuralshell_training_bundle_history_v1");
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-training-delivery-"));
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
    await prepState();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  test("generates offline training bundle", async () => {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 20000 });

    await page.getByTestId("mission-control-open-btn").click();
    await page.getByTestId("mission-control-open-training-delivery-btn").click();
    await expect(page.getByTestId("training-delivery-center")).toBeVisible();

    await page.getByTestId("training-generate-bundle-btn").click();
    await expect(page.getByTestId("training-delivery-center")).toContainText("Generated offline training bundle", { timeout: 10000 });
  });
});
