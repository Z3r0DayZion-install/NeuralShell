const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "package.json",
  "src/main.js",
  "src/preload.js",
  "src/renderer.html",
  "src/renderer.js",
  "src/style.css"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function validateRequiredFiles() {
  requiredFiles.forEach((file) => {
    assert(exists(file), `Missing required file: ${file}`);
  });
}

function validateMainWindowTarget() {
  const mainJs = read("src/main.js");
  assert(
    mainJs.includes('loadFile(path.join(__dirname, "renderer.html"))'),
    "main.js does not load src/renderer.html"
  );
}

function validateRendererTargets() {
  const html = read("src/renderer.html");
  const rendererJs = read("src/renderer.js");
  const requiredIds = [
    "modelSelect",
    "refreshModelsBtn",
    "statusLabel",
    "sessionList",
    "runSelfTestBtn",
    "runButtonAuditBtn",
    "sessionSearchInput",
    "sessionSortSelect",
    "sessionName",
    "sessionPass",
    "sessionMetadataOutput",
    "saveSessionBtn",
    "loadSessionBtn",
    "renameSessionBtn",
    "deleteSessionBtn",
    "duplicateSessionBtn",
    "chatHistory",
    "typingIndicator",
    "chatSearchInput",
    "chatSearchBtn",
    "chatSearchClearBtn",
    "newChatBtn",
    "deleteLastExchangeBtn",
    "promptInput",
    "promptMetrics",
    "autoScrollInput",
    "sendBtn",
    "stopBtn",
    "retryBtn",
    "editLastBtn",
    "snippetSelect",
    "insertSnippetBtn",
    "regenerateBtn",
    "exportChatBtn",
    "exportMarkdownBtn",
    "copyMarkdownBtn",
    "copyLastAssistantBtn",
    "shortcutHelpBtn",
    "importChatBtn",
    "importChatFile",
    "refreshCommandsBtn",
    "commandList",
    "baseUrlInput",
    "timeoutInput",
    "retryInput",
    "themeSelect",
    "tokenBudgetInput",
    "autosaveNameInput",
    "autosaveIntervalInput",
    "autosaveEnabledInput",
    "applySettingsBtn",
    "repairIndexBtn",
    "exportStateBtn",
    "importStateBtn",
    "importStateFile",
    "cpuUsage",
    "memoryUsage",
    "tokensUsed",
    "platformInfo",
    "clockTime",
    "statusMeta"
    ,
    "loadLogsBtn",
    "clearLogsBtn",
    "exportLogsBtn",
    "logsOutput",
    "loadChatLogsBtn",
    "clearChatLogsBtn",
    "exportChatLogsBtn",
    "chatLogsOutput"
    ,
    "buttonAuditOutput",
    "shortcutOverlay",
    "shortcutCloseBtn",
    "undoBtn",
    "commandHelpBtn"
  ];

  requiredIds.forEach((id) => {
    assert(html.includes(`id="${id}"`), `renderer.html missing id="${id}"`);
    assert(rendererJs.includes(`"${id}"`) || rendererJs.includes(`'${id}'`), `renderer.js does not reference "${id}"`);
  });
}

function validateScripts() {
  const pkg = JSON.parse(read("package.json"));
  assert(pkg.scripts && pkg.scripts.start, "package.json missing scripts.start");
  assert(pkg.scripts && pkg.scripts.test, "package.json missing scripts.test");
}

function run() {
  validateRequiredFiles();
  validateMainWindowTarget();
  validateRendererTargets();
  validateScripts();
  console.log("Smoke test passed.");
}

run();
