const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Context chips", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-context-chip-"));
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

  test("selecting file text shows chips and inserts slash prompt", async () => {
    const viewer = page.getByTestId("workspace-file-viewer");
    await expect(viewer).toBeVisible();

    await page.evaluate(() => {
      const viewerNode = document.querySelector('[data-testid="workspace-file-viewer"]');
      if (!viewerNode) return;
      const textNode = viewerNode.firstChild;
      if (!textNode) return;
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(28, textNode.textContent ? textNode.textContent.length : 0));
      const selection = window.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(range);
      viewerNode.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const chipBar = page.getByTestId("context-chip-bar");
    await expect(chipBar).toBeVisible();

    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="context-chip-explain"]');
      if (!button) return;
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    const composer = page.getByTestId("chat-input");
    await expect(composer).toBeFocused();
    await expect(composer).toHaveValue(/\/explain/i);
  });
});
