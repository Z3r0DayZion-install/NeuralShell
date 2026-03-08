const {
  buildProtectionPayload,
  parseRepo,
  readPolicy
} = require("./branch-protection-lib");

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) return fallback;
  return String(raw).slice(prefix.length).trim();
}

async function requestJson(url, method, token, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${url} failed (${response.status}): ${text}`);
  }
  return parsed;
}

async function main() {
  const token = process.env.GH_ADMIN_TOKEN || process.env.GITHUB_TOKEN;
  const repoInput = getArg("repo", process.env.GITHUB_REPOSITORY);
  const policyPath = getArg("policy", "");
  const dryRun = process.argv.includes("--dry-run");

  if (!token && !dryRun) {
    throw new Error("GH_ADMIN_TOKEN or GITHUB_TOKEN is required unless --dry-run is used.");
  }
  if (!repoInput) {
    throw new Error("Missing repo. Provide --repo=owner/name or set GITHUB_REPOSITORY.");
  }

  const repo = parseRepo(repoInput);
  const policy = readPolicy(policyPath || undefined);
  const branch = getArg("branch", policy.branch || "master");
  const payload = buildProtectionPayload(policy);

  console.log(`[branch-protection] repo=${repo.owner}/${repo.name} branch=${branch}`);
  console.log(`[branch-protection] required contexts: ${payload.required_status_checks.contexts.join(", ")}`);

  if (dryRun) {
    console.log("[branch-protection] dry-run payload:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/branches/${encodeURIComponent(branch)}/protection`;
  await requestJson(url, "PUT", token, payload);
  console.log("[branch-protection] enforcement applied.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
