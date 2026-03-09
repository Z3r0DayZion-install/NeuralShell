const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");
const paletteShortcut = process.platform === "darwin" ? "Meta+K" : "Control+K";

function mkUserDataDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-e2e-${label}-`));
}

function rmUserDataDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures in CI and local locked-file conditions.
  }
}

async function launchApp(userDataDir) {
  const app = await electron.launch({
    args: ["."],
    cwd: repoRoot,
    env: {
      ...process.env,
      NEURAL_USER_DATA_DIR: userDataDir
    }
  });
  const page = await app.firstWindow();
  await page.waitForSelector("#statusLabel", { state: "attached", timeout: 20000 });
  await page.waitForSelector("#onboardingOverlay", { state: "attached", timeout: 20000 });
  return { app, page };
}

async function expectOnboardingOpen(page, open) {
  await expect(page.locator("#onboardingOverlay")).toHaveAttribute(
    "aria-hidden",
    open ? "false" : "true"
  );
}

async function closeOnboardingViaSkip(page) {
  await expectOnboardingOpen(page, true);
  await page.click("#onboardingSkipBtn");
  await expectOnboardingOpen(page, false);
}

async function readTheme(page) {
  return page.evaluate(() => {
    return String(document.documentElement.getAttribute("data-theme") || "");
  });
}

test("onboarding is remembered and can be reset", async () => {
  const userDataDir = mkUserDataDir("onboarding");
  let app = null;
  try {
    let page;
    ({ app, page } = await launchApp(userDataDir));
    await closeOnboardingViaSkip(page);
    await app.close();
    app = null;

    ({ app, page } = await launchApp(userDataDir));
    await expectOnboardingOpen(page, false);
    await page.click("#onboardingResetBtn");
    await expectOnboardingOpen(page, true);
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("command palette toggles theme and closes cleanly", async () => {
  const userDataDir = mkUserDataDir("palette");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    const initialTheme = await readTheme(page);
    const expectedNextTheme = initialTheme === "dark" ? "light" : "dark";

    await page.keyboard.press(paletteShortcut);
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "false");

    await page.fill("#commandPaletteInput", "Toggle Theme");
    await expect(page.locator("#commandPaletteList")).toContainText("Toggle Theme");
    await page.keyboard.press("Enter");

    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "true");
    await expect.poll(async () => readTheme(page)).toBe(expectedNextTheme);
    await expect(page.locator("#themeSelect")).toHaveValue(expectedNextTheme);
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("profile editor and settings persist across restart", async () => {
  const userDataDir = mkUserDataDir("settings");
  let app = null;
  try {
    let page;
    ({ app, page } = await launchApp(userDataDir));
    await closeOnboardingViaSkip(page);

    await page.click("#profileNewBtn");
    await page.fill("#profileNameInput", "E2E Profile");
    await page.fill("#profileBaseUrlInput", "http://127.0.0.1:11434");
    await page.fill("#profileTimeoutInput", "18000");
    await page.fill("#profileRetryInput", "3");
    await page.click("#profileSaveBtn");
    await page.click("#profileUseBtn");

    await page.selectOption("#themeSelect", "light");
    await page.fill("#tokenBudgetInput", "2048");
    await page.fill("#autosaveNameInput", "e2e-autosave");
    await page.fill("#autosaveIntervalInput", "12");
    await page.check("#autosaveEnabledInput");
    await page.click("#applySettingsBtn");
    await expect(page.locator("#statusLabel")).toContainText("Settings applied.");

    await app.close();
    app = null;

    ({ app, page } = await launchApp(userDataDir));
    await expectOnboardingOpen(page, false);
    await expect(page.locator("#themeSelect")).toHaveValue("light");
    await expect(page.locator("#tokenBudgetInput")).toHaveValue("2048");
    await expect(page.locator("#autosaveNameInput")).toHaveValue("e2e-autosave");
    await expect(page.locator("#autosaveIntervalInput")).toHaveValue("12");
    await expect(page.locator("#autosaveEnabledInput")).toBeChecked();
    await expect(page.locator("#profileNameInput")).toHaveValue("E2E Profile");
    await expect(page.locator("#profileTimeoutInput")).toHaveValue("18000");
    await expect(page.locator("#profileRetryInput")).toHaveValue("3");

    const profileOptions = await page.locator("#profileSelect option").allTextContents();
    expect(profileOptions.some((text) => String(text).includes("E2E Profile"))).toBeTruthy();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});
