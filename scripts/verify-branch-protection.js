const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  evaluateProtection,
  parseRepo,
  readPolicy
} = require("./branch-protection-lib");

const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "release", "branch-protection-report.json");

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) return fallback;
  return String(raw).slice(prefix.length).trim();
}

function safeExec(command) {
  try {
    return execSync(command, {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString("utf8")
      .trim();
  } catch {
    return "";
  }
}

function parseRepoFromRemote(remoteUrl) {
  const raw = String(remoteUrl || "").trim();
  if (!raw) return "";

  const httpsMatch = raw.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  const sshMatch = raw.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  return "";
}

function resolveToken() {
  const envToken = String(process.env.GH_ADMIN_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  if (envToken) return envToken;
  return safeExec("gh auth token");
}

function resolveRepo(explicitRepo) {
  const direct = String(explicitRepo || "").trim();
  if (direct) return direct;

  const ghRepo = safeExec("gh repo view --json nameWithOwner -q .nameWithOwner");
  if (ghRepo) return ghRepo;

  const remoteUrl = safeExec("git config --get remote.origin.url");
  const parsed = parseRepoFromRemote(remoteUrl);
  if (parsed) return parsed;

  return "";
}

async function requestJson(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!response.ok) {
    throw new Error(`GitHub API GET ${url} failed (${response.status}): ${text}`);
  }
  return parsed;
}

async function main() {
  const token = resolveToken();
  const repoInput = resolveRepo(getArg("repo", process.env.GITHUB_REPOSITORY));
  const policyPath = getArg("policy", "");
  if (!token) {
    throw new Error("Missing GitHub token. Set GH_ADMIN_TOKEN/GITHUB_TOKEN or authenticate gh CLI.");
  }
  if (!repoInput) {
    throw new Error("Missing repo. Provide --repo=owner/name, set GITHUB_REPOSITORY, or set an origin GitHub remote.");
  }

  const repo = parseRepo(repoInput);
  const policy = readPolicy(policyPath || undefined);
  const branch = getArg("branch", policy.branch || "master");

  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/branches/${encodeURIComponent(branch)}/protection`;
  const actual = await requestJson(url, token);
  const verdict = evaluateProtection(actual, policy);

  const report = {
    generatedAt: new Date().toISOString(),
    repo: `${repo.owner}/${repo.name}`,
    branch,
    ok: verdict.ok,
    failures: verdict.failures,
    expectedContexts: verdict.expectedContexts,
    actualContexts: verdict.actualContexts
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[branch-protection] report=${outPath}`);

  if (!verdict.ok) {
    console.error("[branch-protection] FAIL");
    for (const failure of verdict.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("[branch-protection] PASS");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
