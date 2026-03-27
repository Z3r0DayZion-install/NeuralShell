const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
const SHOTS = {
  shell: path.join(SCREENSHOT_DIR, 'ui_shell_loaded.png'),
  newFlow: path.join(SCREENSHOT_DIR, 'ui_new_chat_flow.png'),
  restored: path.join(SCREENSHOT_DIR, 'ui_session_restored.png'),
  switched: path.join(SCREENSHOT_DIR, 'ui_session_switch_working.png'),
};

async function waitFor(selector, page, timeout = 15000) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout });
}

async function submitCreateSession(page, name, passphrase) {
  await page.getByTestId('new-thread-btn').click();
  await waitFor('[data-testid="session-modal"]', page);
  await page.getByTestId('session-modal-name-input').fill(name);
  await page.getByTestId('session-modal-pass-input').fill(passphrase);
  await page.getByTestId('session-modal-submit-btn').click();
  await page.waitForTimeout(700);
  const modalStillOpen = await page.getByTestId('session-modal').isVisible().catch(() => false);
  if (modalStillOpen) {
    const maybeError = await page.getByTestId('session-modal-error').textContent().catch(() => '');
    throw new Error(`session modal stayed open after submit (${name}): ${maybeError || 'unknown error'}`);
  }
}

async function sendSlashCommand(page, command) {
  const composer = page.getByTestId('chat-input');
  await composer.fill(command);
  await page.getByRole('button', { name: 'Execute Command' }).click();
  await page.waitForTimeout(1300);
  const rows = await page.locator('[data-testid="chat-message"]').allTextContents();
  console.log('[ui-proof] visible chat rows after slash command:', rows);
}

async function run() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neuralshell-ui-proof-'));
  let app;

  try {
    app = await electron.launch({
      args: ['.'],
      cwd: ROOT,
      env: {
        ...process.env,
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: '1',
      },
    });

    const page = await app.firstWindow();
    await waitFor('[data-testid="top-status-bar"]', page, 20000);
    await page.screenshot({ path: SHOTS.shell, fullPage: true });

    // New-session flow proof shot.
    await page.getByTestId('new-thread-btn').click();
    await waitFor('[data-testid="session-modal"]', page);
    await page.screenshot({ path: SHOTS.newFlow, fullPage: true });
    await page.getByTestId('session-modal-cancel-btn').click();
    await page.waitForTimeout(300);

    // Create Session A and persist unique message.
    await submitCreateSession(page, 'Workflow_ALPHA', 'alpha-pass');
    const sessionsAfterAlpha = await page.evaluate(async () => globalThis.window.api.session.list());
    console.log('[ui-proof] sessions after alpha create:', sessionsAfterAlpha);
    await sendSlashCommand(page, '/guard');
    await page.getByTestId('save-active-session-btn').click();
    await page.waitForTimeout(700);
    const alphaDisk = await page.evaluate(async () => {
      const payload = await globalThis.window.api.session.load('Workflow_ALPHA', 'alpha-pass');
      return Array.isArray(payload && payload.chat) ? payload.chat.map((entry) => String(entry.content || '')) : [];
    });
    console.log('[ui-proof] alpha persisted rows:', alphaDisk.length);

    // Create Session B and persist unique message.
    await submitCreateSession(page, 'Workflow_BETA', 'beta-pass');
    const sessionsAfterBeta = await page.evaluate(async () => globalThis.window.api.session.list());
    console.log('[ui-proof] sessions after beta create:', sessionsAfterBeta);
    await sendSlashCommand(page, '/help');
    await page.getByTestId('save-active-session-btn').click();
    await page.waitForTimeout(700);
    const betaDisk = await page.evaluate(async () => {
      const payload = await globalThis.window.api.session.load('Workflow_BETA', 'beta-pass');
      return Array.isArray(payload && payload.chat) ? payload.chat.map((entry) => String(entry.content || '')) : [];
    });
    console.log('[ui-proof] beta persisted rows:', betaDisk.length);

    // Switch back to A and prove restored history.
    await page.getByTestId('session-item-Workflow_ALPHA').click();
    await page.waitForTimeout(1800);
    const alphaVisible = await page.locator('[data-testid="chat-message"]').allTextContents();
    console.log('[ui-proof] alpha visible rows:', alphaVisible);
    if (!alphaVisible.some((row) => row.includes('Security Guard: ACTIVE'))) {
      throw new Error('Security guard proof content not visible after switching to Workflow_ALPHA');
    }
    await page.screenshot({ path: SHOTS.restored, fullPage: true });

    // Switch to B and prove switched context.
    await page.getByTestId('session-item-Workflow_BETA').click();
    await page.waitForTimeout(1800);
    const betaVisible = await page.locator('[data-testid="chat-message"]').allTextContents();
    console.log('[ui-proof] beta visible rows:', betaVisible);
    if (!betaVisible.some((row) => row.includes('NeuralShell Operator Guide'))) {
      throw new Error('Help guide proof content not visible after switching to Workflow_BETA');
    }
    await page.screenshot({ path: SHOTS.switched, fullPage: true });

    console.log('[ui-proof] screenshots ready');
    for (const shot of Object.values(SHOTS)) {
      console.log(shot);
    }
  } finally {
    if (app) {
      await app.close();
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup failures
    }
  }
}

run().catch((err) => {
  console.error('[ui-proof] failed:', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
