const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('Air-Gapped Operations', () => {
  let app;
  let page;
  let userDataDir;
  let invalidArtifactPath;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
      globalThis.localStorage.removeItem('neuralshell_airgap_mode_v1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-airgap-'));
    invalidArtifactPath = path.join(userDataDir, 'invalid_airgap_artifact.json');
    fs.writeFileSync(invalidArtifactPath, JSON.stringify({
      payload: {
        schema: 'neuralshell_offline_update_pack_v1',
        version: '9.9.9',
      },
      hash: 'deadbeef',
      signature: 'ZmFrZQ==',
      signer: {
        publicKeyPem: '-----BEGIN PUBLIC KEY-----\nZmFrZQ==\n-----END PUBLIC KEY-----',
      },
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

  test('quarantines invalid imports and toggles lock posture', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-airgap-btn').click();
    await expect(page.getByTestId('airgap-operations-center')).toBeVisible();

    await page.getByTestId('airgap-import-input').setInputFiles(invalidArtifactPath);
    await expect(page.getByTestId('airgap-import-error')).toContainText('quarantined', { timeout: 10000 });

    await page.getByTestId('airgap-lock-toggle-btn').click();
    await expect(page.getByTestId('airgap-lock-toggle-btn')).toContainText('AirGap Locked', { timeout: 10000 });
  });
});
