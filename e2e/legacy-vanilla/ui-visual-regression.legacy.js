const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");

function mkUserDataDir(label) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-visual-${label}-`));
}

function rmUserDataDir(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // Ignore cleanup failures
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
    await page.waitForSelector("#onboardingOverlay", { state: "attached", timeout: 20000 });

    // Stabilize UI: Disable animations and transitions
    await page.addStyleTag({
        content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
      }
    `
    });

    return { app, page };
}

async function closeOnboarding(page) {
    await page.click("#onboardingSkipBtn");
    await expect(page.locator("#onboardingOverlay")).toHaveAttribute("aria-hidden", "true");
}

test.describe("NeuralShell Visual Regression", () => {
    let userDataDir;
    let app;
    let page;

    test.beforeEach(async () => {
        userDataDir = mkUserDataDir("visual");
        ({ app, page } = await launchApp(userDataDir));
    });

    test.afterEach(async () => {
        if (app) await app.close();
        rmUserDataDir(userDataDir);
    });

    test("onboarding first-launch", async () => {
        // Snapshot the onboarding overlay locator specifically to avoid header noise
        await expect(page.locator("#onboardingOverlay")).toBeVisible();
        await expect(page.locator("#onboardingOverlay")).toHaveScreenshot("onboarding-first-launch.png", {
            maxDiffPixelRatio: 0.1
        });
    });

    test("governed runtime shell", async () => {
        await closeOnboarding(page);
        // Ensure main view is ready
        await expect(page.locator("#appHeader")).toBeVisible();
        await expect(page).toHaveScreenshot("governed-runtime-shell.png", {
            maxDiffPixelRatio: 0.1,
            mask: [
                page.locator("#clockTime"),
                page.locator("#cpuUsageHeader"),
                page.locator("#memoryUsageHeader"),
                page.locator("#tokenSummaryHeader")
            ]
        });
    });

    test("active profile bar", async () => {
        await closeOnboarding(page);
        // Force show the active profile bar for the snapshot
        await page.evaluate(() => {
            const apb = document.getElementById("activeProfileBar");
            apb.classList.remove("hidden");
            apb.removeAttribute("hidden");
            document.getElementById("apbProfileName").textContent = "Visual Test Profile";
            document.getElementById("apbProvider").textContent = "ollama";
            document.getElementById("apbModel").textContent = "llama3";
            document.getElementById("apbTrustBadge").textContent = "✓ Verified";
            document.getElementById("apbLastVerified").textContent = "2026-03-23 10:00:00";
        });
        await expect(page.locator("#activeProfileBar")).toBeVisible();
        await expect(page.locator("#activeProfileBar")).toHaveScreenshot("active-profile-bar.png", {
            maxDiffPixelRatio: 0.1,
            mask: [page.locator("#apbLastVerified")]
        });
    });

    test("system intelligence panel", async () => {
        await closeOnboarding(page);
        await page.click("#systemContextBtn");
        await expect(page.locator("#systemContextSection")).toBeVisible();

        // Seed some mock data for intelligence panel
        await page.evaluate(() => {
            document.getElementById("intelFocusText").textContent = "Visual Regression Audit";
            document.getElementById("intelCapabilityText").textContent = "UI Stability Guard";
            document.getElementById("intelNextActionText").textContent = "Freeze screenshot baselines";
        });

        await expect(page.locator("#systemContextSection")).toHaveScreenshot("system-intelligence-panel.png", {
            maxDiffPixelRatio: 0.1
        });
    });

    test("shipping verification cockpit", async () => {
        await closeOnboarding(page);
        await page.click("#systemShippingBtn");
        await expect(page.locator("#systemShippingSection")).toBeVisible();

        // Seed mock data for shipping
        await page.evaluate(() => {
            document.getElementById("systemShippingStateText").textContent = "STANDBY";
        });

        await expect(page.locator("#systemShippingSection")).toHaveScreenshot("shipping-verification-cockpit.png", {
            maxDiffPixelRatio: 0.1
        });
    });

    test("operator session persistence state", async () => {
        await closeOnboarding(page);

        // Seed a mock session state
        await page.evaluate(() => {
            window.NeuralShellRenderer.renderChat([
                { role: "user", content: "Verify UI drift protection." },
                { role: "assistant", content: "Visual regression suite is active. Baselines are locked." }
            ]);
            document.getElementById("activeSessionNameHeader").textContent = "Visual-Proof-Session";
        });

        await expect(page.locator(".panel-chat")).toHaveScreenshot("operator-session-persistence.png", {
            maxDiffPixelRatio: 0.1,
            mask: [page.locator("#clockTime")]
        });
    });
});
