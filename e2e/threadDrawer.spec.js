const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Thread drawer", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-thread-"));
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

  test("start thread, add reply, close and reopen", async () => {
    await page.getByTestId("chat-input").fill("/help");
    await page.getByRole("button", { name: "Execute Command" }).click();

    const message = page.getByTestId("chat-message").last();
    await message.hover();
    const threadBtn = message.getByTestId("reaction-thread-btn");
    await threadBtn.focus();
    await page.keyboard.press("Enter");

    const drawer = page.getByTestId("thread-drawer");
    await expect(drawer).toBeVisible();
    await page.getByTestId("thread-reply-input").fill("Follow up context for this answer.");
    await page.getByTestId("thread-reply-send").click();
    await expect(drawer).toContainText("Follow up context for this answer.");

    await page.getByTestId("thread-drawer-close").click();
    await expect(drawer).toBeHidden({ timeout: 5000 });

    await message.hover();
    await threadBtn.focus();
    await page.keyboard.press("Enter");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Follow up context for this answer.");
  });
});
