const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");
const paletteShortcut = process.platform === "darwin" ? "Meta+K" : "Control+K";

function mkUserDataDir(label) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-operator-${label}-`));
}

function rmUserDataDir(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // Ignore cleanup failures
    }
}

async function launchApp(userDataDir, extraEnv = {}) {
    const app = await electron.launch({
        args: ["."],
        cwd: repoRoot,
        env: {
            ...process.env,
            ...extraEnv,
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

test.describe.serial("Operator Flow", () => {
    let userDataDir;
    let app;
    let page;

    test.beforeAll(() => {
        userDataDir = mkUserDataDir("serial");
    });

    test.afterAll(async () => {
        if (app) await app.close();
        rmUserDataDir(userDataDir);
    });

    test.afterEach(async () => {
        if (app) await app.close();
    });

    test("Test 1: First launch to setup", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;

        await expectOnboardingOpen(page, true);
        await closeOnboardingViaSkip(page);

        await expect(page.locator("#appHeader")).toBeVisible();
    });

    test("Test 2: Calm startup", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;

        await expectOnboardingOpen(page, false);
        await expect(page.locator("#appHeader")).toBeVisible();
    });

    test("Test 3: Profile selection", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;
        await expectOnboardingOpen(page, false);

        // Open settings panel where profile selection lives
        await page.click("#settingsMenuOpenBtn", { force: true });
        await expect(page.locator("#settingsMenuPanel")).toHaveAttribute("aria-hidden", "false");

        // Assert profile action buttons and select are accessible
        await expect(page.locator("#profileSelect")).toBeVisible();
        await expect(page.locator("#profileTestBtn")).toBeVisible();

        // Close settings
        await page.click("#settingsMenuCloseBtn", { force: true });
        await expect(page.locator("#settingsMenuPanel")).toHaveAttribute("aria-hidden", "true");
    });

    test("Test 4: Offline entry", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;
        await expectOnboardingOpen(page, false);

        // Toggle offline using the switch label
        await page.locator("label[for='offlineModeInput']").click();

        // Verify offline badge/style
        await expect(page.locator("#globalBridgeStatusText")).toContainText(/offline|disconnected/i);

        // Toggle back online
        await page.locator("label[for='offlineModeInput']").click();
    });

    test("Test 5: Verify / repair visibility", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;
        await expectOnboardingOpen(page, false);

        // Verify and Repair buttons are present in the DOM but hidden because no profile is active
        await expect(page.locator("#activeProfileBar")).toBeHidden();
        await expect(page.locator("#apbVerifyBtn")).toBeAttached();
        await expect(page.locator("#apbRepairBtn")).toBeAttached();
    });

    test("Test 6: Basic workspace/session actions", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;
        await expectOnboardingOpen(page, false);

        // Type a message in composer
        await page.fill("#promptInput", "Hello NeuralShell");

        // Click send
        await page.click("#sendBtn", { force: true });

        // The message should either appear in chat or the session should rename to Draft
        await expect(page.locator("#activeSessionNameHeader")).toBeVisible();
        await expect(page.locator("#chatHistory")).toContainText("Hello NeuralShell");
    });

    test("Test 7: Persistence across relaunch", async () => {
        const launched = await launchApp(userDataDir);
        app = launched.app;
        page = launched.page;
        await expectOnboardingOpen(page, false);

        // Verify session header is intact
        await expect(page.locator("#activeSessionNameHeader")).toBeVisible();
    });
});
