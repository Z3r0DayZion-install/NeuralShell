const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");

test("Provenance graph opens from workspace header", async () => {
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
    await page.getByTestId("open-prov-graph-btn").click();
    await expect(page.getByTestId("prov-graph-canvas")).toBeVisible();
    await page.getByTestId("prov-graph-close-btn").click();
  } finally {
    await app.close();
  }
});

