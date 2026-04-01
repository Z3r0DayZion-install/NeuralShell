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

function signedProLicense() {
  const now = new Date();
  const payload = {
    licenseId: `lic_market_${Date.now()}`,
    customer: "e2e-market",
    planId: "pro",
    seats: 1,
    issuedAt: now.toISOString(),
    graceDays: 7,
  };
  return {
    version: 1,
    payload,
    signature: crypto.createHmac("sha256", SIGNING_KEY).update(stableStringify(payload)).digest("hex"),
  };
}

test.describe("Marketplace paid install", () => {
  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    const receiptStore = path.join(os.homedir(), ".neuralshell", "marketplace", "install_receipts.json");
    if (fs.existsSync(receiptStore)) {
      fs.rmSync(receiptStore, { force: true });
    }
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-market-"));
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

  test("requires receipt for paid agent install and succeeds with receipt", async () => {
    const license = signedProLicense();
    await page.evaluate(async (blob) => {
      await window.api.license.activateBlob(blob);
    }, license);

    await page.reload();
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(100);
    }

    await page.getByTestId("settings-open-btn").click();
    await expect(page.getByTestId("agent-store")).toBeVisible();
    await expect(page.getByTestId("agent-store-receipt-status-refactor_pro")).toContainText(/receipt required/i);

    await page.getByTestId("agent-store-install-refactor_pro").click();
    await expect(page.getByTestId("agent-store-status")).toContainText(/install failed/i, { timeout: 10000 });

    await page.getByTestId("agent-store-receipt-refactor_pro").fill("rcpt_E2E_REF_12345");
    await page.getByTestId("agent-store-install-refactor_pro").click();
    await expect(page.getByTestId("agent-store-status")).toContainText(/Installed refactor_pro/i, { timeout: 10000 });
  });
});
