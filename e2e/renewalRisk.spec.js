const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Renewal Risk Console", () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_first_boot_dismissed_v1", "1");
      globalThis.localStorage.removeItem("neuralshell_renewal_risk_history_v1");
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-renewal-risk-"));
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

  test("computes and exports renewal risk summary", async () => {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 20000 });
    await page.getByTestId("mission-control-open-btn").click();
    await page.getByTestId("mission-control-open-renewal-risk-btn").click();
    await expect(page.getByTestId("renewal-risk-console")).toBeVisible();
    await page.getByTestId("renewal-risk-generate-btn").click();
    await expect(page.getByTestId("renewal-risk-console")).toContainText("Generated renewal summary", { timeout: 10000 });
  });
});
