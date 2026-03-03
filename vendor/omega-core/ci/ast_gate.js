const fs = require("fs");
const path = require("path");

const FORBIDDEN_PATTERNS = [
  /require\(["']child_process["']\)/,
  /eval\(/,
  /new Function\(/,
  /process\.env\./
];

function walk(dirPath) {
  const out = [];
  if (!fs.existsSync(dirPath)) return out;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(fullPath));
    } else if (entry.isFile() && /\.(cjs|mjs|js|ts|jsx|tsx)$/i.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function runAstGate(options = {}) {
  const sourceRoot = options.sourceRoot ? path.resolve(options.sourceRoot) : process.cwd();
  const logger = typeof options.logger === "function" ? options.logger : () => {};
  const files = walk(sourceRoot);
  let ok = true;

  for (const filePath of files) {
    const rel = path.relative(sourceRoot, filePath).split(path.sep).join("/");
    const src = fs.readFileSync(filePath, "utf8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(src)) {
        ok = false;
        logger(`AST gate violation in ${rel}: pattern ${pattern} matched.`);
      }
    }
  }

  return ok;
}

module.exports = {
  runAstGate
};
