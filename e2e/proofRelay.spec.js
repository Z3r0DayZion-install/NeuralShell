const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function runProofBundle(env) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [path.join('scripts', 'proof_bundle.cjs')], {
      cwd: ROOT,
      env: {
        ...process.env,
        ...env
      }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      resolve({
        status: Number(code || 0),
        stdout,
        stderr
      });
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test.describe('NeuralShell Proof Relay', () => {
  test.describe.configure({ mode: 'serial' });

  let app;
  let page;
  let userDataDir;
  let relayConfigPath;
  let server;
  let webhookUrl;
  let requests = [];

  test.beforeAll(async () => {
    await new Promise((resolve) => {
      server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body || '{}');
          } catch {
            parsed = null;
          }
          requests.push({
            method: req.method,
            url: req.url,
            body,
            parsed
          });
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end('{"ok":true}');
        });
      });
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        webhookUrl = `http://127.0.0.1:${addr.port}/relay`;
        resolve();
      });
    });

    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-e2e-relay-'));
    relayConfigPath = path.join(userDataDir, 'proof-relay-settings.json');

    app = await electron.launch({
      args: ['.'],
      cwd: ROOT,
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_PROOF_RELAY_CONFIG: relayConfigPath,
        NEURAL_IGNORE_INTEGRITY: '1'
      }
    });
    page = await app.firstWindow();
    await expect(page.getByTestId('top-status-bar')).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (app) await app.close();
    await new Promise((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });

    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  test('posts proof bundle metadata when enabled and stays silent when disabled', async () => {
    const enabledConfig = await page.evaluate(async () => {
      return globalThis.window.api.proofRelay.setConfig({ enabled: true, channel: 'auto' });
    });
    expect(Boolean(enabledConfig && enabledConfig.enabled)).toBeTruthy();

    requests = [];
    const enabledRun = await runProofBundle({
      SLACK_WEBHOOK: webhookUrl,
      NEURAL_PROOF_RELAY_CONFIG: relayConfigPath
    });
    expect(enabledRun.status).toBe(0);

    await wait(350);
    expect(requests.length).toBeGreaterThan(0);

    const slackPayload = requests.find((entry) => entry.parsed && typeof entry.parsed.text === 'string');
    expect(Boolean(slackPayload)).toBeTruthy();
    expect(slackPayload.parsed.text.includes('repo=')).toBeTruthy();
    expect(slackPayload.parsed.text.includes('sha=')).toBeTruthy();
    expect(slackPayload.parsed.text.includes('manifest=')).toBeTruthy();

    const disabledConfig = await page.evaluate(async () => {
      return globalThis.window.api.proofRelay.setConfig({ enabled: false, channel: 'auto' });
    });
    expect(Boolean(disabledConfig && disabledConfig.enabled)).toBeFalsy();

    requests = [];
    const disabledRun = await runProofBundle({
      SLACK_WEBHOOK: webhookUrl,
      NEURAL_PROOF_RELAY_CONFIG: relayConfigPath
    });
    expect(disabledRun.status).toBe(0);

    await wait(350);
    expect(requests.length).toBe(0);
  });
});