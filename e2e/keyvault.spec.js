const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const API_KEY = 'sk-e2e-vault-never-plaintext-123456';
const PASSPHRASE = 'vault-e2e-passphrase';

test.describe('NeuralShell Vault+', () => {
  test.describe.configure({ mode: 'serial' });

  let app;
  let page;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-vault-'));
    app = await electron.launch({
      args: ['.'],
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: '1'
      }
    });
    page = await app.firstWindow();
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (app) await app.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  test('stores provider key encrypted and supports export/import roundtrip', async () => {
    await page.getByTestId('settings-open-btn').click();
    await expect(page.getByTestId('settings-drawer')).toBeVisible();

    const vaultRoundtrip = await page.evaluate(async ({ apiKey, passphrase }) => {
      const current = await globalThis.window.api.settings.get();
      const settings = await globalThis.window.api.settings.update({
        ...current,
        allowRemoteBridge: true,
        provider: 'openai',
        apiKey
      });
      const activeProfileId = String(settings.activeProfileId || '');
      const before = await globalThis.window.api.vault.hasSecret(activeProfileId, 'apiKey');
      const exported = await globalThis.window.api.vault.export(passphrase);
      await globalThis.window.api.vault.deleteSecret(activeProfileId, 'apiKey');
      const afterDelete = await globalThis.window.api.vault.hasSecret(activeProfileId, 'apiKey');
      const imported = await globalThis.window.api.vault.import(exported.blob, passphrase, { mode: 'merge' });
      const afterImport = await globalThis.window.api.vault.hasSecret(activeProfileId, 'apiKey');
      return {
        activeProfileId,
        before,
        exported,
        afterDelete,
        imported,
        afterImport,
        apiKey
      };
    }, { apiKey: API_KEY, passphrase: PASSPHRASE });

    expect(vaultRoundtrip.activeProfileId.length).toBeGreaterThan(0);
    expect(vaultRoundtrip.before.present).toBeTruthy();
    expect(vaultRoundtrip.exported.ok).toBeTruthy();
    expect(vaultRoundtrip.exported.format).toBe('vault-export+json');
    expect(typeof vaultRoundtrip.exported.blob.ciphertext).toBe('string');
    expect(vaultRoundtrip.exported.blob.ciphertext).not.toContain(API_KEY);
    expect(vaultRoundtrip.afterDelete.present).toBeFalsy();
    expect(vaultRoundtrip.imported.ok).toBeTruthy();
    expect(vaultRoundtrip.afterImport.present).toBeTruthy();

    const statePath = path.join(userDataDir, 'state', 'state.omega');
    if (fs.existsSync(statePath)) {
      const stateText = fs.readFileSync(statePath, 'utf8');
      expect(stateText.includes(API_KEY)).toBeFalsy();
    }

    const fallbackVaultPath = path.join(userDataDir, 'vault', 'vault-plus.json');
    if (fs.existsSync(fallbackVaultPath)) {
      const vaultText = fs.readFileSync(fallbackVaultPath, 'utf8');
      expect(vaultText.includes(API_KEY)).toBeFalsy();
    }

    await page.getByTestId('settings-close-btn').click();
    await expect(page.getByTestId('settings-drawer')).toBeHidden({ timeout: 10000 });
  });
});