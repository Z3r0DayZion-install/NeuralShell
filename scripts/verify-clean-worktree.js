const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const allowlistFile = path.join(root, ".release-local-drift");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toPosix(relPath) {
  return relPath.replace(/\\/g, "/");
}

function parseStatusLine(line) {
  const raw = String(line || "");
  if (raw.length < 4) {
    return null;
  }
  const code = raw.slice(0, 2);
  let filePath = raw.slice(3).trim();

  // Handle rename format: old/path -> new/path
  const renameParts = filePath.split(" -> ");
  if (renameParts.length === 2) {
    filePath = renameParts[1].trim();
  }

  // Unquote porcelain path if quoted.
  if (filePath.startsWith('"') && filePath.endsWith('"')) {
    filePath = filePath.slice(1, -1);
  }

  return {
    code,
    path: toPosix(filePath)
  };
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  const normalized = toPosix(String(pattern || "").trim());
  let src = "^";

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    const next = normalized[i + 1];
    const next2 = normalized[i + 2];

    if (ch === "*") {
      if (next === "*" && next2 === "/") {
        src += "(?:.*/)?";
        i += 2;
      } else if (next === "*") {
        src += ".*";
        i += 1;
      } else {
        src += "[^/]*";
      }
      continue;
    }

    if (ch === "?") {
      src += "[^/]";
      continue;
    }

    src += escapeRegExp(ch);
  }

  src += "$";
  return new RegExp(src);
}

function loadAllowPatterns(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function isAllowed(filePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(filePath));
}

function listDirtyEntries() {
  const stdout = execSync("git status --porcelain=v1 --untracked-files=all", {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  })
    .toString("utf8")
    .trim();

  if (!stdout) {
    return [];
  }

  return stdout
    .split(/\r?\n/)
    .map((line) => parseStatusLine(line))
    .filter((entry) => entry && entry.path);
}

function main() {
  const strict = process.argv.includes("--strict");
  const patterns = strict ? [] : loadAllowPatterns(allowlistFile);
  const dirty = listDirtyEntries();

  if (dirty.length === 0) {
    console.log("Worktree is clean.");
    return;
  }

  const ignored = [];
  const blocking = [];
  for (const entry of dirty) {
    if (!strict && isAllowed(entry.path, patterns)) {
      ignored.push(entry);
    } else {
      blocking.push(entry);
    }
  }

  if (ignored.length > 0) {
    console.log(`[worktree] Ignoring ${ignored.length} local artifact drift entries from ${path.basename(allowlistFile)}.`);
  }

  if (blocking.length > 0) {
    const lines = blocking.map((entry) => `${entry.code} ${entry.path}`);
    throw new Error(
      `Release gate requires a clean worktree. Blocking changes:\n${lines.join("\n")}\n\n` +
      "Commit, stash, or remove these changes before shipping."
    );
  }

  assert(strict || patterns.length > 0, "No allowlist patterns loaded for non-strict mode.");
  console.log(strict ? "Strict worktree cleanliness check passed." : "Worktree cleanliness check passed (allowlist mode).");
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = {
  globToRegExp,
  isAllowed,
  listDirtyEntries,
  loadAllowPatterns,
  parseStatusLine
};
