import fs from 'fs';
import path from 'path';

export function readJsonFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath, data) {
  if (!filePath) {
    return false;
  }
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    return false;
  }
}

export function appendAuditLog(filePath, entry) {
  if (!filePath) {
    return false;
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function appendAuditLogBounded(filePath, entry, maxBytes = 0) {
  if (!filePath) {
    return false;
  }
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const line = `${JSON.stringify(entry)}\n`;
    fs.appendFileSync(filePath, line, 'utf8');
    const limit = Number(maxBytes);
    if (Number.isFinite(limit) && limit > 0) {
      const stat = fs.statSync(filePath);
      if (stat.size > limit) {
        const keep = Math.min(limit, stat.size);
        const fd = fs.openSync(filePath, 'r');
        try {
          const buffer = Buffer.allocUnsafe(keep);
          fs.readSync(fd, buffer, 0, keep, stat.size - keep);
          let trimmed = buffer.toString('utf8');
          const nlIndex = trimmed.indexOf('\n');
          if (nlIndex >= 0) {
            trimmed = trimmed.slice(nlIndex + 1);
          }
          fs.writeFileSync(filePath, trimmed, 'utf8');
        } finally {
          fs.closeSync(fd);
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function fileStats(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { exists: false, bytes: 0 };
    }
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      bytes: stat.size,
      mtimeMs: stat.mtimeMs
    };
  } catch {
    return { exists: false, bytes: 0 };
  }
}

export function tailJsonLines(filePath, limit = 50) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const slice = lines.slice(-Math.max(1, Number(limit) || 1));
    return slice
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
