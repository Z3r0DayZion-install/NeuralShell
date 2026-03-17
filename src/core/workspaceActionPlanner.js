const fs = require("fs");
const path = require("path");

const VALID_WORKSPACE_ACTION_KINDS = new Set([
  "artifact_markdown",
  "artifact_json",
  "evidence_bundle_json",
  "file_replace"
]);
const WINDOWS_RESERVED_FILENAME_PATTERN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const DEFAULT_WORKFLOW_ID = "bridge_diagnostics";

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
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  return normalized === "" ? [] : normalized.split("\n");
}

function appendOperation(operations, type, line) {
  const safeType = String(type || "").trim();
  if (!safeType || safeType === "context") {
    throw new Error("Diff operation type is invalid.");
  }
  const text = String(line == null ? "" : line);
  const last = operations[operations.length - 1];
  if (last && last.type === safeType) {
    last.lines.push(text);
    return;
  }
  operations.push({
    type: safeType,
    lines: [text]
  });
}

function buildLcsTable(oldLines, newLines) {
  const rows = oldLines.length + 1;
  const cols = newLines.length + 1;
  const table = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      table[i][j] = oldLines[i] === newLines[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

function buildDiffOperations(oldLines, newLines) {
  const table = buildLcsTable(oldLines, newLines);
  const operations = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      appendOperation(operations, "equal", oldLines[oldIndex]);
      oldIndex += 1;
      newIndex += 1;
      continue;
    }
    if (table[oldIndex + 1][newIndex] >= table[oldIndex][newIndex + 1]) {
      appendOperation(operations, "remove", oldLines[oldIndex]);
      oldIndex += 1;
    } else {
      appendOperation(operations, "add", newLines[newIndex]);
      newIndex += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    appendOperation(operations, "remove", oldLines[oldIndex]);
    oldIndex += 1;
  }
  while (newIndex < newLines.length) {
    appendOperation(operations, "add", newLines[newIndex]);
    newIndex += 1;
  }

  return operations;
}

function annotateOperations(operations) {
  let oldCursor = 1;
  let newCursor = 1;
  return operations.map((operation) => {
    const entry = {
      ...operation,
      oldStart: oldCursor,
      newStart: newCursor
    };
    if (operation.type !== "add") {
      oldCursor += operation.lines.length;
    }
    if (operation.type !== "remove") {
      newCursor += operation.lines.length;
    }
    return entry;
  });
}

function buildDiffHunks(oldText, newText) {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const context = 3;
  const annotated = annotateOperations(buildDiffOperations(oldLines, newLines));
  const hunks = [];
  let index = 0;

  while (index < annotated.length) {
    if (annotated[index].type === "equal") {
      index += 1;
      continue;
    }

    const startIndex = index;
    let endIndex = index;
    while (
      endIndex + 2 < annotated.length &&
      annotated[endIndex + 1].type === "equal" &&
      annotated[endIndex + 1].lines.length <= context * 2 &&
      annotated[endIndex + 2].type !== "equal"
    ) {
      endIndex += 2;
    }

    const leading = startIndex > 0 && annotated[startIndex - 1].type === "equal"
      ? annotated[startIndex - 1].lines.slice(-context)
      : [];
    const trailing = endIndex + 1 < annotated.length && annotated[endIndex + 1].type === "equal"
      ? annotated[endIndex + 1].lines.slice(0, context)
      : [];

    const lines = [];
    for (const text of leading) {
      lines.push({ type: "context", text });
    }
    for (let opIndex = startIndex; opIndex <= endIndex; opIndex += 1) {
      const operation = annotated[opIndex];
      const lineType = operation.type === "equal" ? "context" : operation.type;
      for (const text of operation.lines) {
        lines.push({ type: lineType, text });
      }
    }
    for (const text of trailing) {
      lines.push({ type: "context", text });
    }

    const oldStart = Math.max(1, annotated[startIndex].oldStart - leading.length);
    const newStart = Math.max(1, annotated[startIndex].newStart - leading.length);
    const oldCount = lines.reduce((sum, line) => sum + (line.type === "add" ? 0 : 1), 0);
    const newCount = lines.reduce((sum, line) => sum + (line.type === "remove" ? 0 : 1), 0);
    const addedCount = lines.reduce((sum, line) => sum + (line.type === "add" ? 1 : 0), 0);
    const removedCount = lines.reduce((sum, line) => sum + (line.type === "remove" ? 1 : 0), 0);

    hunks.push({
      hunkId: `hunk-${hunks.length + 1}-${oldStart}-${newStart}`,
      oldStart,
      oldCount,
      newStart,
      newCount,
      addedCount,
      removedCount,
      selected: true,
      appliedAt: "",
      lines
    });

    index = endIndex + 1;
  }

  return hunks;
}

function formatDiffText(relativePath, hunks) {
  if (!Array.isArray(hunks) || !hunks.length) {
    return [
      `--- a/${relativePath}`,
      `+++ b/${relativePath}`,
      "@@ no changes @@",
      " File content is identical. Applying will keep the same bytes on disk."
    ].join("\n");
  }

  const out = [
    `--- a/${relativePath}`,
    `+++ b/${relativePath}`
  ];
  for (const hunk of hunks) {
    out.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`);
    for (const line of hunk.lines) {
      out.push(`${line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}${line.text}`);
    }
  }
  return out.join("\n");
}

function summarizeUnifiedDiff(oldText, newText, relativePath) {
  return formatDiffText(relativePath, buildDiffHunks(oldText, newText));
}

function normalizePatchPlanHunk(value, index) {
  assert(value && typeof value === "object" && !Array.isArray(value), `Patch plan hunk ${index + 1} is invalid.`);
  const lines = Array.isArray(value.lines)
    ? value.lines.map((line, lineIndex) => {
      assert(line && typeof line === "object" && !Array.isArray(line), `Patch plan hunk ${index + 1} line ${lineIndex + 1} is invalid.`);
      const type = String(line.type || "").trim().toLowerCase();
      assert(type === "context" || type === "remove" || type === "add", `Patch plan hunk ${index + 1} line ${lineIndex + 1} type is invalid.`);
      return {
        type,
        text: String(line.text == null ? "" : line.text)
      };
    })
    : [];

  return {
    hunkId: String(value.hunkId || `hunk-${index + 1}`).trim() || `hunk-${index + 1}`,
    oldStart: Number.isFinite(Number(value.oldStart)) ? Number(value.oldStart) : 1,
    oldCount: Number.isFinite(Number(value.oldCount)) ? Number(value.oldCount) : 0,
    newStart: Number.isFinite(Number(value.newStart)) ? Number(value.newStart) : 1,
    newCount: Number.isFinite(Number(value.newCount)) ? Number(value.newCount) : 0,
    addedCount: Number.isFinite(Number(value.addedCount)) ? Number(value.addedCount) : lines.filter((line) => line.type === "add").length,
    removedCount: Number.isFinite(Number(value.removedCount)) ? Number(value.removedCount) : lines.filter((line) => line.type === "remove").length,
    selected: value.selected !== false,
    appliedAt: String(value.appliedAt || "").trim(),
    lines
  };
}

function buildPreviewHunks(oldText, newText, previousHunks, fallbackSelected = true) {
  const nextHunks = buildDiffHunks(oldText, newText);
  const previousMap = new Map(
    Array.isArray(previousHunks)
      ? previousHunks.map((hunk, index) => {
        const normalized = normalizePatchPlanHunk(hunk, index);
        return [normalized.hunkId, normalized];
      })
      : []
  );
  return nextHunks.map((hunk, index) => {
    const previous = previousMap.get(hunk.hunkId);
    return previous
      ? {
          ...hunk,
          selected: previous.selected !== false,
          appliedAt: previous.appliedAt || ""
        }
      : {
          ...hunk,
          hunkId: String(hunk.hunkId || `hunk-${index + 1}`).trim() || `hunk-${index + 1}`,
          selected: fallbackSelected !== false
        };
  });
}

function selectedHunksForFile(file) {
  return Array.isArray(file && file.hunks)
    ? file.hunks.filter((hunk) => hunk && hunk.selected !== false)
    : [];
}

function materializeContentFromHunks(originalContent, hunks, fallbackContent) {
  if (!Array.isArray(hunks) || !hunks.length) {
    return normalizeContent(fallbackContent);
  }
  const selected = selectedHunksForFile({ hunks })
    .slice()
    .sort((a, b) => (Number(b.oldStart || 0) - Number(a.oldStart || 0)) || String(b.hunkId || "").localeCompare(String(a.hunkId || "")));
  if (!selected.length) {
    return String(originalContent || "");
  }
  const nextLines = splitLines(originalContent).slice();
  for (const hunk of selected) {
    const startIndex = Math.max(0, Number(hunk.oldStart || 1) - 1);
    const deleteCount = Math.max(0, Number(hunk.oldCount || 0));
    const replacement = Array.isArray(hunk.lines)
      ? hunk.lines
          .filter((line) => String(line.type || "") !== "remove")
          .map((line) => String(line.text == null ? "" : line.text))
      : [];
    nextLines.splice(startIndex, deleteCount, ...replacement);
  }
  const nextContent = nextLines.join("\n");
  return nextContent === "" ? "" : (nextContent.endsWith("\n") ? nextContent : `${nextContent}\n`);
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
    workflowId: String(plan.workflowId || DEFAULT_WORKFLOW_ID),
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
        originalContent: String(file.originalContent || ""),
        diffText: String(file.diffText || ""),
        bytes: Number.isFinite(Number(file.bytes)) ? Number(file.bytes) : 0,
        lines: Number.isFinite(Number(file.lines)) ? Number(file.lines) : 0,
        selected: file.selected !== false,
        appliedAt: String(file.appliedAt || "").trim(),
        absolutePath: String(file.absolutePath || "").trim(),
        hunks: Array.isArray(file.hunks)
          ? file.hunks.map((hunk, hunkIndex) => normalizePatchPlanHunk(hunk, hunkIndex))
          : []
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
    const originalContent = preview.exists ? fs.readFileSync(preview.absolutePath, "utf8") : "";
    const hunks = buildPreviewHunks(
      originalContent,
      file.content,
      file.hunks,
      file.selected !== false
    );
    const selected = hunks.length
      ? hunks.some((hunk) => hunk.selected !== false)
      : false;
    return {
      ...file,
      path: preview.relativePath,
      status: preview.exists ? "modify" : "new",
      originalContent,
      diffText: formatDiffText(preview.relativePath, hunks),
      bytes: preview.bytes,
      lines: preview.lines,
      selected,
      absolutePath: preview.absolutePath,
      hunks
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
    const currentContent = fs.existsSync(file.absolutePath)
      ? fs.readFileSync(file.absolutePath, "utf8")
      : "";
    assert(
      currentContent === String(file.originalContent || ""),
      `Patch plan source changed for ${file.path}. Preview again before apply.`
    );
    const nextContent = materializeContentFromHunks(file.originalContent, file.hunks, file.content);
    if (String(nextContent || "") === currentContent) {
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
      content: nextContent === "" ? "\n" : nextContent
    });
    return {
      ...file,
      originalContent: currentContent,
      diffText: applied.diffText || file.diffText,
      bytes: applied.bytes,
      lines: applied.lines,
      absolutePath: applied.absolutePath,
      appliedAt: applied.appliedAt
    };
  });

  const nextPreview = previewPatchPlan({
    rootPath: preview.rootPath,
    plan: {
      ...preview,
      files: appliedFiles
    }
  });

  return {
    ...nextPreview,
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
