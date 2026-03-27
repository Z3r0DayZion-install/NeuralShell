const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");

test("Agent store installs verified core agent", async () => {
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
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(100);
    }
    await page.getByTestId("settings-open-btn").click();
    await expect(page.getByTestId("settings-drawer")).toBeVisible();
    await expect(page.getByTestId("agent-store")).toBeVisible();
    const installBtn = page.getByTestId("agent-store-install-proof_guard");
    await expect(installBtn).toBeVisible();
  } finally {
    await app.close();
  }
});
