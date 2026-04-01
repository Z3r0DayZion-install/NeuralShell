const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

async function launchApp(extraEnv = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-slash-"));
  const app = await electron.launch({
    args: ["."],
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      NEURAL_USER_DATA_DIR: userDataDir,
      NEURAL_IGNORE_INTEGRITY: "1",
      ...extraEnv,
    },
  });
  const page = await app.firstWindow();
  await expect(page.locator('[data-testid="top-status-bar"]')).toBeVisible({ timeout: 15000 });
  return { app, page, userDataDir };
}

async function closeApp(ctx) {
  if (!ctx) return;
  if (ctx.app) {
    await ctx.app.close();
  }
  try {
    fs.rmSync(ctx.userDataDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}

test.describe("NeuralShell Slash Palette", () => {
  test("opens via Ctrl+K and inserts selected slash template", async () => {
    const ctx = await launchApp();
    try {
      const { page } = ctx;
      const input = page.getByTestId("chat-input");
      await input.click();
      await page.keyboard.press("Control+K");
      await expect(page.getByTestId("slash-palette")).toBeVisible();

      const slashInput = page.getByTestId("slash-palette-input");
      await slashInput.fill("unit");
      await page.keyboard.press("Enter");

      await expect(input).toHaveValue(/\/unit-test/i);
      await expect(input).toBeFocused();
    } finally {
      await closeApp(ctx);
    }
  });

  test("audit-only mode remains write-locked after slash insertion", async () => {
    const ctx = await launchApp({ LICENSE_MODE: "auditor" });
    try {
      const { page } = ctx;
      const input = page.getByTestId("chat-input");
      await input.click();
      await page.keyboard.press("Control+K");
      await expect(page.getByTestId("slash-palette")).toBeVisible();

      await page.getByTestId("slash-palette-input").fill("refactor");
      await page.keyboard.press("Enter");

      await expect(input).toHaveValue(/\/refactor/i);
      await expect(page.getByRole("button", { name: "Execute Command" })).toBeDisabled();
      await expect(page.locator("text=Write actions disabled - upgrade to Pro.").first()).toBeVisible();
    } finally {
      await closeApp(ctx);
    }
  });
});
