const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Offline Update Packs', () => {
  let app;
  let page;
  let userDataDir;
  let invalidPackPath;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-updates-'));
    invalidPackPath = path.join(userDataDir, 'invalid_update_pack.json');
    fs.writeFileSync(invalidPackPath, JSON.stringify({
      payload: { version: '9.9.9', ring: 'canary' },
      signature: 'ZmFrZQ==',
      signer: { publicKeyPem: '-----BEGIN PUBLIC KEY-----\nZmFrZQ==\n-----END PUBLIC KEY-----' },
    }, null, 2));

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

  test('rejects unverified update pack import', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-offline-updates-btn').click();

    await expect(page.getByTestId('offline-update-console')).toBeVisible();
    await page.getByTestId('update-pack-import-input').setInputFiles(invalidPackPath);
    await expect(page.getByTestId('update-pack-error')).toContainText('rejected', { timeout: 10000 });
  });
});