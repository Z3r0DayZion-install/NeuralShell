const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("NeuralShell Auditor Mode", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-auditor-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        LICENSE_MODE: "auditor",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
      },
    });
    page = await app.firstWindow();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  test("disables write controls but keeps proof flow available", async () => {
    await expect(page.locator('[data-testid="top-status-bar"]')).toContainText("Audit-Only", { timeout: 15000 });
    await expect(page.locator("text=Write actions disabled - upgrade to Pro.").first()).toBeVisible();
    await expect(page.getByTestId("new-thread-btn")).toBeDisabled();
    await expect(page.getByTestId("save-active-session-btn")).toBeDisabled();
    await expect(page.getByTestId("lock-active-session-btn")).toBeDisabled();

    await page.getByTestId("quickstart-proof-btn").click();
    await expect(
      page.locator('[data-testid="chat-message"]').filter({ hasText: "90-Second Value Proof" })
    ).toHaveCount(1, { timeout: 10000 });
  });
});
