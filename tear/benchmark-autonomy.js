const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function has(text, needle) {
  return text.includes(needle);
}

function scoreCheck(label, ok, points) {
  return { label, ok: Boolean(ok), points: ok ? points : 0, max: points };
}

function run() {
  const main = read("src/main.js");
  const preload = read("src/preload.js");
  const validators = read("src/core/ipcValidators.js");
  const rgb = read("src/core/rgbController.js");
  const policy = read("src/core/policyFirewall.js");
  const audit = read("src/core/auditChain.js");
  const rendererMain = read("src/renderer/src/main.jsx");
  const app = read("src/renderer/src/App.jsx");
  const shellContext = read("src/renderer/src/state/ShellContext.jsx");
  const threadRail = read("src/renderer/src/components/ThreadRail.jsx");
  const workspacePanel = read("src/renderer/src/components/WorkspacePanel.jsx");
  const storeScreenshots = read("scripts/capture_store_screenshots.js");

  const checks = [
    scoreCheck(
      "runtime.react_entrypoint",
      has(main, "dist-renderer") && has(main, "index.html") && !has(main, "renderer.html"),
      10
    ),
    scoreCheck(
      "runtime.react_mount",
      has(rendererMain, "createRoot(document.getElementById('root'))")
        || has(rendererMain, 'createRoot(document.getElementById("root"))'),
      8
    ),
    scoreCheck(
      "runtime.react_shell_provider",
      has(rendererMain, "<ShellProvider>") && has(rendererMain, "<App />"),
      8
    ),
    scoreCheck(
      "session.modal_flows",
      has(app, "openCreateDialog")
        && has(app, "openUnlockDialog")
        && has(app, 'data-testid="session-modal"'),
      10
    ),
    scoreCheck(
      "session.lock_banner",
      has(app, 'data-testid="session-lock-banner"')
        && has(app, "sessionHydrationStatus === 'locked'"),
      6
    ),
    scoreCheck(
      "session.rail_controls",
      has(threadRail, "save-active-session-btn")
        && has(threadRail, "lock-active-session-btn")
        && has(threadRail, "retry-save-session-btn")
        && has(threadRail, "session-autolock-toggle"),
      10
    ),
    scoreCheck(
      "session.persistence_contract",
      has(shellContext, "createSession")
        && has(shellContext, "unlockSession")
        && has(shellContext, "lockSession")
        && has(shellContext, "saveActiveSession"),
      10
    ),
    scoreCheck(
      "autosave.debounce_dedupe",
      has(shellContext, "AUTOSAVE_DEBOUNCE_MS")
        && has(shellContext, "lastSavedDigestRef")
        && has(shellContext, "setTimeout(() =>")
        && has(shellContext, "saveActiveSession('autosave')"),
      10
    ),
    scoreCheck(
      "autosave.flush_guards",
      has(shellContext, "beforeunload")
        && has(shellContext, "pagehide")
        && has(shellContext, "visibilitychange")
        && has(shellContext, "flushPendingAutosave"),
      8
    ),
    scoreCheck(
      "workspace.command_surface",
      has(workspacePanel, 'data-testid="chat-input"')
        && has(workspacePanel, 'data-testid="chat-message"')
        && has(app, "executeSignal"),
      8
    ),
    scoreCheck(
      "store.capture.react_surface",
      has(storeScreenshots, "top-status-bar")
        && has(storeScreenshots, "command-palette")
        && has(storeScreenshots, "session-modal")
        && !has(storeScreenshots, "#onboardingOverlay"),
      6
    ),
    scoreCheck("rgb.controller", has(rgb, "applyMood(") && has(rgb, "sendOpenRgbColor("), 10),
    scoreCheck("rgb.main_ipc", has(main, "rgb:status") && has(main, "rgb:applyMood"), 10),
    scoreCheck("rgb.preload_surface", has(preload, "rgb:status") && has(preload, "rgb:applyMood"), 8),
    scoreCheck("validator.safety", has(validators, "safetyPolicy"), 4),
    scoreCheck("validator.rgb_targets", has(validators, "rgbTargets"), 8),
    scoreCheck("validator.safety_policy", has(validators, "safetyPolicy"), 4),
    scoreCheck("validator.allow_remote_bridge", has(validators, "allowRemoteBridge"), 8),
    scoreCheck("main.allow_remote_bridge", has(main, "allowRemoteBridge"), 8),
    scoreCheck("policy.firewall", has(policy, "enforcePolicyOnMessages") && has(policy, "evaluateText"), 10),
    scoreCheck("audit.chain", has(audit, "class AuditChain") && has(main, "audit:verify"), 10),
    scoreCheck("release.gate.hardening", fs.existsSync(path.join(root, "tear", "release-gate.js")), 8)
  ];

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const max = checks.reduce((sum, c) => sum + c.max, 0);
  const pct = Math.round((score / Math.max(1, max)) * 100);
  const verdict = pct >= 90 ? "elite" : pct >= 75 ? "strong" : pct >= 60 ? "good" : "needs_work";

  const report = {
    generatedAt: new Date().toISOString(),
    score,
    max,
    percent: pct,
    verdict,
    checks
  };

  const outFile = path.join(root, "release", "autonomy-benchmark.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Autonomy benchmark: ${score}/${max} (${pct}%) -> ${verdict}`);
  console.log(`Report: ${outFile}`);
}

try {
  run();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
