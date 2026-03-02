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
}

function testRendererStateAndModelLinkage() {
  const rendererJs = read("src/renderer.js");
  assert(rendererJs.includes("async function persistChatState()"), "renderer.js missing persistChatState helper.");
  assert(
    rendererJs.includes("await api.llm.setModel(state.selectedModel);"),
    "renderer.js session load does not apply model to backend."
  );
  assert(
    rendererJs.includes("await api.state.set(\"model\", state.selectedModel);"),
    "renderer.js session load does not persist model state."
  );
  assert(
    rendererJs.includes("showBanner(`State import failed: ${err.message}`, \"bad\");"),
    "renderer.js missing state import failure banner."
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
  testRendererStateAndModelLinkage();
  testSystemStatsContract();
  console.log("Linkage regression test passed.");
}

run();
