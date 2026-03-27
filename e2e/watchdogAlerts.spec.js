const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Watchdog Alerts', () => {
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
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-watchdog-'));
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

  test('opens watchdog drawer and exposes alert state', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('watchdog-status-badge').click();
    await expect(page.getByTestId('runtime-alerts-drawer')).toBeVisible();

    const empty = page.getByText('No active watchdog alerts.');
    if (await empty.count()) {
      await expect(empty).toBeVisible();
    } else {
      await expect(page.locator('[data-testid^="runtime-alert-ack-"]').first()).toBeVisible();
    }
  });
});