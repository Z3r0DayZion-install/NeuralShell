const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Executive Scale Dashboard", () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_first_boot_dismissed_v1", "1");
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-exec-scale-"));
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

  test("shows scale cards and supports drilldown", async () => {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 20000 });
    await page.getByTestId("mission-control-open-btn").click();
    await page.getByTestId("mission-control-open-executive-scale-btn").click();
    await expect(page.getByTestId("executive-scale-dashboard")).toBeVisible();
    await page.getByTestId("executive-scale-open-managed-services").click();
    await expect(page.getByTestId("managed-services-console")).toBeVisible({ timeout: 10000 });
  });
});
