const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('First-Boot Authority Funnel', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.removeItem('neuralshell_onboarding_dismissed_v1');
      globalThis.localStorage.removeItem('neuralshell_first_boot_dismissed_v1');
      globalThis.localStorage.removeItem('neuralshell_first_boot_progress_v1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-firstboot-'));
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

  test('runs and reopens first-boot authority flow', async () => {
    await expect(page.getByTestId('firstboot-progress-rail')).toBeVisible({ timeout: 20000 });
    await page.getByTestId('firstboot-reopen-btn').click();
    await expect(page.getByTestId('firstboot-authority-wizard')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('firstboot-run-welcome_intro').click();
    await expect(page.getByTestId('firstboot-run-welcome_intro')).toContainText('Done', { timeout: 10000 });

    await page.getByTestId('firstboot-close-btn').click();
    await expect(page.getByTestId('firstboot-authority-wizard')).toBeHidden({ timeout: 5000 });

    await page.getByTestId('firstboot-reopen-btn').click();
    await expect(page.getByTestId('firstboot-authority-wizard')).toBeVisible({ timeout: 10000 });
  });
});
