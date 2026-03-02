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

function collectWithRegex(source, regex) {
  const values = new Set();
  let match;
  while ((match = regex.exec(source)) !== null) {
    values.add(match[1]);
  }
  return values;
}

function sorted(values) {
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

function diff(left, right) {
  return sorted(new Set([...left].filter((value) => !right.has(value))));
}

function run() {
  const html = read("src/renderer.html");
  const renderer = read("src/renderer.js");

  const htmlIds = collectWithRegex(html, /id="([^"]+)"/g);
  const queriedIds = collectWithRegex(renderer, /getElementById\("([^"]+)"\)/g);

  const missingInHtml = diff(queriedIds, htmlIds);
  assert(
    missingInHtml.length === 0,
    `renderer.js queries id(s) that do not exist in renderer.html: ${missingInHtml.join(", ")}`
  );

  const requiredUiSymbols = ["showBanner(", "renderChat(", "sendPrompt(", "refreshSessions(", "refreshModels("];
  requiredUiSymbols.forEach((symbol) => {
    assert(renderer.includes(symbol), `renderer.js missing required symbol: ${symbol}`);
  });

  assert(
    html.includes('<script src="renderer.js"></script>'),
    "renderer.html does not load renderer.js"
  );

  console.log("Renderer bindings test passed.");
}

run();
