const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatLabel(rootPath) {
  const normalized = path.resolve(String(rootPath || ""));
  const base = path.basename(normalized);
  return base || normalized;
}

function detectSignals(rootPath) {
  const signals = [];
  const entries = new Set(fs.readdirSync(rootPath));

  if (entries.has("package.json")) {
    signals.push("package.json");
  }
  if (Array.from(entries).some((name) => /^readme(\.[^.]+)?$/i.test(String(name)))) {
    signals.push("README");
  }
  if (entries.has("docs") && fs.existsSync(path.join(rootPath, "docs")) && fs.statSync(path.join(rootPath, "docs")).isDirectory()) {
    signals.push("docs/");
  }
  if (entries.has("scripts") && fs.existsSync(path.join(rootPath, "scripts")) && fs.statSync(path.join(rootPath, "scripts")).isDirectory()) {
    signals.push("scripts/");
  }
  if (entries.has(".git")) {
    signals.push(".git");
  }

  return signals;
}

function summarizeWorkspace(rootPath, attachedAt) {
  const normalizedRoot = path.resolve(String(rootPath || "").trim());
  assert(normalizedRoot.length > 0, "Workspace path is required.");
  assert(fs.existsSync(normalizedRoot), "Workspace path does not exist.");
  assert(fs.statSync(normalizedRoot).isDirectory(), "Workspace path must be a directory.");

  return {
    rootPath: normalizedRoot,
    label: formatLabel(normalizedRoot),
    signals: detectSignals(normalizedRoot),
    attachedAt: String(attachedAt || new Date().toISOString())
  };
}

module.exports = {
  summarizeWorkspace
};
