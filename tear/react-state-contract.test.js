const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function ensureCreateSessionOrdering(shellContextSource) {
  const createSessionIndex = shellContextSource.indexOf("const createSession = useCallback");
  assert(createSessionIndex >= 0, "ShellContext missing createSession callback.");

  const refreshIndex = shellContextSource.indexOf("await refreshSessions();", createSessionIndex);
  const workflowIndex = shellContextSource.indexOf("await setWorkflowId(safeName);", createSessionIndex);
  const hydrateIndex = shellContextSource.indexOf("await hydrateSession(safeName, safePassphrase);", createSessionIndex);

  assert(refreshIndex > createSessionIndex, "createSession must refresh sessions.");
  assert(workflowIndex > refreshIndex, "createSession must set workflow after refreshing sessions.");
  assert(hydrateIndex > workflowIndex, "createSession must hydrate after selecting the session.");
}

function run() {
  const hookSource = read("src/renderer/src/hooks/useNeuralState.js");
  const shellContextSource = read("src/renderer/src/state/ShellContext.jsx");

  assert(
    hookSource.includes("useCallback"),
    "useNeuralState must keep setter stable with useCallback."
  );
  assert(
    hookSource.includes("valueRef"),
    "useNeuralState must use valueRef to avoid stale updates."
  );
  assert(
    hookSource.includes("const unsubscribe = window.api.on('state-updated', handleUpdate);"),
    "useNeuralState must capture renderer event unsubscribe."
  );
  assert(
    hookSource.includes("await window.api.state.update({ [key]: finalValue });"),
    "useNeuralState must persist updates through state.update."
  );

  ensureCreateSessionOrdering(shellContextSource);

  assert(
    shellContextSource.includes("const lockSession = useCallback"),
    "ShellContext must expose explicit session locking."
  );
  assert(
    shellContextSource.includes("window.addEventListener('beforeunload', flushOnPageHide);"),
    "ShellContext must flush pending autosave on unload."
  );
  assert(
    shellContextSource.includes("window.addEventListener('blur', lockOnBlur);"),
    "ShellContext must support optional auto-lock on blur."
  );

  console.log("React state contract test passed.");
}

run();

