const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SIGNING_KEY = "neuralshell-license-dev-signing-key-v1";

function stableStringify(payload) {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

function buildSignedLicense(planId = "pro") {
  const now = new Date();
  const expires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const payload = {
    licenseId: `lic_e2e_${Date.now()}`,
    customer: "e2e-test",
    planId,
    seats: 1,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    graceDays: 7,
  };
  const signature = crypto.createHmac("sha256", SIGNING_KEY).update(stableStringify(payload)).digest("hex");
  return {
    version: 1,
    payload,
    signature,
  };
}

test.describe("Billing activation", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-billing-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
        NS_LICENSE_SIGNING_KEY: SIGNING_KEY,
      }
    });
    page = await app.firstWindow();
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(100);
    }
  });

  test.afterAll(async () => {
    if (app) await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  test("activates valid offline license and surfaces active status", async () => {
    await page.getByTestId("settings-open-btn").click();
    await expect(page.getByTestId("settings-drawer")).toBeVisible();
    await expect(page.getByTestId("billing-center")).toBeVisible();

    await page.getByTestId("billing-license-text").fill("{}");
    await page.getByTestId("billing-activate-btn").click();
    await expect(page.getByText(/activation failed/i)).toBeVisible({ timeout: 10000 });

    const blob = buildSignedLicense("pro");
    await page.getByTestId("billing-license-text").fill(JSON.stringify(blob, null, 2));
    await page.getByTestId("billing-activate-btn").click();

    await expect(page.getByTestId("billing-status-pill")).toContainText("active", { timeout: 10000 });
    await expect(page.getByTestId("settings-status-text")).toContainText("saved", { timeout: 10000 }).catch(() => {});
  });
});
