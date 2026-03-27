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

function run() {
  const distHtml = read("dist-renderer/index.html");
  const rendererMain = read("src/renderer/src/main.jsx");
  const app = read("src/renderer/src/App.jsx");
  const topBar = read("src/renderer/src/components/TopStatusBar.jsx");
  const threadRail = read("src/renderer/src/components/ThreadRail.jsx");
  const workspacePanel = read("src/renderer/src/components/WorkspacePanel.jsx");
  const workbenchRail = read("src/renderer/src/components/WorkbenchRail.jsx");

  assert(
    distHtml.includes('id="root"'),
    "dist-renderer/index.html missing React root mount node."
  );
  assert(
    distHtml.includes('<script type="module"'),
    "dist-renderer/index.html missing module script entry."
  );
  assert(
    rendererMain.includes("createRoot(document.getElementById('root'))") ||
      rendererMain.includes('createRoot(document.getElementById("root"))'),
    "renderer main entry does not mount to #root."
  );
  assert(
    rendererMain.includes("<ShellProvider>") && rendererMain.includes("<App />"),
    "renderer main entry must compose ShellProvider and App."
  );

  const requiredShellTestIds = [
    "top-status-bar",
    "thread-rail",
    "workspace-panel",
    "workbench-rail",
    "session-modal",
    "session-lock-banner"
  ];
  requiredShellTestIds.forEach((id) => {
    assert(
      app.includes(`data-testid="${id}"`) ||
        topBar.includes(`data-testid="${id}"`) ||
        threadRail.includes(`data-testid="${id}"`) ||
        workbenchRail.includes(`data-testid="${id}"`) ||
        workspacePanel.includes(`data-testid="${id}"`),
      `React renderer shell missing data-testid="${id}".`
    );
  });

  assert(
    threadRail.includes("save-active-session-btn"),
    "Thread rail must expose save control."
  );
  assert(
    threadRail.includes("lock-active-session-btn"),
    "Thread rail must expose explicit lock control."
  );
  assert(
    workspacePanel.includes('data-testid="chat-message"') &&
      workspacePanel.includes('data-testid="chat-input"'),
    "Workspace panel must expose chat message and input test surfaces."
  );

  console.log("Renderer bindings test passed.");
}

run();
