const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Mission Control Cockpit', () => {
  let app;
  let page;
  let userDataDir;

  async function dismissLegacyOverlays() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-mission-'));
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
    await dismissLegacyOverlays();
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  test('opens cockpit and renders core runtime cards', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('mission-control-open-btn').click();
    await expect(page.getByTestId('mission-control')).toBeVisible();
    await expect(page.getByTestId('mission-card-provider-health')).toBeVisible();
    await expect(page.getByTestId('mission-card-watchdog')).toBeVisible();
    await expect(page.getByTestId('mission-control-event-feed')).toBeVisible();

    await page.getByTestId('mission-control-open-nodechain-btn').click();
    await expect(page.getByTestId('nodechain-panel')).toBeVisible();
    await page.getByTestId('nodechain-close-btn').click();
    await page.getByTestId('mission-control-close-btn').click();
    await expect(page.getByTestId('mission-control')).toBeHidden({ timeout: 5000 });
  });
});