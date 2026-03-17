const fs = require("fs");
const path = require("path");

const VALID_WORKSPACE_ACTION_KINDS = new Set([
  "artifact_markdown",
  "artifact_json",
  "evidence_bundle_json",
  "file_replace"
]);
const WINDOWS_RESERVED_FILENAME_PATTERN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeRootPath(rootPath) {
  const safeRoot = String(rootPath || "").trim();
  assert(safeRoot.length > 0, "Workspace root is required.");
  const resolved = path.resolve(safeRoot);
  assert(fs.existsSync(resolved), "Workspace root does not exist.");
  assert(fs.statSync(resolved).isDirectory(), "Workspace root must be a directory.");
  return resolved;
}

function normalizeDirectory(directory) {
  const safeDirectory = String(directory == null ? "." : directory)
    .trim()
    .replace(/\\/g, "/");
  if (safeDirectory === "" || safeDirectory === ".") {
    return ".";
  }
  const normalized = path.posix.normalize(safeDirectory);
  assert(
    normalized !== ".." &&
      !normalized.startsWith("../") &&
      !normalized.includes("/../") &&
      !normalized.startsWith("/"),
    "Workspace action directory is invalid."
  );
  return normalized;
}

function normalizeFilename(filename) {
  const safeFilename = String(filename || "").trim();
  assert(safeFilename.length > 0, "Workspace action filename is required.");
  assert(
    !safeFilename.includes("/") && !safeFilename.includes("\\"),
    "Workspace action filename cannot contain path separators."
  );
  assert(
    safeFilename !== "." && safeFilename !== "..",
    "Workspace action filename is invalid."
  );
  const hasControlCharacter = Array.from(safeFilename).some((char) => char.charCodeAt(0) <= 31);
  assert(
    !hasControlCharacter && !/[<>:"/\\|?*]/.test(safeFilename),
    "Workspace action filename contains unsupported characters."
  );
  assert(!/[. ]$/.test(safeFilename), "Workspace action filename cannot end with a space or period.");
  assert(!WINDOWS_RESERVED_FILENAME_PATTERN.test(safeFilename), "Workspace action filename uses a reserved Windows name.");
  return safeFilename;
}

function normalizeContent(content) {
  const text = String(content == null ? "" : content);
  assert(text.trim().length > 0, "Workspace action content is required.");
  return text.endsWith("\n") ? text : `${text}\n`;
}

function normalizeRelativeFilePath(filePath) {
  const raw = String(filePath || "").trim().replace(/\\/g, "/");
  assert(raw.length > 0, "Patch plan file path is required.");
  assert(!raw.startsWith("/") && !/^[a-zA-Z]:/.test(raw), "Patch plan file path must stay inside the workspace.");
  const normalized = path.posix.normalize(raw);
  assert(
    normalized !== "." &&
      normalized !== ".." &&
      !normalized.startsWith("../") &&
      !normalized.includes("/../"),
    "Patch plan file path is invalid."
  );
  return normalized;
}

function splitRelativeFilePath(filePath) {
  const normalized = normalizeRelativeFilePath(filePath);
  const parts = normalized.split("/");
  const filename = normalizeFilename(parts.pop());
  const directory = parts.length ? normalizeDirectory(parts.join("/")) : ".";
  return {
    relativePath: normalized,
    directory,
    filename
  };
}

function slugifySegment(value, fallback = "file") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function ensureInsideRoot(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  assert(
    relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative)),
    "Workspace action escapes the attached root."
  );
}

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function summarizeUnifiedDiff(oldText, newText, relativePath) {
  if (String(oldText || "") === String(newText || "")) {
    return [
      `--- a/${relativePath}`,
      `+++ b/${relativePath}`,
      "@@ no changes @@",
      " File content is identical. Applying will keep the same bytes on disk."
    ].join("\n");
  }

  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const context = 3;
  const prefixContextStart = Math.max(0, prefix - context);
  const prefixContext = oldLines.slice(prefixContextStart, prefix);
  const suffixContext = suffix > 0
    ? oldLines.slice(oldLines.length - suffix, Math.min(oldLines.length, oldLines.length - suffix + context))
    : [];
  const removed = oldLines.slice(prefix, oldLines.length - suffix);
  const added = newLines.slice(prefix, newLines.length - suffix);
  const hunkOldCount = prefixContext.length + removed.length + suffixContext.length;
  const hunkNewCount = prefixContext.length + added.length + suffixContext.length;

  return [
    `--- a/${relativePath}`,
    `+++ b/${relativePath}`,
    `@@ -${prefixContextStart + 1},${hunkOldCount} +${prefixContextStart + 1},${hunkNewCount} @@`,
    ...prefixContext.map((line) => ` ${line}`),
    ...removed.map((line) => `-${line}`),
    ...added.map((line) => `+${line}`),
    ...suffixContext.map((line) => ` ${line}`)
  ].join("\n");
}

