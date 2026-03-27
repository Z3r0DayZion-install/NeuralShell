const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("Certification Flow", () => {
  let app;
  let page;
  let userDataDir;

  async function ensureShellReady() {
    await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    const onboardingClose = page.getByTestId("onboarding-close-btn");
    if (await onboardingClose.count()) {
      await onboardingClose.first().click().catch(() => {});
      await page.waitForTimeout(120);
    }
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-cert-"));
    app = await electron.launch({
      args: ["."],
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        LICENSE_MODE: "enterprise",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1"
      }
    });
    page = await app.firstWindow();
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => {
      globalThis.localStorage.setItem("neuralshell_onboarding_dismissed_v1", "1");
    });
    await page.reload();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  });

  test("certificate can be issued after passing quiz", async () => {
    await ensureShellReady();
    await page.getByTestId("ecosystem-open-btn").click();
    await expect(page.getByTestId("ecosystem-launcher")).toBeVisible();

    await page.getByTestId("ecosystem-module-certifications").click();
    const certCenter = page.getByTestId("certification-center");
    await expect(certCenter).toBeVisible();
    await page.getByTestId("certification-track-audit_operator").click();

    await certCenter.getByRole("button", { name: "/proof", exact: true }).click();
    await certCenter.getByRole("button", { name: "Auditor", exact: true }).click();
    await certCenter.getByRole("button", { name: "Support Bundle", exact: true }).click();

    await page.getByTestId("certification-issue-certificate-btn").click();
    await expect(certCenter).toContainText("Certificate issued", { timeout: 10000 });
  });
});
