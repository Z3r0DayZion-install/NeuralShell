const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("NeuralShell React Core UI", () => {
    test.describe.configure({ mode: 'serial' });
    let app;
    let page;
    let userDataDir;

    test.beforeAll(async () => {
        // Create isolated user data directory to bypass Single Instance Locks
        userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-react-"));

        // Launch Electron app
        app = await electron.launch({
            args: ["."],
            cwd: path.resolve(__dirname, ".."),
            env: {
                ...process.env,
                NEURAL_USER_DATA_DIR: userDataDir,
                NEURAL_IGNORE_INTEGRITY: "1"
            }
        });
        page = await app.firstWindow();
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
        await expect(page.locator('[data-testid="top-status-bar"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="thread-rail"]')).toBeVisible();
        await expect(page.locator('[data-testid="workspace-panel"]')).toBeVisible();
        await expect(page.locator('[data-testid="workbench-rail"]')).toBeVisible();
    });

    test("Trust indicators are present", async () => {
        const topBar = page.locator('[data-testid="top-status-bar"]');
        await expect(topBar).toContainText("Trust_Node_Sovereign");
    });

    test("Settings drawer opens, changes state, and preserves values", async () => {
        const settingsBtn = page.locator('[data-testid="settings-open-btn"]');
        const settingsDrawer = page.locator('[data-testid="settings-drawer"]');
        const providerSelect = page.locator('[data-testid="settings-provider-select"]');

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

        // Reset to default
        await providerSelect.selectOption('ollama');
        await closeBtn.click();
    });

    test("Command palette opens and closes", async () => {
        await page.locator('[data-testid="command-palette-btn"]').first().click();

        const palette = page.locator('[data-testid="command-palette"]');
        await expect(palette).toBeVisible();

        // Close palette via Escape
        await page.keyboard.press('Escape');
        await expect(palette).toBeHidden({ timeout: 5000 });
    });

    test("Composer accepts input", async () => {
        const composer = page.locator('[data-testid="composer-input"] textarea');
        await expect(composer).toBeVisible();
        await composer.fill("Initiate diagnostic sequence");

        const value = await composer.inputValue();
        expect(value).toBe("Initiate diagnostic sequence");
    });

    test("Thread creation mutates active workspace state", async () => {
        // Send a message first
        const composer = page.locator('[data-testid="composer-input"] textarea');
        await composer.fill("Diagnostic echo sequence");
        await page.locator('[data-testid="composer-input"] button').click();

        // Verify the message appeared
        const chatMessage = page.locator('[data-testid="chat-message"]').first();
        await expect(chatMessage).toBeVisible();

        // Trigger New Thread
        await page.locator('[data-testid="new-thread-btn"]').click();

        // The workbench rail should reflect the new Thread ID
        const workbenchRail = page.locator('[data-testid="workbench-rail"]');
        await expect(workbenchRail).toContainText("Active_Workflow");

        // The chat surface should be completely wiped out (resuming empty state)
        await expect(chatMessage).toBeHidden();
    });

    test("Quick-Start cards trigger real kernel responses", async () => {
        // Resume empty state if needed
        await page.locator('[data-testid="new-thread-btn"]').click();

        const helpCard = page.locator('[data-testid="card-help"]');
        await helpCard.click();

        // Verify that /help was executed and "Available Commands" is shown
        const chatLog = page.locator('[data-testid="chat-message"]');
        await expect(chatLog.nth(1)).toContainText("NeuralShell Operator Guide");
    });

    test("/clear command wipes the local chat history", async () => {
        const composer = page.locator('[data-testid="composer-input"] textarea');
        await composer.fill("Signal to be purged");
        await page.locator('[data-testid="composer-input"] button').click();

        await expect(page.locator('[data-testid="chat-message"]').first()).toBeVisible();

        // Type /clear
        await composer.fill("/clear");
        await page.locator('[data-testid="composer-input"] button').click();

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
