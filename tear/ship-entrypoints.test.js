const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireScript(filePath, requiredCommands) {
  assert(fs.existsSync(filePath), `Missing script file: ${filePath}`);
  const src = fs.readFileSync(filePath, "utf8");
  for (const cmd of requiredCommands) {
    assert(src.includes(cmd), `Script ${path.basename(filePath)} missing command: ${cmd}`);
  }
}

function run() {
  requireScript(path.join(root, "scripts", "ship.js"), [
    "npm run verify:ship"
  ]);

  requireScript(path.join(root, "scripts", "ship-strict.js"), [
    "npm run verify:ship"
  ]);

  console.log("Ship entrypoint test passed.");
}

run();
