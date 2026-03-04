const requiredArg = process.argv.find((arg) => String(arg || "").startsWith("--required="));
const requiredNames = requiredArg
  ? String(requiredArg).slice("--required=".length).split(",").map((name) => name.trim()).filter(Boolean)
  : ["CI", "Merge Gate", "Release Contract"];

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

async function main() {
  assert(token, "GITHUB_TOKEN (or GH_TOKEN) is required.");
  assert(repo, "GITHUB_REPOSITORY is required.");
  assert(sha, "GITHUB_SHA is required.");

  const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`;
  const payload = await fetchJson(url);
  const runs = Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];

  const successful = runs.filter((run) => {
    if (String(run.id) === currentRunId) {
      return false;
    }
    return run.status === "completed" && run.conclusion === "success";
  });

  const missing = [];
  const satisfied = [];
  for (const requiredName of requiredNames) {
    const match = successful.find((run) => run.name === requiredName);
    if (!match) {
      missing.push(requiredName);
    } else {
      satisfied.push(summarizeRun(match));
    }
  }

  if (satisfied.length > 0) {
    console.log("Required checks satisfied:");
    for (const line of satisfied) {
      console.log(`- ${line}`);
    }
  }

  if (missing.length > 0) {
    const observed = runs.map((run) => summarizeRun(run));
    throw new Error(
      `Missing successful required checks for commit ${sha}: ${missing.join(", ")}\n` +
      (observed.length > 0
        ? `Observed workflow runs:\n- ${observed.join("\n- ")}`
        : "No workflow runs observed for this commit.")
    );
  }

  console.log(`All required checks passed for ${sha}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
