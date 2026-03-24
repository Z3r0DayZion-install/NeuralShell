const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e",
    timeout: 60000,
    expect: {
        timeout: 10000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
            animations: "disabled"
        }
    },
    fullyParallel: true,
    workers: 2,
    retries: 0,
    reporter: [["list"]],
    use: {
        viewport: { width: 1280, height: 800 },
        actionTimeout: 10000,
        navigationTimeout: 15000,
        colorScheme: "dark"
    }
});
