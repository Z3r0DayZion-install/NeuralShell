const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "package.json",
  "src/main.js",
  "src/preload.js",
  "dist-renderer/index.html"
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
    mainJs.includes('mainWindow.loadFile(path.join(__dirname, "..", "dist-renderer", "index.html"))'),
    "main.js does not load dist-renderer/index.html"
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
  // Legacy DOM ID checks are skipped for the componentized React renderer
  validateScripts();
  console.log("Smoke test passed (React Architecture).");
}

run();