function previewWorkspaceAction(request) {
  const kind = String(request && request.kind || "").trim();
  assert(
    VALID_WORKSPACE_ACTION_KINDS.has(kind),
    `Unsupported workspace action kind: ${kind}`
  );

  const rootPath = normalizeRootPath(request.rootPath);
  const directory = normalizeDirectory(request.directory);
  const filename = normalizeFilename(request.filename);
  const content = normalizeContent(request.content);

  const absoluteDirectory = path.resolve(rootPath, directory);
  const absolutePath = path.resolve(absoluteDirectory, filename);
  ensureInsideRoot(rootPath, absoluteDirectory);
  ensureInsideRoot(rootPath, absolutePath);

  const exists = fs.existsSync(absolutePath);
  const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, "/");
  const existingContent = exists ? fs.readFileSync(absolutePath, "utf8") : "";
  const diffText = kind === "file_replace"
    ? summarizeUnifiedDiff(existingContent, content, relativePath)
    : "";
  const previewText = kind === "file_replace"
    ? diffText
    : content.length > 3200
      ? `${content.slice(0, 3200)}\n...`
      : content;
  const lines = content.split(/\r?\n/).filter((line, index, rows) => line.length > 0 || index < rows.length - 1).length;

  return {
    proposalId: String(request.proposalId || kind),
    kind,
    title: String(request.title || "").trim(),
    description: String(request.description || "").trim(),
    rootPath,
    directory,
    filename,
    relativePath,
    absolutePath,
    exists,
    bytes: Buffer.byteLength(content, "utf8"),
    lines,
    previewKind: kind === "file_replace" ? "diff" : "content",
    previewText,
    diffText,
    content,
    generatedAt: new Date().toISOString()
  };
}

function normalizePatchPlan(requestPlan) {
  const plan = requestPlan && typeof requestPlan === "object" && !Array.isArray(requestPlan)
    ? requestPlan
    : {};
  const files = Array.isArray(plan.files) ? plan.files : [];
  assert(files.length > 0, "Patch plan must include at least one file.");

  return {
    id: String(plan.id || `patch-plan-${Date.now()}`),
    workflowId: String(plan.workflowId || "release_audit"),
    outputMode: String(plan.outputMode || "patch_plan"),
    title: String(plan.title || "Patch Plan").trim() || "Patch Plan",
    summary: String(plan.summary || "").trim(),
    generatedAt: String(plan.generatedAt || new Date().toISOString()),
    rootPath: String(plan.rootPath || "").trim(),
    verification: Array.isArray(plan.verification)
      ? plan.verification.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    files: files.map((file, index) => {
      assert(file && typeof file === "object" && !Array.isArray(file), "Patch plan file entry is invalid.");
      const relativePath = normalizeRelativeFilePath(file.path);
      return {
        fileId: String(file.fileId || `${index + 1}-${slugifySegment(relativePath, `file-${index + 1}`)}`),
        path: relativePath,
        status: String(file.status || "").trim(),
        rationale: String(file.rationale || "").trim(),
        content: normalizeContent(file.content),
        diffText: String(file.diffText || ""),
        bytes: Number.isFinite(Number(file.bytes)) ? Number(file.bytes) : 0,
        lines: Number.isFinite(Number(file.lines)) ? Number(file.lines) : 0,
        selected: file.selected !== false,
        appliedAt: String(file.appliedAt || "").trim(),
        absolutePath: String(file.absolutePath || "").trim()
      };
    })
  };
}

