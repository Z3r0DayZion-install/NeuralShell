const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Reaction hover bar", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-reaction-"));
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

  test("reaction bar stays hidden until hover and becomes actionable", async () => {
    await page.getByTestId("chat-input").fill("/help");
    await page.getByRole("button", { name: "Execute Command" }).click();

    const message = page.getByTestId("chat-message").last();
    const bar = message.getByTestId("reaction-bar");

    await page.mouse.move(2, 2);
    await page.waitForTimeout(140);
    const hiddenState = await bar.evaluate((node) => {
      const style = window.getComputedStyle(node);
      return {
        opacity: Number(style.opacity || 0),
        pointerEvents: style.pointerEvents
      };
    });
    expect(hiddenState.opacity).toBeLessThan(0.1);
    expect(hiddenState.pointerEvents).toBe("none");

    const box = await message.boundingBox();
    if (box) {
      await page.mouse.move(box.x + Math.min(24, box.width / 2), box.y + Math.min(24, box.height / 2));
    } else {
      await message.hover();
    }
    await page.waitForTimeout(260);

    let hoverState = await bar.evaluate((node) => {
      const style = window.getComputedStyle(node);
      return {
        opacity: Number(style.opacity || 0),
        pointerEvents: style.pointerEvents
      };
    });

    if (hoverState.opacity < 0.5) {
      const copyBtn = message.getByTestId("reaction-copy-btn");
      await copyBtn.focus();
      await page.waitForTimeout(120);
      hoverState = await bar.evaluate((node) => {
        const style = window.getComputedStyle(node);
        return {
          opacity: Number(style.opacity || 0),
          pointerEvents: style.pointerEvents
        };
      });
    }

    expect(hoverState.opacity).toBeGreaterThan(0.5);
    expect(hoverState.pointerEvents).toBe("auto");

    await message.getByTestId("reaction-copy-btn").click();
    await expect(page.getByTestId("copy-toast")).toContainText("Copied", { timeout: 5000 });
  });
});
