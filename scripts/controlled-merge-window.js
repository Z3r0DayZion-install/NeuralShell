const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const {
  buildProtectionPayload,
  evaluateProtection,
  parseRepo,
  readPolicy
} = require("./branch-protection-lib");

const root = path.resolve(__dirname, "..");
const defaultReportPath = path.join(root, "release", "controlled-merge-window-report.json");

function parseArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) {
    const npmKey = `npm_config_${String(name).replace(/-/g, "_")}`;
    const fromNpm = String(process.env[npmKey] || "").trim();
    return fromNpm || fallback;
  }
  return String(raw).slice(prefix.length).trim();
}

function hasFlag(flag) {
  if (process.argv.includes(flag)) {
    return true;
  }
  const npmKey = `npm_config_${String(flag).replace(/^--/, "").replace(/-/g, "_")}`;
  return process.env[npmKey] === "true" || process.env[npmKey] === "1";
}

function resolveToken() {
  const fromEnv = String(process.env.GH_ADMIN_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync("gh auth token", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8")
      .trim();
  } catch {
    return "";
  }
}

function resolveRepo() {
  const explicit = parseArg("repo", "");
  if (explicit) return explicit;
  const fromEnv = String(process.env.GITHUB_REPOSITORY || "").trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync("gh repo view --json nameWithOwner -q .nameWithOwner", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString("utf8")
      .trim();
  } catch {
    return "";
  }
}

function normalizePath(filePath) {
  if (!filePath) return defaultReportPath;
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
}

function nowIso() {
  return new Date().toISOString();
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
  let parsed;
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

function toRelaxedPayload(canonicalPayload) {
  return {
    ...canonicalPayload,
    required_status_checks: null,
    required_pull_request_reviews: null,
    required_conversation_resolution: false
  };
}

function summarizeProtection(protection) {
  const contexts = Array.isArray(protection?.required_status_checks?.contexts)
    ? protection.required_status_checks.contexts.map((ctx) => String(ctx.context || ctx))
    : [];
  const reviewCount = Number(protection?.required_pull_request_reviews?.required_approving_review_count || 0);
  return {
    strict: protection?.required_status_checks?.strict ?? null,
    contexts,
    reviewCount,
    requireCodeOwnerReviews: Boolean(protection?.required_pull_request_reviews?.require_code_owner_reviews),
    requiredConversationResolution: Boolean(protection?.required_conversation_resolution?.enabled),
    requiredLinearHistory: Boolean(protection?.required_linear_history?.enabled)
  };
}

function writeReport(reportPath, report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function mergePr(repo, prNumber, method, deleteBranch) {
  const args = ["pr", "merge", String(prNumber), `--${method}`, "--admin", "--repo", repo];
  if (deleteBranch) args.push("--delete-branch");
  const result = spawnSync("gh", args, {
    cwd: root,
    encoding: "utf8"
  });
  return {
    command: `gh ${args.join(" ")}`,
    status: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const deleteBranch = !hasFlag("--keep-branch");
  const methodRaw = parseArg("method", "squash").toLowerCase();
  const method = methodRaw === "rebase" ? "rebase" : "squash";
  const prValue = parseArg("pr", "");
  const prNumber = Number(prValue);
  const reportPath = normalizePath(parseArg("report", ""));
  const policyPath = parseArg("policy", "");
  const token = resolveToken();
  const repoInput = resolveRepo();
  const repo = parseRepo(repoInput);
  const policy = readPolicy(policyPath || undefined);
  const branch = parseArg("branch", policy.branch || "master");
  const canonicalPayload = buildProtectionPayload(policy);
  const relaxedPayload = toRelaxedPayload(canonicalPayload);
  const protectionUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}/branches/${encodeURIComponent(branch)}/protection`;

  if (!dryRun && !token) {
    throw new Error("Missing GitHub token. Set GH_ADMIN_TOKEN/GITHUB_TOKEN or authenticate gh CLI.");
  }
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error("Missing or invalid --pr=<number>.");
  }

  const report = {
    generatedAt: nowIso(),
    mode: dryRun ? "dry-run" : "execute",
    repo: `${repo.owner}/${repo.name}`,
    branch,
    pr: prNumber,
    method,
    deleteBranch,
    policyPath: policyPath || "default",
    steps: [],
    merge: null,
    protectionBefore: null,
    protectionAfter: null,
    restoreVerified: false,
    restoreFailures: [],
    success: false
  };

  const step = (name, status, extra = {}) => {
    report.steps.push({
      at: nowIso(),
      step: name,
      status,
      ...extra
    });
  };

  let tempApplied = false;
  let originalError = null;

  try {
    if (dryRun) {
      step("load-policy", "ok", {
        canonicalContexts: canonicalPayload.required_status_checks.contexts,
        canonicalReviewCount: canonicalPayload.required_pull_request_reviews.required_approving_review_count
      });
      step("preview-relaxed-window", "ok", {
        relaxed: {
          required_status_checks: relaxedPayload.required_status_checks,
          required_pull_request_reviews: relaxedPayload.required_pull_request_reviews,
          required_conversation_resolution: relaxedPayload.required_conversation_resolution
        }
      });
      step("preview-merge-command", "ok", {
        command: `gh pr merge ${prNumber} --${method} --admin --repo ${repo.owner}/${repo.name}${deleteBranch ? " --delete-branch" : ""}`
      });
      report.success = true;
    } else {
      const before = await requestJson(protectionUrl, "GET", token);
      report.protectionBefore = summarizeProtection(before);
      step("read-branch-protection", "ok", report.protectionBefore);

      await requestJson(protectionUrl, "PUT", token, relaxedPayload);
      tempApplied = true;
      step("open-merge-window", "ok", {
        required_status_checks: null,
        required_pull_request_reviews: null
      });

      const mergeResult = mergePr(`${repo.owner}/${repo.name}`, prNumber, method, deleteBranch);
      report.merge = mergeResult;
      if (mergeResult.status !== 0) {
        step("merge-pr", "fail", {
          status: mergeResult.status,
          stderr: mergeResult.stderr
        });
        throw new Error(`PR merge failed: ${mergeResult.stderr || mergeResult.stdout || "unknown error"}`);
      }
      step("merge-pr", "ok", {
        stdout: mergeResult.stdout
      });

      report.success = true;
    }
  } catch (err) {
    originalError = err;
    report.success = false;
    step("execute", "fail", { error: err.message || String(err) });
  } finally {
    if (!dryRun && tempApplied) {
      try {
        await requestJson(protectionUrl, "PUT", token, canonicalPayload);
        step("restore-branch-protection", "ok");
      } catch (restoreErr) {
        const msg = restoreErr.message || String(restoreErr);
        report.restoreFailures.push(msg);
        step("restore-branch-protection", "fail", { error: msg });
      }

      try {
        const after = await requestJson(protectionUrl, "GET", token);
        report.protectionAfter = summarizeProtection(after);
        const verdict = evaluateProtection(after, policy);
        report.restoreVerified = verdict.ok;
        if (!verdict.ok) {
          report.restoreFailures.push(...verdict.failures);
          step("verify-restore", "fail", { failures: verdict.failures });
        } else {
          step("verify-restore", "ok");
        }
      } catch (verifyErr) {
        const msg = verifyErr.message || String(verifyErr);
        report.restoreFailures.push(msg);
        step("verify-restore", "fail", { error: msg });
      }
    }

    writeReport(reportPath, report);
  }

  if (originalError) {
    throw originalError;
  }
  if (!dryRun && !report.restoreVerified) {
    throw new Error(`Branch protection restore verification failed. See report: ${reportPath}`);
  }
  console.log(`[controlled-merge-window] report=${reportPath}`);
  console.log("[controlled-merge-window] PASS");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
