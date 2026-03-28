const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Offline Evidence Courier', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_courier_transfer_ledger_v1', JSON.stringify([{
        entryId: 'ledger-test',
        packageId: 'courier-test-1',
        courierClass: 'sealed',
        sender: 'Station-A',
        receiver: 'Station-B',
        status: 'quarantined',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        handoffs: [],
      }]));
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-courier-'));
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

  test('blocks release until receipt verification then allows release', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-courier-transfer-btn').click();
    await expect(page.getByTestId('courier-transfer-center')).toBeVisible();

    await page.getByTestId('courier-release-ledger-test').click();
    await expect(page.getByTestId('courier-error')).toContainText('Release blocked', { timeout: 10000 });

    await page.getByTestId('courier-verify-ledger-test').click();
    await page.getByTestId('courier-release-ledger-test').click();
    await expect(page.getByTestId('courier-transfer-center')).toContainText('Released package', { timeout: 10000 });
  });
});
