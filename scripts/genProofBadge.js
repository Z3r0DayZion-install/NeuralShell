const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_MANIFEST = path.join(ROOT, "dist", "SHA256SUMS.txt");
const DEFAULT_SVG_OUTPUT = path.join(ROOT, "release", "proof_badge.svg");
const DEFAULT_REPO_SLUG = process.env.GITHUB_REPOSITORY || "Z3r0DayZion-install/NeuralShell";
const BADGE_BLOCK_START = "<!-- neuralshell-proof-badge:start -->";
const BADGE_BLOCK_END = "<!-- neuralshell-proof-badge:end -->";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    if (!token.startsWith("--")) continue;
    const eqIndex = token.indexOf("=");
    if (eqIndex > -1) {
      out[token.slice(2, eqIndex)] = token.slice(eqIndex + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = String(next);
      i += 1;
    } else {
      out[key] = "true";
    }
  }
  return out;
}

function resolveFromRoot(candidate, fallback) {
  if (!candidate) return fallback;
  if (path.isAbsolute(candidate)) return candidate;
  return path.join(ROOT, candidate);
}

function normalizePathField(value) {
  const normalized = String(value || "").trim().replace(/\\/g, "/");
  if (!normalized) return "";

  const rootPosix = ROOT.replace(/\\/g, "/");
  if (normalized.toLowerCase().startsWith(`${rootPosix.toLowerCase()}/`)) {
    return normalized.slice(rootPosix.length + 1);
  }
  return normalized;
}

function parseManifestEntries(text) {
  const entries = [];
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const powershell = trimmed.match(/^@\{Hash=([A-Fa-f0-9]{64});\s*Path=(.+)\}$/);
    if (powershell) {
      entries.push({
        sha256: powershell[1].toLowerCase(),
        path: normalizePathField(powershell[2]),
      });
      continue;
    }

    const standard = trimmed.match(/^([A-Fa-f0-9]{64})\s+(.+)$/);
    if (standard) {
      entries.push({
        sha256: standard[1].toLowerCase(),
        path: normalizePathField(standard[2]),
      });
    }
  }
  return entries.filter((entry) => entry.path);
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function makeBadgeSvg(leftText, rightText) {
  const charWidth = 7.1;
  const leftWidth = Math.max(64, Math.ceil(leftText.length * charWidth) + 20);
  const rightWidth = Math.max(84, Math.ceil(rightText.length * charWidth) + 20);
  const totalWidth = leftWidth + rightWidth;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(`${leftText}: ${rightText}`)}">`,
    '  <linearGradient id="g" x2="0" y2="100%">',
    '    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>',
    '    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>',
    '    <stop offset=".9" stop-color="#000" stop-opacity=".3"/>',
    '    <stop offset="1" stop-color="#000" stop-opacity=".5"/>',
    "  </linearGradient>",
    `  <rect rx="3" width="${leftWidth}" height="20" fill="#2f2f2f"/>`,
    `  <rect rx="3" x="${leftWidth}" width="${rightWidth}" height="20" fill="#1e9b47"/>`,
    `  <path fill="#1e9b47" d="M${leftWidth} 0h4v20h-4z"/>`,
    `  <rect rx="3" width="${totalWidth}" height="20" fill="url(#g)"/>`,
    '  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">',
    `    <text x="${Math.floor(leftWidth / 2)}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(leftText)}</text>`,
    `    <text x="${Math.floor(leftWidth / 2)}" y="14">${escapeXml(leftText)}</text>`,
    `    <text x="${leftWidth + Math.floor(rightWidth / 2)}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(rightText)}</text>`,
    `    <text x="${leftWidth + Math.floor(rightWidth / 2)}" y="14">${escapeXml(rightText)}</text>`,
    "  </g>",
    "</svg>",
  ].join("\n");
}

function sha256Hex(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function buildBadgeMarkdown(badgeUrl) {
  const safeUrl = String(badgeUrl || "").trim();
  return `${BADGE_BLOCK_START}
[![Proof Locked](${safeUrl})](${safeUrl})
${BADGE_BLOCK_END}`;
}

function upsertBadgeMarkdown(readmePath, badgeUrl) {
  const markdownBlock = buildBadgeMarkdown(badgeUrl);
  const existing = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";

  const markerRegex = new RegExp(
    `${BADGE_BLOCK_START}[\\s\\S]*?${BADGE_BLOCK_END}`,
    "m"
  );
  let next;
  if (markerRegex.test(existing)) {
    next = existing.replace(markerRegex, markdownBlock);
  } else if (existing.startsWith("# ")) {
    const firstBreak = existing.indexOf("\n");
    if (firstBreak > -1) {
      next = `${existing.slice(0, firstBreak + 1)}\n${markdownBlock}\n${existing.slice(firstBreak + 1)}`;
    } else {
      next = `${existing}\n\n${markdownBlock}\n`;
    }
  } else {
    next = `${markdownBlock}\n\n${existing}`;
  }
  fs.writeFileSync(readmePath, next, "utf8");
}

function relPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

async function cli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const manifestPath = resolveFromRoot(args.manifest, DEFAULT_MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifestText = fs.readFileSync(manifestPath, "utf8");
  const entries = parseManifestEntries(manifestText);
  if (!entries.length) {
    throw new Error(`Manifest contains no hash entries: ${manifestPath}`);
  }

  const manifestDigest = sha256Hex(manifestText);
  const rightText = `locked ${entries.length} | ${manifestDigest.slice(0, 8)}`;
  const svg = makeBadgeSvg("proof", rightText);

  const outputMode = String(args.output || "svg").trim().toLowerCase();
  const svgOutputPath = resolveFromRoot(args["svg-output"] || args.output, DEFAULT_SVG_OUTPUT);
  let writtenSvgPath = null;

  if (outputMode !== "readme") {
    fs.mkdirSync(path.dirname(svgOutputPath), { recursive: true });
    fs.writeFileSync(svgOutputPath, `${svg}\n`, "utf8");
    writtenSvgPath = svgOutputPath;
  }

  const shouldPatchReadme = outputMode === "readme" || args["append-readme"] === "true";
  let readmePath = null;
  let badgeUrl = null;
  if (shouldPatchReadme) {
    readmePath = resolveFromRoot(args.readme, path.join(ROOT, "README.md"));
    badgeUrl = String(
      args["badge-url"]
        || `https://raw.githubusercontent.com/${DEFAULT_REPO_SLUG}/badges/proof_badge.svg`
    ).trim();
    upsertBadgeMarkdown(readmePath, badgeUrl);
  }

  const result = {
    ok: true,
    manifestPath: relPath(manifestPath),
    entryCount: entries.length,
    manifestDigest,
    svgPath: writtenSvgPath ? relPath(writtenSvgPath) : null,
    readmePath: readmePath ? relPath(readmePath) : null,
    badgeUrl,
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) {
  cli().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  });
}

module.exports = {
  cli,
  parseManifestEntries,
  makeBadgeSvg,
  buildBadgeMarkdown,
};
