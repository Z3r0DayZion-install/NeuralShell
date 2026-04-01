const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");

test("Voice room panel renders and join control is available", async () => {
  const app = await electron.launch({
    args: ["."],
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      NEURAL_IGNORE_INTEGRITY: "1"
    }
  });

  try {
    const page = await app.firstWindow();
    await expect(page.getByTestId("workspace-panel")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("voice-panel")).toBeVisible();
    await expect(page.getByTestId("voice-toggle-btn")).toBeVisible();
  } finally {
    await app.close();
  }
});

