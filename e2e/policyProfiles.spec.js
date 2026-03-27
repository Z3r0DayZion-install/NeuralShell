const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Policy profiles", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-policy-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
        LICENSE_MODE: "operator"
      }
    });
    page = await app.firstWindow();
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (app) await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  test("applies offline policy profile", async () => {
    await page.getByTestId("settings-open-btn").click();
    const drawer = page.getByTestId("settings-drawer");
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await drawer.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const applyOffline = page.getByTestId("policy-apply-offline_only");
    await applyOffline.scrollIntoViewIfNeeded();
    await expect(applyOffline).toBeVisible({ timeout: 10000 });
    await applyOffline.click();
    await expect(page.getByText(/Applied offline_only/)).toBeVisible({ timeout: 10000 });
  });
});
