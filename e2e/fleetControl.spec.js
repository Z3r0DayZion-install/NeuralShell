const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Fleet Control Panel', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
      globalThis.localStorage.removeItem('neuralshell_fleet_nodes_v1');
      globalThis.localStorage.removeItem('neuralshell_fleet_selected_v1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-fleet-'));
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

  test('opens fleet panel and imports local runtime node', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('fleet-control-open-btn').click();
    await expect(page.getByTestId('fleet-control-panel')).toBeVisible();

    await page.getByTestId('fleet-import-runtime-btn').click();
    await expect(page.getByTestId('fleet-import-info')).toContainText('Imported local runtime node', { timeout: 10000 });

    await expect(page.getByTestId('fleet-node-list')).toContainText('Local Runtime');
    await page.getByTestId('fleet-close-btn').click();
    await expect(page.getByTestId('fleet-control-panel')).toBeHidden({ timeout: 5000 });
  });
});