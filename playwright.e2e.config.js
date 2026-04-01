const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    actionTimeout: 10000,
    navigationTimeout: 15000
  }
});
