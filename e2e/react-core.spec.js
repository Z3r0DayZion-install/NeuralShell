const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("NeuralShell React Core UI", () => {
    test.describe.configure({ mode: 'serial', timeout: 240000 });
    test.setTimeout(240000);
    let app;
    let page;
    let userDataDir;
    let sessionCounter = 0;

    function nextSessionName(prefix = "Workflow_E2E") {
        sessionCounter += 1;
        return `${prefix}_${sessionCounter}`;
    }

    async function ensureShellReady() {
        await expect(page.locator('[data-testid="top-status-bar"]')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('[data-testid="thread-rail"]')).toBeVisible({ timeout: 30000 });
        const onboardingClose = page.getByTestId('onboarding-close-btn');
        if (await onboardingClose.count()) {
            await onboardingClose.first().click().catch(() => {});
            await page.waitForTimeout(120);
        }
    }

    async function dismissOnboardingIfPresent() {
        const onboardingClose = page.getByTestId('onboarding-close-btn');
        if (await onboardingClose.count()) {
            await onboardingClose.first().click().catch(() => {});
            await page.waitForTimeout(120);
        }
    }

    async function createSession(name, passphrase) {
        const onboardingClose = page.getByTestId('onboarding-close-btn');
        if (await onboardingClose.count()) {
            await onboardingClose.first().click().catch(() => {});
            await page.waitForTimeout(120);
        }
        await page.getByTestId('new-thread-btn').click();
        const modal = page.getByTestId('session-modal');
        await expect(modal).toBeVisible();
        await page.getByTestId('session-modal-name-input').fill(name);
        await page.getByTestId('session-modal-pass-input').fill(passphrase);
        await page.getByTestId('session-modal-submit-btn').click();
        await expect(modal).toBeHidden({ timeout: 10000 });
        await expect(page.getByTestId(`session-item-${name}`)).toBeVisible();
    }

    async function sendCommand(command) {
        const composer = page.getByTestId('chat-input');
        await composer.fill(command);
        await page.getByRole('button', { name: 'Execute Command' }).click();
    }

    async function railWidth(testId) {
        const box = await page.getByTestId(testId).boundingBox();
        return box && Number.isFinite(box.width) ? box.width : 0;
    }

    test.beforeAll(async ({}, testInfo) => {
        testInfo.setTimeout(240000);
        // Create isolated user data directory to bypass Single Instance Locks
        userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-react-"));

        // Launch Electron app
        app = await electron.launch({
            args: ["."],
            cwd: path.resolve(__dirname, ".."),
            timeout: 120000,
            env: {
                ...process.env,
                NEURAL_USER_DATA_DIR: userDataDir,
                NEURAL_IGNORE_INTEGRITY: "1"
            }
        });
        page = await app.firstWindow({ timeout: 120000 });
    });

    test.afterAll(async () => {
        if (app) {
            await app.close();
        }
        try {
            fs.rmSync(userDataDir, { recursive: true, force: true });
        } catch (e) {
            // cleanup safely
        }
    });

    test("App boots and critical React shells render", async () => {
        // Wait for the renderer to load the React app
        await ensureShellReady();
        await expect(page.locator('[data-testid="workspace-panel"]')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('[data-testid="workbench-rail"]')).toBeVisible({ timeout: 30000 });
    });

    test("Trust indicators are present", async () => {
        const topBar = page.locator('[data-testid="top-status-bar"]');
        await expect(topBar).toContainText("Trust_Node_Sovereign");
    });

    test("Settings drawer opens, changes state, and preserves values", async () => {
        const settingsBtn = page.locator('[data-testid="settings-open-btn"]');
        const settingsDrawer = page.locator('[data-testid="settings-drawer"]');
        const providerSelect = page.locator('[data-testid="settings-provider-select"]');
        const testConnectionBtn = page.locator('[data-testid="settings-test-connection-btn"]');

        await settingsBtn.click();
        await expect(settingsDrawer).toBeVisible();

        // Change the provider to openrouter
        await providerSelect.selectOption('openrouter');
        await expect(providerSelect).toHaveValue('openrouter');

        // Wait for IPC asynchronous state persistence to clear the main process
        await page.waitForTimeout(1000);

        // Close it
        const closeBtn = page.locator('[data-testid="settings-close-btn"]');
        await closeBtn.click();
        await expect(settingsDrawer).toBeHidden({ timeout: 5000 });

        // Reopen to assert state persistence natively instead of just rendering
        await settingsBtn.click();
        await expect(settingsDrawer).toBeVisible();
        await expect(providerSelect).toHaveValue('openrouter');

        // Trigger a real bridge test call; outcome depends on local env/provider keys.
        await testConnectionBtn.click();

        // Reset to default
        await providerSelect.selectOption('ollama');
        await closeBtn.click();
    });

    test("Offline kill switch forces local-only bridge posture", async () => {
        const settingsBtn = page.locator('[data-testid="settings-open-btn"]');
        const settingsDrawer = page.locator('[data-testid="settings-drawer"]');
        const providerSelect = page.locator('[data-testid="settings-provider-select"]');
        const killSwitchBtn = page.locator('[data-testid="settings-offline-kill-btn"]');
        const closeBtn = page.locator('[data-testid="settings-close-btn"]');

        await settingsBtn.click();
        await expect(settingsDrawer).toBeVisible();

        await providerSelect.selectOption('openrouter');
        await expect(providerSelect).toHaveValue('openrouter');

        await killSwitchBtn.click();
        await expect(providerSelect).toHaveValue('ollama', { timeout: 10000 });
        await closeBtn.click();
        await expect(settingsDrawer).toBeHidden({ timeout: 5000 });
    });

    test("Command palette opens and closes", async () => {
        await page.locator('[data-testid="command-palette-btn"]').first().click();

        const palette = page.locator('[data-testid="command-palette"]');
        await expect(palette).toBeVisible();

        // Close palette via Escape
        await page.keyboard.press('Escape');
        await expect(palette).toBeHidden({ timeout: 5000 });
    });

    test("Layout presets adjust rail widths and reset panels", async () => {
        await ensureShellReady();
        await dismissOnboardingIfPresent();

        await page.getByTestId('layout-preset-balanced-btn').click();
        await page.waitForTimeout(120);

        const balancedThread = await railWidth('thread-rail');
        const balancedWorkbench = await railWidth('workbench-rail');
        expect(balancedThread).toBeGreaterThan(260);
        expect(balancedWorkbench).toBeGreaterThan(260);

        await page.getByTestId('layout-preset-compact-btn').click();
        await page.waitForTimeout(120);
        const compactThread = await railWidth('thread-rail');
        const compactWorkbench = await railWidth('workbench-rail');
        expect(compactThread).toBeLessThan(balancedThread);
        expect(compactWorkbench).toBeLessThan(balancedWorkbench);

        await page.getByTestId('layout-preset-wide-btn').click();
        await page.waitForTimeout(120);
        const wideThread = await railWidth('thread-rail');
        const wideWorkbench = await railWidth('workbench-rail');
        expect(wideThread).toBeGreaterThan(compactThread);
        expect(wideWorkbench).toBeGreaterThan(compactWorkbench);

        await dismissOnboardingIfPresent();
        await page.getByTestId('layout-reset-panels-btn').click({ force: true });
        await page.waitForTimeout(120);
        const resetThread = await railWidth('thread-rail');
        const resetWorkbench = await railWidth('workbench-rail');
        expect(Math.abs(resetThread - balancedThread)).toBeLessThan(20);
        expect(Math.abs(resetWorkbench - balancedWorkbench)).toBeLessThan(20);
    });

    test("Inline rail collapse toggles expose mini-rail expand controls", async () => {
        await ensureShellReady();

        const threadToggle = page.getByTestId('layout-toggle-thread-inline-btn');
        const workbenchToggle = page.getByTestId('layout-toggle-workbench-inline-btn');
        await expect(threadToggle).toBeVisible();
        await expect(workbenchToggle).toBeVisible();

        await threadToggle.click();
        await expect(page.getByTestId('thread-rail-mini-expand-btn')).toBeVisible();
        await page.getByTestId('thread-rail-mini-expand-btn').click();
        await expect(page.getByTestId('thread-rail')).toBeVisible();

        await workbenchToggle.click();
        await expect(page.getByTestId('workbench-rail-mini-expand-btn')).toBeVisible();
        await page.getByTestId('workbench-rail-mini-expand-btn').click();
        await expect(page.getByTestId('workbench-rail')).toBeVisible();
    });

    test("Keyboard shortcuts nudge rail widths", async () => {
        await ensureShellReady();
        await page.getByTestId('layout-preset-balanced-btn').click();
        await page.waitForTimeout(120);
        await page.locator('body').click();

        const threadBefore = await railWidth('thread-rail');
        await page.keyboard.press('Alt+]');
        await page.waitForTimeout(120);
        const threadAfter = await railWidth('thread-rail');
        expect(threadAfter).toBeGreaterThan(threadBefore);

        const workbenchBefore = await railWidth('workbench-rail');
        await page.keyboard.press('Alt+Shift+]');
        await page.waitForTimeout(120);
        const workbenchAfter = await railWidth('workbench-rail');
        expect(workbenchAfter).toBeGreaterThan(workbenchBefore);
    });

    test("Focused layout overlays expose resize handles", async () => {
        await ensureShellReady();
        await page.setViewportSize({ width: 980, height: 900 });
        await page.waitForTimeout(180);

        await page.getByTestId('layout-toggle-workflows-btn').click();
        await expect(page.getByTestId('thread-rail-overlay-resize-handle')).toBeVisible();
        await page.keyboard.press('Escape');

        await page.getByTestId('layout-toggle-workbench-btn').click();
        await expect(page.getByTestId('workbench-rail-overlay-resize-handle')).toBeVisible();
        await page.keyboard.press('Escape');

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForTimeout(180);
    });

    test("Composer accepts input", async () => {
        const composer = page.locator('[data-testid="composer-input"] textarea');
        await expect(composer).toBeVisible();
        await composer.fill("Initiate diagnostic sequence");

        const value = await composer.inputValue();
        expect(value).toBe("Initiate diagnostic sequence");
    });

    test("Thread creation mutates active workspace state", async () => {
        const firstSession = nextSessionName("Workflow_THREAD");
        const secondSession = nextSessionName("Workflow_THREAD");
        await createSession(firstSession, "thread-pass-1");
        await sendCommand("/guard");

        // Verify the message appeared
        await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(2);

        // Create a second session and ensure chat surface is reset for the new context
        await createSession(secondSession, "thread-pass-2");
        await expect(page.getByTestId(`session-item-${secondSession}`)).toBeVisible();

        // The workbench rail should reflect the new Thread ID
        const workbenchRail = page.locator('[data-testid="workbench-rail"]');
        await expect(workbenchRail).toContainText("Active_Workflow");

        // The chat surface should be empty in the new session
        await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(0);
    });

    test("Quick-Start cards trigger real kernel responses", async () => {
        const cardSession = nextSessionName("Workflow_CARD");
        await createSession(cardSession, "card-pass");

        const helpCard = page.locator('[data-testid="card-help"]');
        await helpCard.click();

        // Verify that /help was executed and "Available Commands" is shown
        const chatLog = page.locator('[data-testid="chat-message"]');
        await expect(chatLog.nth(1)).toContainText("NeuralShell Operator Guide");
    });

    test("Deal_Closer actions execute proof and ROI narratives", async () => {
        await sendCommand("/clear");

        await page.getByTestId("run-proof-btn").click();
        await expect(
            page.locator('[data-testid="chat-message"]').filter({ hasText: "90-Second Value Proof" })
        ).toHaveCount(1, { timeout: 10000 });

        const successCaptureClose = page.getByTestId('success-capture-close-btn');
        if (await successCaptureClose.count()) {
            await successCaptureClose.first().click().catch(() => {});
            await page.waitForTimeout(120);
        }

        await page.getByTestId("run-roi-btn").click();
        await expect(
            page.locator('[data-testid="chat-message"]').filter({ hasText: "NeuralShell ROI Snapshot" })
        ).toHaveCount(1, { timeout: 10000 });
    });

    test("/clear command wipes the local chat history", async () => {
        await sendCommand("Signal to be purged");

        await expect(page.locator('[data-testid="chat-message"]').first()).toBeVisible();

        // Type /clear
        await sendCommand("/clear");

        // Verify chat is empty
        await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(0);
    });

    // test("should provide a guided first-run experience", async ({ page }) => {
    //    // Enforce an uninitialized state for the first-run test after initial boot
    //    await page.evaluate(() => window.localStorage.clear());
    //    await page.reload();
    //
    //    // The logic should auto-select NeuralShell_QuickStart if no sessions exist
    //    const threadRail = page.getByTestId('thread-rail');
    //    await expect(threadRail).toContainText('NeuralShell_QuickStart', { timeout: 15000 });
    //
    //    const workspace = page.getByTestId('workspace-panel');
    //    // When QuickStart is active, the ChatLog renders the Zero-State Welcome
    //    await expect(workspace).toContainText('NeuralShell Workstation');
    //
    //    // If we clear the thread, we should see the "Operator Console" empty state
    //    chatInput = page.getByTestId('chat-input');
    //    await chatInput.fill('/clear');
    //    await chatInput.press('Enter');
    //
    //    await expect(workspace).toContainText('NeuralShell Operator Console');
    // });
});