function previewPatchPlan(request) {
  const rootPath = normalizeRootPath(request && request.rootPath);
  const plan = normalizePatchPlan(request && request.plan);

  const previewFiles = plan.files.map((file) => {
    const target = splitRelativeFilePath(file.path);
    const preview = previewWorkspaceAction({
      proposalId: file.fileId,
      kind: "file_replace",
      title: file.rationale ? `Patch: ${file.path}` : `Patch: ${target.relativePath}`,
      description: file.rationale,
      rootPath,
      directory: target.directory,
      filename: target.filename,
      content: file.content
    });
    return {
      ...file,
      path: preview.relativePath,
      status: preview.exists ? "modify" : "new",
      diffText: preview.diffText || preview.previewText,
      bytes: preview.bytes,
      lines: preview.lines,
      selected: file.selected !== false,
      absolutePath: preview.absolutePath
    };
  });

  const totalBytes = previewFiles.reduce((sum, file) => sum + Number(file.bytes || 0), 0);
  const totalLines = previewFiles.reduce((sum, file) => sum + Number(file.lines || 0), 0);
  const newFiles = previewFiles.filter((file) => file.status === "new").length;
  const modifiedFiles = previewFiles.filter((file) => file.status === "modify").length;

  return {
    ...plan,
    rootPath,
    files: previewFiles,
    totalFiles: previewFiles.length,
    newFiles,
    modifiedFiles,
    totalBytes,
    totalLines,
    selectedFileIds: previewFiles.filter((file) => file.selected !== false).map((file) => file.fileId)
  };
}

function applyPatchPlan(request) {
  const preview = previewPatchPlan(request);
  const requestedIds = Array.isArray(request && request.selectedFileIds) && request.selectedFileIds.length
    ? request.selectedFileIds.map((item) => String(item || "").trim()).filter(Boolean)
    : preview.files.filter((file) => file.selected !== false).map((file) => file.fileId);
  const selectedIds = Array.from(new Set(requestedIds));
  assert(selectedIds.length > 0, "Select at least one patch file to apply.");
  const knownIds = new Set(preview.files.map((file) => file.fileId));
  for (const fileId of selectedIds) {
    assert(knownIds.has(fileId), `Unknown patch plan fileId: ${fileId}`);
  }
  const selectedSet = new Set(selectedIds);

  const appliedFiles = preview.files.map((file) => {
    if (!selectedSet.has(file.fileId)) {
      return file;
    }
    const target = splitRelativeFilePath(file.path);
    const applied = applyWorkspaceAction({
      proposalId: file.fileId,
      kind: "file_replace",
      title: file.rationale ? `Patch: ${file.path}` : `Patch: ${target.relativePath}`,
      description: file.rationale,
      rootPath: preview.rootPath,
      directory: target.directory,
      filename: target.filename,
      content: file.content
    });
    return {
      ...file,
      diffText: applied.diffText || file.diffText,
      bytes: applied.bytes,
      lines: applied.lines,
      absolutePath: applied.absolutePath,
      appliedAt: applied.appliedAt
    };
  });

  return {
    ...preview,
    files: appliedFiles,
    appliedFileIds: selectedIds,
    appliedCount: selectedIds.length,
    appliedAt: new Date().toISOString()
  };
}

function applyWorkspaceAction(request) {
  const preview = previewWorkspaceAction(request);
  fs.mkdirSync(path.dirname(preview.absolutePath), { recursive: true });
  fs.writeFileSync(preview.absolutePath, preview.content, "utf8");
  return {
    ...preview,
    appliedAt: new Date().toISOString()
  };
}

module.exports = {
  VALID_WORKSPACE_ACTION_KINDS,
  applyPatchPlan,
  applyWorkspaceAction,
  normalizeFilename,
  previewPatchPlan,
  previewWorkspaceAction
};
