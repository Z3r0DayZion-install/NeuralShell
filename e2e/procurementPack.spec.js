const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Procurement Command Center', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
      globalThis.localStorage.removeItem('neuralshell_procurement_pack_history_v1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-procurement-'));
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

  test('generates buyer-ready review pack snapshot', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-procurement-command-btn').click();
    await expect(page.getByTestId('procurement-command-center')).toBeVisible();

    await page.getByTestId('procurement-organization-input').fill('Acme Critical Infrastructure');
    await page.getByTestId('procurement-generate-btn').click();
    await expect(page.getByTestId('procurement-command-center')).toContainText('Generated procurement/security review pack', { timeout: 10000 });
  });
});
