const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Release health console", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-release-health-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
        LICENSE_MODE: "enterprise"
      }
    });
    page = await app.firstWindow();
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (app) await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  test("opens release health section and refreshes report", async () => {
    await page.getByTestId("settings-open-btn").click();
    const drawer = page.getByTestId("settings-drawer");
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await drawer.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const section = page.getByTestId("release-health-console");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible({ timeout: 10000 });
    const refresh = page.getByTestId("release-health-refresh-btn");
    await refresh.click();
    await expect(section).toContainText(/Status/i);
  });
});
