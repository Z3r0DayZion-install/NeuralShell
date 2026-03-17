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

function listEntriesSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

const CONTEXT_PACK_SUGGESTION_LIMIT = 6;

const WORKFLOW_SUGGESTION_BONUSES = {
  release_audit: [
    [/^changelog(\.[^.]+)?$/i, 42],
    [/^package\.json$/i, 36],
    [/^docs\/release/i, 34],
    [/^docs\//i, 18],
    [/^scripts\//i, 24],
    [/^README(\.[^.]+)?$/i, 14]
  ],
  bug_triage: [
    [/^package\.json$/i, 26],
    [/^src\/main\.js$/i, 34],
    [/^src\/preload\.js$/i, 32],
    [/^src\/renderer\.js$/i, 30],
    [/^src\/renderer\.html$/i, 26],
    [/^src\/style\.css$/i, 24],
    [/^README(\.[^.]+)?$/i, 12],
    [/^docs\//i, 10]
  ],
  spec_writer: [
    [/^README(\.[^.]+)?$/i, 28],
    [/^docs\//i, 34],
    [/^src\/renderer\.html$/i, 20],
    [/^src\/style\.css$/i, 18],
    [/^src\/renderer\.js$/i, 16],
    [/^package\.json$/i, 10]
  ],
  session_handoff: [
    [/^README(\.[^.]+)?$/i, 28],
    [/^changelog(\.[^.]+)?$/i, 24],
    [/^docs\/handoff/i, 32],
    [/^docs\//i, 20],
    [/^package\.json$/i, 10]
  ],
  bridge_diagnostics: [
    [/^package\.json$/i, 28],
    [/^src\/main\.js$/i, 36],
    [/^src\/preload\.js$/i, 34],
    [/^scripts\//i, 18],
    [/^README(\.[^.]+)?$/i, 12],
    [/^docs\//i, 10]
  ]
};

function workflowSuggestionBonus(relativePath, workflowId) {
  const bonuses = WORKFLOW_SUGGESTION_BONUSES[String(workflowId || "").trim()] || [];
  let total = 0;
  for (const [pattern, bonus] of bonuses) {
    if (pattern.test(relativePath)) {
      total += bonus;
    }
  }
  return total;
}

function suggestContextPackPaths(rootPath, workflowId = "") {
  const summary = summarizeWorkspace(rootPath);
  const suggestions = [];
  const seen = new Set();

  const pushSuggestion = (relativePath, reason, baseScore = 0) => {
    const normalized = normalizeRelativeWorkspacePath(relativePath);
    if (seen.has(normalized)) return;
    const absolutePath = path.resolve(summary.rootPath, normalized);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return;
    seen.add(normalized);
    suggestions.push({
      relativePath: normalized,
      reason: String(reason || "").trim(),
      score: Number(baseScore) + workflowSuggestionBonus(normalized, workflowId)
    });
  };

  const rootEntries = listEntriesSafe(summary.rootPath);
  const readmeEntry = rootEntries.find((entry) => entry.isFile() && /^readme(\.[^.]+)?$/i.test(String(entry.name || "")));
  if (readmeEntry) {
    pushSuggestion(readmeEntry.name, "Repository overview", 30);
  }
  const changelogEntry = rootEntries.find((entry) => entry.isFile() && /^changelog(\.[^.]+)?$/i.test(String(entry.name || "")));
  if (changelogEntry) {
    pushSuggestion(changelogEntry.name, "Release history", 28);
  }
  if (rootEntries.some((entry) => entry.isFile() && entry.name === "package.json")) {
    pushSuggestion("package.json", "Scripts and package metadata", 26);
  }

  const docsDir = path.join(summary.rootPath, "docs");
  if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
    const docsEntries = listEntriesSafe(docsDir)
      .filter((entry) => entry.isFile() && /\.(md|txt|json)$/i.test(String(entry.name || "")))
      .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")))
      .slice(0, 4);
    for (const entry of docsEntries) {
      pushSuggestion(path.posix.join("docs", entry.name), "Project docs", 20);
    }
  }

  const scriptsDir = path.join(summary.rootPath, "scripts");
  if (fs.existsSync(scriptsDir) && fs.statSync(scriptsDir).isDirectory()) {
    const scriptEntries = listEntriesSafe(scriptsDir)
      .filter((entry) => entry.isFile() && /\.(js|cjs|mjs|ps1|sh|md)$/i.test(String(entry.name || "")))
      .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")))
      .slice(0, 2);
    for (const entry of scriptEntries) {
      pushSuggestion(path.posix.join("scripts", entry.name), "Local automation scripts", 16);
    }
  }

  const srcFiles = [
    ["src/main.js", "Main process and runtime bridge", 18],
    ["src/preload.js", "Guarded preload and IPC bridge", 18],
    ["src/renderer.js", "Renderer workflow and operator state", 16],
    ["src/renderer.html", "Primary UI layout surface", 16],
    ["src/style.css", "Primary UI styling surface", 15]
  ];
  for (const [relativePath, reason, baseScore] of srcFiles) {
    pushSuggestion(relativePath, reason, baseScore);
  }

  return suggestions
    .sort((left, right) => (
      Number(right.score || 0) - Number(left.score || 0)
      || String(left.relativePath || "").localeCompare(String(right.relativePath || ""))
    ))
    .slice(0, CONTEXT_PACK_SUGGESTION_LIMIT)
    .map(({ relativePath, reason }) => ({ relativePath, reason }));
}

function statWorkspaceFiles(rootPath, relativePaths) {
  const summary = summarizeWorkspace(rootPath);
  assert(Array.isArray(relativePaths), "Workspace file list is required.");
  return relativePaths.map((relativePath) => {
    const safeRelative = normalizeRelativeWorkspacePath(relativePath);
    const absolutePath = path.resolve(summary.rootPath, safeRelative);
    const relativeFromRoot = path.relative(summary.rootPath, absolutePath);
    assert(
      relativeFromRoot &&
      !relativeFromRoot.startsWith("..") &&
      !path.isAbsolute(relativeFromRoot),
      "Workspace file path escapes the root."
    );
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return {
        rootPath: summary.rootPath,
        relativePath: safeRelative,
        absolutePath,
        exists: false,
        modifiedAt: ""
      };
    }
    return {
      rootPath: summary.rootPath,
      relativePath: safeRelative,
      absolutePath,
      exists: true,
      modifiedAt: fs.statSync(absolutePath).mtime.toISOString()
    };
  });
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

function normalizeRelativeWorkspacePath(value) {
  const normalized = String(value || "").trim().replace(/\\/g, "/");
  assert(normalized.length > 0, "Workspace file path is required.");
  const next = path.posix.normalize(normalized);
  assert(
    next !== ".." &&
    !next.startsWith("../") &&
    !next.includes("/../") &&
    !next.startsWith("/"),
    "Workspace file path is invalid."
  );
  return next;
}

function readWorkspaceFile(rootPath, relativePath, maxChars = 4000) {
  const summary = summarizeWorkspace(rootPath);
  const safeRelative = normalizeRelativeWorkspacePath(relativePath);
  const absolutePath = path.resolve(summary.rootPath, safeRelative);
  const relativeFromRoot = path.relative(summary.rootPath, absolutePath);
  assert(
    relativeFromRoot &&
    !relativeFromRoot.startsWith("..") &&
    !path.isAbsolute(relativeFromRoot),
    "Workspace file path escapes the root."
  );
  assert(fs.existsSync(absolutePath), `Workspace file not found: ${safeRelative}`);
  assert(fs.statSync(absolutePath).isFile(), "Workspace file path must point to a file.");
  const content = fs.readFileSync(absolutePath, "utf8");
  const limit = Math.max(200, Number(maxChars) || 4000);
  return {
    rootPath: summary.rootPath,
    relativePath: safeRelative,
    absolutePath,
    modifiedAt: fs.statSync(absolutePath).mtime.toISOString(),
    content: content.length > limit ? `${content.slice(0, limit)}\n...[truncated]` : content
  };
}

module.exports = {
  summarizeWorkspace,
  suggestContextPackPaths,
  statWorkspaceFiles,
  readWorkspaceFile
};
