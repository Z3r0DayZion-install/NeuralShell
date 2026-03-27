const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('NodeChain Runtime Rules', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-nodechain-'));
    app = await electron.launch({
      args: ['.'],
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: '1',
      },
    });
    page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await prepState();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  test('dispatches manual events and records execution logs', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-nodechain-btn').click();

    await expect(page.getByTestId('nodechain-panel')).toBeVisible();
    await expect(page.getByTestId('nodechain-rule-editor')).toBeVisible();

    await page.getByTestId('nodechain-event-select').selectOption('proof.passed');
    await page.getByTestId('nodechain-run-event-btn').click();

    await expect(page.getByTestId('nodechain-logs')).toBeVisible();
    await expect(page.getByTestId('nodechain-logs')).toContainText('proof-pass-share-and-snapshot');
  });
});