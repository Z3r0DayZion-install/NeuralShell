const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testMainBuiltInCommandWiring() {
  const mainJs = read("src/main.js");
  assert(mainJs.includes("const BUILT_IN_COMMANDS = ["), "main.js missing BUILT_IN_COMMANDS list.");
  assert(mainJs.includes("async function runBuiltInCommand("), "main.js missing runBuiltInCommand handler.");
  assert(
    mainJs.includes("const builtInResult = await runBuiltInCommand(name, args);"),
    "main.js command:run does not call runBuiltInCommand."
  );
  assert(
    mainJs.includes("if (builtInResult !== null)"),
    "main.js command:run does not short-circuit on built-in command results."
  );
  assert(
    mainJs.indexOf("await identityKernel.init();") < mainJs.indexOf("stateManager.load();"),
    "main.js must initialize identityKernel before loading state."
  );
  assert(
    mainJs.includes("const result = identityKernel.rotate();") &&
      mainJs.includes("stateManager.save();"),
    "main.js identity rotation must persist state after rotating the keypair."
  );
}

function testReactRendererSessionModelLinkage() {
  const appJsx = read("src/renderer/src/App.jsx");
  const shellContextJsx = read("src/renderer/src/state/ShellContext.jsx");
  const threadRailJsx = read("src/renderer/src/components/ThreadRail.jsx");
  const workspacePanelJsx = read("src/renderer/src/components/WorkspacePanel.jsx");

  assert(
    appJsx.includes("const handleSessionSelect") &&
      appJsx.includes("isSessionUnlocked") &&
      appJsx.includes("openUnlockDialog"),
    "App session selection flow must route locked sessions through unlock dialog."
  );
  assert(
    appJsx.includes("const handleSaveActiveSession") &&
      appJsx.includes("saveActiveSession('manual')"),
    "App must wire manual save action to ShellContext saveActiveSession."
  );
  assert(
    appJsx.includes("const handleLockActiveSession") &&
      appJsx.includes("lockSession(workflowId)"),
    "App must wire explicit lock action for active session."
  );
  assert(
    appJsx.includes('role="dialog"') &&
      appJsx.includes("aria-modal=\"true\"") &&
      appJsx.includes("sessionDialogTitleId"),
    "Session modal must keep dialog accessibility semantics wired."
  );

  assert(
    shellContextJsx.includes("const createSession = useCallback") &&
      shellContextJsx.includes("await refreshSessions();") &&
      shellContextJsx.includes("await setWorkflowId(safeName);") &&
      shellContextJsx.includes("await hydrateSession(safeName, safePassphrase);"),
    "ShellContext createSession flow must refresh index then select and hydrate new session."
  );
  assert(
    shellContextJsx.includes("const lockSession = useCallback") &&
      shellContextJsx.includes("setSessionHydrationStatus('locked')"),
    "ShellContext must expose explicit session locking behavior."
  );
  assert(
    shellContextJsx.includes("window.addEventListener('beforeunload', flushOnPageHide);") &&
      shellContextJsx.includes("window.addEventListener('blur', lockOnBlur);"),
    "ShellContext must flush autosave on unload and support optional blur auto-lock."
  );

  assert(
    threadRailJsx.includes("save-active-session-btn") &&
      threadRailJsx.includes("retry-save-session-btn") &&
      threadRailJsx.includes("lock-active-session-btn"),
    "Thread rail must expose save/retry/lock controls."
  );
  assert(
    workspacePanelJsx.includes('data-testid="chat-message"') &&
      workspacePanelJsx.includes('data-testid="chat-input"'),
    "Workspace panel must keep message/input testing surface."
  );
}

function testSystemStatsContract() {
  const monitorJs = read("src/core/systemMonitor.js");
  assert(monitorJs.includes("cpuPercent"), "systemMonitor.js missing cpuPercent field.");
  assert(monitorJs.includes("memoryMb"), "systemMonitor.js missing memoryMb field.");
  assert(monitorJs.includes("tokensUsed"), "systemMonitor.js missing tokensUsed field.");
}

function run() {
  testMainBuiltInCommandWiring();
  testReactRendererSessionModelLinkage();
  testSystemStatsContract();
  console.log("Linkage regression test passed.");
}

run();

