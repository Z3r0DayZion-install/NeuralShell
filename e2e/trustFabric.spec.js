const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

test.describe('PKI Trust Fabric', () => {
  let app;
  let page;
  let userDataDir;

  async function prepState() {
    await page.evaluate(() => {
      globalThis.localStorage.setItem('neuralshell_onboarding_dismissed_v1', '1');
      globalThis.localStorage.setItem('neuralshell_first_boot_dismissed_v1', '1');
      globalThis.localStorage.removeItem('neuralshell_pki_local_ca_v1');
      globalThis.localStorage.removeItem('neuralshell_pki_certificates_v1');
      globalThis.localStorage.removeItem('neuralshell_pki_revocations_v1');
    });
    await page.reload();
  }

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-trustfabric-'));
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

  test('issues and revokes local certificates', async () => {
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mission-control-open-btn').click();
    await page.getByTestId('mission-control-open-trust-fabric-btn').click();
    await expect(page.getByTestId('trust-fabric-console')).toBeVisible();

    await page.getByTestId('trustfabric-init-ca-btn').click();
    await page.getByTestId('trustfabric-subject-name-input').fill('Node Bravo');
    await page.getByTestId('trustfabric-subject-id-input').fill('node-bravo');
    await page.getByTestId('trustfabric-issue-cert-btn').click();

    await expect(page.getByTestId('trustchain-list')).toContainText('Node Bravo', { timeout: 10000 });

    const revokeButtons = page.locator('[data-testid^="trustfabric-revoke-"]');
    await expect(revokeButtons.first()).toBeVisible();
    await revokeButtons.first().click();
    await expect(page.getByTestId('trustchain-list')).toContainText('revoked=yes', { timeout: 10000 });
  });
});
