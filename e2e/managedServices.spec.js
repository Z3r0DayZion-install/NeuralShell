const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Managed Services Console", () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_first_boot_dismissed_v1", "1");
      globalThis.localStorage.removeItem("neuralshell_managed_services_state_v1");
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-managed-services-"));
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
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  });

  test("raises account risk and exports weekly summary", async () => {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 20000 });
    await page.getByTestId("mission-control-open-btn").click();
    await page.getByTestId("mission-control-open-managed-services-btn").click();
    await expect(page.getByTestId("managed-services-console")).toBeVisible();
    await page.getByTestId("managed-services-raise-risk-btn").click();
    await page.getByTestId("managed-services-export-btn").click();
    await expect(page.getByTestId("managed-services-console")).toContainText("Exported managed services weekly summary", { timeout: 10000 });
  });
});
