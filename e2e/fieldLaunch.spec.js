const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Field Launch Command Center", () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_first_boot_dismissed_v1", "1");
      globalThis.localStorage.setItem("neuralshell_demo_mode_v1", "1");
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-field-launch-"));
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

  test("shows launch readiness and drills down to demo flow", async () => {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 20000 });

    await page.getByTestId("field-launch-open-btn").click();
    await expect(page.getByTestId("field-launch-command-center")).toBeVisible();
    await expect(page.getByTestId("field-launch-command-center")).toContainText("Readiness Cards");

    await page.getByTestId("field-launch-open-demo-flow").click();
    await expect(page.getByTestId("demo-flow-console")).toBeVisible({ timeout: 10000 });
  });
});
