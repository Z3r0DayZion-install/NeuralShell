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
  const mainJs = read("src/main.js");

  assert(
    mainJs.includes('mainWindow.loadFile(path.join(__dirname, "..", "dist-renderer", "index.html"))'),
    "main.js must load dist-renderer/index.html in production."
  );
  assert(
    !mainJs.includes("renderer.html"),
    "main.js should not reference legacy renderer.html runtime loading."
  );
  assert(
    mainJs.includes("REACT_RENDERER_DEV_URL"),
    "main.js should gate development renderer URL through REACT_RENDERER_DEV_URL."
  );
  assert(
    !mainJs.includes("document.getElementById('sendBtn')"),
    "smoke probe must not depend on legacy sendBtn DOM."
  );
  assert(
    mainJs.includes('[data-testid="top-status-bar"]') || mainJs.includes("document.getElementById('root')"),
    "smoke probe must validate React renderer DOM."
  );

  console.log("React renderer gate test passed.");
}

run();

