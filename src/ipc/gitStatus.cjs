const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function resolveRoot(rootPath = '') {
  const trimmed = String(rootPath || '').trim();
  if (!trimmed) return process.cwd();
  return path.resolve(trimmed);
}

function findGitRoot(startPath) {
  let cursor = path.resolve(startPath);
  while (cursor && cursor !== path.dirname(cursor)) {
    if (fs.existsSync(path.join(cursor, '.git'))) {
      return cursor;
    }
    cursor = path.dirname(cursor);
  }
  return null;
}

function parseStatus(output = '') {
  const counts = {
    added: 0,
    modified: 0,
    deleted: 0,
    renamed: 0,
    untracked: 0,
  };

  const lines = String(output || '').split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean);
  for (const line of lines) {
    const x = line.slice(0, 1);
    const y = line.slice(1, 2);
    const pair = `${x}${y}`;

    if (pair === '??') {
      counts.untracked += 1;
      continue;
    }
    if (pair.includes('A')) counts.added += 1;
    if (pair.includes('M')) counts.modified += 1;
    if (pair.includes('D')) counts.deleted += 1;
    if (pair.includes('R')) counts.renamed += 1;
  }

  return counts;
}

function safeGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function getGitStatusSummary(rootPath = '') {
  const resolvedRoot = resolveRoot(rootPath);
  if (!fs.existsSync(resolvedRoot)) {
    return {
      ok: false,
      reason: 'root_not_found',
      rootPath: resolvedRoot,
      checkedAt: new Date().toISOString(),
    };
  }

  const gitRoot = findGitRoot(resolvedRoot);
  if (!gitRoot) {
    return {
      ok: false,
      reason: 'not_git_repository',
      rootPath: resolvedRoot,
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const branch = String(safeGit(gitRoot, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim() || 'detached';
    const porcelain = String(safeGit(gitRoot, ['status', '--porcelain']) || '');
    const counts = parseStatus(porcelain);
    const dirty = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0) > 0;

    return {
      ok: true,
      rootPath: gitRoot,
      branch,
      counts,
      dirty,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      reason: err && err.message ? err.message : String(err),
      rootPath: gitRoot,
      checkedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  getGitStatusSummary,
};
