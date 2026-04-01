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

function validateReactEntryTargets() {
  const distHtml = read("dist-renderer/index.html");
  const rendererMain = read("src/renderer/src/main.jsx");
  assert(
    distHtml.includes('id="root"'),
    "dist-renderer/index.html missing React root node."
  );
  assert(
    distHtml.includes('<script type="module"'),
    "dist-renderer/index.html missing module script entry."
  );
  assert(
    rendererMain.includes("createRoot(document.getElementById('root'))") ||
      rendererMain.includes('createRoot(document.getElementById("root"))'),
    "src/renderer/src/main.jsx does not mount React at #root."
  );
  assert(
    rendererMain.includes("<ShellProvider>") && rendererMain.includes("<App />"),
    "src/renderer/src/main.jsx must compose ShellProvider + App."
  );
}

function validateScripts() {
  const pkg = JSON.parse(read("package.json"));
  assert(pkg.scripts && pkg.scripts.start, "package.json missing scripts.start");
  assert(pkg.scripts && pkg.scripts.test, "package.json missing scripts.test");
}

function run() {
  validateRequiredFiles();
  validateMainWindowTarget();
  validateReactEntryTargets();
  validateScripts();
  console.log("Smoke test passed (React Architecture).");
}

run();
