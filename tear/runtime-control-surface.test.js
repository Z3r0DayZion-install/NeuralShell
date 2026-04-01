/**
 * Runtime control surface contract (React renderer path).
 *
 * This verifies that the live React architecture retains the core
 * operator controls for session persistence, locking, autosave, and
 * command execution.
 */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function has(text, snippet) {
  return text.includes(snippet);
}

test("React app exposes session and command control surfaces", () => {
  const app = read("src/renderer/src/App.jsx");
  const threadRail = read("src/renderer/src/components/ThreadRail.jsx");
  const workspacePanel = read("src/renderer/src/components/WorkspacePanel.jsx");

  assert.ok(
    has(app, "handleSessionDialogSubmit")
      && has(app, "handleSaveActiveSession")
      && has(app, "handleLockActiveSession")
      && has(app, "handleRetrySave"),
    "App.jsx is missing expected session control handlers."
  );
  assert.ok(
    has(app, 'data-testid="session-modal"')
      && has(app, 'data-testid="session-lock-banner"'),
    "App.jsx is missing session modal/lock test surfaces."
  );
  assert.ok(
    has(threadRail, "save-active-session-btn")
      && has(threadRail, "lock-active-session-btn")
      && has(threadRail, "retry-save-session-btn")
      && has(threadRail, "session-autolock-toggle"),
    "Thread rail is missing required persistence controls."
  );
  assert.ok(
    has(workspacePanel, 'data-testid="chat-input"')
      && has(workspacePanel, 'data-testid="chat-message"')
      && has(app, "executeSignal"),
    "Command execution surface is missing chat input/message wiring."
  );
});

test("ShellContext keeps autosave and lock guardrails wired", () => {
  const shellContext = read("src/renderer/src/state/ShellContext.jsx");

  assert.ok(
    has(shellContext, "AUTOSAVE_DEBOUNCE_MS")
      && has(shellContext, "saveActiveSession('autosave')")
      && has(shellContext, "lastSavedDigestRef")
      && has(shellContext, "flushPendingAutosave"),
    "ShellContext autosave debounce/dedupe/flush safeguards are incomplete."
  );
  assert.ok(
    has(shellContext, "beforeunload")
      && has(shellContext, "pagehide")
      && has(shellContext, "visibilitychange"),
    "ShellContext is missing unload/visibility autosave flush hooks."
  );
  assert.ok(
    has(shellContext, "lockSession")
      && has(shellContext, "sessionHydrationStatus")
      && has(shellContext, "autoLockOnBlur"),
    "ShellContext lock-state or auto-lock controls are missing."
  );
});

test("Smoke and release gates target the React renderer path", () => {
  const main = read("src/main.js");
  const smokePackaged = read("tear/smoke-packaged.js");
  const releaseGate = read("tear/release-gate.js");

  assert.ok(
    has(main, "dist-renderer")
      && has(main, "runSmokeProbe")
      && !has(main, "loadFile(path.join(__dirname, \"renderer.html\""),
    "Main process should be wired to React renderer + smoke probe path."
  );
  assert.ok(
    has(main, "--portable-mode")
      && has(main, "NEURAL_PORTABLE_MODE")
      && has(main, "portable-data"),
    "Main process is missing portable-mode userData routing controls."
  );
  assert.ok(
    has(smokePackaged, "NEURAL_IGNORE_INTEGRITY")
      && has(smokePackaged, "NEURAL_SMOKE_REPORT")
      && has(smokePackaged, "rendererDom"),
    "Packaged smoke contract is missing required smoke environment/report checks."
  );
  assert.ok(
    has(releaseGate, "node tear/smoke-packaged.js")
      && has(releaseGate, "node tear/smoke-native-trust.js")
      && has(releaseGate, "verifyOfflineFirstGuardrails"),
    "Release gate is missing packaged smoke/native trust/react guardrail wiring."
  );
});
