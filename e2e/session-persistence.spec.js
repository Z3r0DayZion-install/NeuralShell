const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");

test.describe("NeuralShell Session Persistence", () => {
    test.describe.configure({ mode: "serial" });
    let app;
    let page;
    let userDataDir;

    async function createSession(name, passphrase) {
        await page.getByTestId("new-thread-btn").click();
        const modal = page.getByTestId("session-modal");
        await expect(modal).toBeVisible();
        await page.getByTestId("session-modal-name-input").fill(name);
        await page.getByTestId("session-modal-pass-input").fill(passphrase);
        await page.getByTestId("session-modal-submit-btn").click();
        await expect(modal).toBeHidden({ timeout: 10000 });
        await expect(page.getByTestId(`session-item-${name}`)).toBeVisible();
    }

    async function runSlash(command) {
        await page.getByTestId("chat-input").fill(command);
        await page.getByRole("button", { name: "Execute Command" }).click();
    }

    test.beforeAll(async () => {
        userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-e2e-persist-"));
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
        await expect(page.getByTestId("top-status-bar")).toBeVisible({ timeout: 15000 });
    });

    test.afterAll(async () => {
        if (app) {
            await app.close();
        }
        try {
            fs.rmSync(userDataDir, { recursive: true, force: true });
        } catch {
            // ignore cleanup failures
        }
    });

    test("creates, saves, and restores independent session histories", async () => {
        await createSession("Workflow_ALPHA", "alpha-pass");
        await runSlash("/guard");
        await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(2);
        await page.getByTestId("save-active-session-btn").click();
        await expect(page.getByTestId("session-rail-status")).toContainText("Saved", { timeout: 10000 });

        await createSession("Workflow_BETA", "beta-pass");
        await runSlash("/help");
        await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(2);
        await page.getByTestId("save-active-session-btn").click();
        await expect(page.getByTestId("session-rail-status")).toContainText("Saved", { timeout: 10000 });

        const alphaDisk = await page.evaluate(async () => {
            const payload = await globalThis.window.api.session.load("Workflow_ALPHA", "alpha-pass");
            return Array.isArray(payload && payload.chat) ? payload.chat.map((entry) => String(entry.content || "")) : [];
        });
        const betaDisk = await page.evaluate(async () => {
            const payload = await globalThis.window.api.session.load("Workflow_BETA", "beta-pass");
            return Array.isArray(payload && payload.chat) ? payload.chat.map((entry) => String(entry.content || "")) : [];
        });
        expect(alphaDisk.some((line) => line.includes("Security Guard: ACTIVE"))).toBeTruthy();
        expect(betaDisk.some((line) => line.includes("NeuralShell Operator Guide"))).toBeTruthy();

        await page.getByTestId("session-item-Workflow_ALPHA").click();
        await expect(page.locator('[data-testid="chat-message"]').nth(1)).toContainText("Security Guard: ACTIVE");

        await page.getByTestId("session-item-Workflow_BETA").click();
        await expect(page.locator('[data-testid="chat-message"]').nth(1)).toContainText("NeuralShell Operator Guide");
    });

    test("supports explicit lock and optional auto-lock on blur", async () => {
        await page.getByTestId("lock-active-session-btn").click();
        await expect(page.getByTestId("session-lock-banner")).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId("session-rail-status")).toContainText("Locked");

        await page.getByTestId("session-lock-unlock-btn").click();
        await expect(page.getByTestId("session-modal")).toBeVisible();
        await page.getByTestId("session-modal-pass-input").fill("beta-pass");
        await page.getByTestId("session-modal-submit-btn").click();
        await expect(page.getByTestId("session-modal")).toBeHidden({ timeout: 10000 });
        await expect(page.getByTestId("session-lock-banner")).toBeHidden();

        await page.getByTestId("session-autolock-toggle").check();
        await page.evaluate(() => {
            globalThis.window.dispatchEvent(new globalThis.Event("blur"));
        });
        await expect(page.getByTestId("session-lock-banner")).toBeVisible({ timeout: 10000 });
    });
});
