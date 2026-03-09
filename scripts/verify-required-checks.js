function parseArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) return fallback;
  return String(raw).slice(prefix.length).trim() || fallback;
}

function parseCsvArg(name, fallback = []) {
  const raw = parseArg(name, "");
  if (!raw) return fallback;
  return raw.split(",").map((namePart) => namePart.trim()).filter(Boolean);
}

const requiredNames = parseCsvArg("required", ["CI", "Merge Gate", "Release Contract"]);
const waitMinutes = Number(parseArg("wait-minutes", "0")) || 0;
const pollSeconds = Math.max(1, Number(parseArg("poll-seconds", "15")) || 15);

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const currentRunId = String(process.env.GITHUB_RUN_ID || "");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed (${response.status}) for ${url}: ${body}`);
  }

  return response.json();
}

function summarizeRun(run) {
  return `${run.name}#${run.id} (${run.event}) ${run.status}/${run.conclusion}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function evaluateRequiredChecks(runs) {
  const visibleRuns = runs.filter((run) => String(run.id) !== currentRunId);
  const successful = visibleRuns.filter((run) => run.status === "completed" && run.conclusion === "success");

  const satisfied = [];
  const missing = [];
  for (const requiredName of requiredNames) {
    const successRun = successful.find((run) => run.name === requiredName);
    if (successRun) {
      satisfied.push(summarizeRun(successRun));
      continue;
    }
    missing.push(requiredName);
  }

  return {
    missing,
    satisfied,
    observed: visibleRuns.map((run) => summarizeRun(run))
  };
}

function buildFailureMessage(missing, observed) {
  return (
    `Missing successful required checks for commit ${sha}: ${missing.join(", ")}\n` +
    (observed.length > 0
      ? `Observed workflow runs:\n- ${observed.join("\n- ")}`
      : "No workflow runs observed for this commit.")
  );
}

async function main() {
  assert(token, "GITHUB_TOKEN (or GH_TOKEN) is required.");
  assert(repo, "GITHUB_REPOSITORY is required.");
  assert(sha, "GITHUB_SHA is required.");

  const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`;
  const deadline = Date.now() + waitMinutes * 60 * 1000;
  let attempt = 0;

  while (true) {
    attempt += 1;
    const payload = await fetchJson(url);
    const runs = Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];
    const result = evaluateRequiredChecks(runs);

    if (result.satisfied.length > 0) {
      console.log("Required checks satisfied:");
      for (const line of result.satisfied) {
        console.log(`- ${line}`);
      }
    }

    if (result.missing.length === 0) {
      console.log(`All required checks passed for ${sha}.`);
      return;
    }

    const waitingEnabled = waitMinutes > 0;
    const canWaitLonger = waitingEnabled && Date.now() < deadline;
    if (!canWaitLonger) {
      throw new Error(buildFailureMessage(result.missing, result.observed));
    }

    console.log(
      `Required checks pending for ${sha}: ${result.missing.join(", ")} (attempt ${attempt}). Retrying in ${pollSeconds}s...`
    );
    await wait(pollSeconds * 1000);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
