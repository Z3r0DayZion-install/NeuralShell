const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SUMMARY_PATH = path.join(ROOT, 'release', 'proof-bundle-summary.json');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || '');
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith('--')) {
      out[key] = String(next);
      i += 1;
      continue;
    }
    out[key] = 'true';
  }
  return out;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function normalizeRelayMap(input) {
  const source = input && typeof input === "object" ? input : {};
  const out = {};
  for (const [repo, value] of Object.entries(source)) {
    const safeRepo = String(repo || "").trim();
    if (!safeRepo) continue;
    const row = value && typeof value === "object" ? value : {};
    out[safeRepo] = {
      slackWebhook: String(row.slackWebhook || "").trim(),
      discordWebhook: String(row.discordWebhook || "").trim()
    };
  }
  return out;
}

function toPosix(p) {
  return String(p || '').replace(/\\/g, '/');
}

function runGit(command) {
  try {
    return String(execSync(command, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }) || '').trim();
  } catch {
    return '';
  }
}

function gitMeta() {
  const sha = runGit('git rev-parse HEAD');
  const shortSha = sha ? sha.slice(0, 12) : '';
  const tag = runGit('git describe --tags --exact-match');
  const branch = runGit('git rev-parse --abbrev-ref HEAD');
  const origin = runGit('git config --get remote.origin.url');

  let repoSlug = '';
  const githubMatch = origin.match(/github\.com[:/]([^\s]+?)(?:\.git)?$/i);
  if (githubMatch) {
    repoSlug = String(githubMatch[1] || '').replace(/\.git$/i, '');
  }

  return {
    sha,
    shortSha,
    tag,
    branch,
    origin,
    repoSlug
  };
}

function isAuditorMode() {
  const mode = String(process.env.LICENSE_MODE || process.env.NEURAL_LICENSE_MODE || '').trim().toLowerCase();
  const tier = String(process.env.NEURAL_TIER || '').trim().toLowerCase();
  return mode === 'auditor' || mode === 'audit' || tier === 'auditor';
}

function buildManifestLink(summary, meta) {
  const repoSlug = String(meta.repoSlug || '').trim();
  const ref = String(meta.tag || meta.sha || '').trim();
  const manifestRel = toPosix(summary && summary.manifest ? summary.manifest : 'dist/SHA256SUMS.txt');
  if (!repoSlug || !ref) return '';
  return `https://raw.githubusercontent.com/${repoSlug}/${ref}/${manifestRel}`;
}

function buildMessage(summary, meta, manifestLink) {
  const source = String(summary && summary.source ? summary.source : 'unknown');
  const entryCount = Number(summary && summary.entryCount ? summary.entryCount : 0);
  const repoLabel = String(meta.repoSlug || meta.origin || 'local-repo');
  const ref = String(meta.tag || meta.shortSha || meta.branch || 'unknown');
  return [
    'NeuralShell proof bundle passed.',
    `repo=${repoLabel}`,
    `ref=${ref}`,
    `sha=${meta.sha || 'unknown'}`,
    `entries=${entryCount}`,
    `source=${source}`,
    `manifest=${manifestLink || toPosix(summary && summary.manifest ? summary.manifest : '')}`,
  ].join(' | ');
}

async function resolveFetch() {
  if (typeof fetch === 'function') return fetch;
  const nodeFetch = require('node-fetch');
  return nodeFetch;
}

async function postJson(url, body) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return { ok: false, status: 0, reason: 'missing_webhook' };
  }
  const safeFetch = await resolveFetch();
  const response = await safeFetch(safeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await response.text().catch(() => '');
  return {
    ok: response.ok,
    status: response.status,
    reason: response.ok ? '' : (text || `http_${response.status}`)
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (isAuditorMode()) {
    const result = {
      ok: true,
      skipped: true,
      reason: 'auditor_mode'
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result;
  }

  const summaryPath = args.summary
    ? path.resolve(ROOT, args.summary)
    : DEFAULT_SUMMARY_PATH;
  const summary = readJson(summaryPath, null);
  if (!summary || !summary.generatedAt) {
    throw new Error(`Proof summary not found or invalid: ${summaryPath}`);
  }

  const meta = gitMeta();
  const manifestLink = buildManifestLink(summary, meta);
  const message = buildMessage(summary, meta, manifestLink);

  let relayMap = {};
  if (args["relay-map"]) {
    relayMap = normalizeRelayMap(readJson(path.resolve(ROOT, args["relay-map"]), {}));
  } else if (process.env.PROOF_RELAY_MAP_JSON) {
    try {
      relayMap = normalizeRelayMap(JSON.parse(String(process.env.PROOF_RELAY_MAP_JSON || "{}")));
    } catch {
      relayMap = {};
    }
  }

  const repoKey = String(args.repo || meta.repoSlug || "").trim();
  const mapped = relayMap[repoKey] || null;
  const slackWebhook = String((mapped && mapped.slackWebhook) || process.env.SLACK_WEBHOOK || '').trim();
  const discordWebhook = String((mapped && mapped.discordWebhook) || process.env.DISCORD_WEBHOOK || '').trim();

  const dryRun = args['dry-run'] === 'true';
  const output = {
    ok: true,
    generatedAt: new Date().toISOString(),
    summaryPath: toPosix(path.relative(ROOT, summaryPath)),
    repo: meta.repoSlug || meta.origin || 'local-repo',
    tag: meta.tag || '',
    sha: meta.sha || '',
    manifestLink,
    message,
    repoKey,
    slack: { ok: false, status: 0, reason: 'not_attempted' },
    discord: { ok: false, status: 0, reason: 'not_attempted' },
    relayMapped: Boolean(mapped)
  };

  if (dryRun) {
    output.dryRun = true;
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return output;
  }

  if (slackWebhook) {
    output.slack = await postJson(slackWebhook, {
      text: message
    });
  }

  if (discordWebhook) {
    output.discord = await postJson(discordWebhook, {
      content: message
    });
  }

  if (!slackWebhook && !discordWebhook) {
    output.ok = false;
    output.reason = 'no_webhooks_configured';
  } else {
    const attempted = [output.slack, output.discord].filter((item) => item.reason !== 'not_attempted');
    output.ok = attempted.length > 0 && attempted.every((item) => item.ok);
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) {
    process.exitCode = 1;
  }
  return output;
}

if (require.main === module) {
  run().catch((err) => {
    process.stderr.write(`[proofRelay] ${err && err.message ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  run,
  buildMessage,
  buildManifestLink,
  isAuditorMode
};
