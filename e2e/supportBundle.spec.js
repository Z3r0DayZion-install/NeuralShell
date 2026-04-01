const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Support bundle export", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-support-"));
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

  test("exports sanitized support bundle from settings drawer", async () => {
    await page.getByTestId("settings-open-btn").click();
    const drawer = page.getByTestId("settings-drawer");
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await drawer.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const exportButton = page.getByTestId("support-bundle-export-btn");
    await exportButton.scrollIntoViewIfNeeded();
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();
    await expect(page.getByText(/Bundle exported:/)).toBeVisible({ timeout: 20000 });
  });
});
