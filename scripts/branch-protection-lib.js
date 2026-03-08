const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const defaultPolicyPath = path.join(root, "governance", "branch_protection_policy.json");

function readPolicy(policyPath = defaultPolicyPath) {
  const absPath = path.isAbsolute(policyPath) ? policyPath : path.join(root, policyPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Branch protection policy not found: ${absPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(absPath, "utf8"));
  const contexts = Array.isArray(raw?.required_status_checks?.contexts)
    ? raw.required_status_checks.contexts.map((s) => String(s))
    : [];
  return {
    branch: String(raw.branch || "master"),
    required_status_checks: {
      strict: Boolean(raw?.required_status_checks?.strict),
      contexts
    },
    enforce_admins: Boolean(raw.enforce_admins),
    required_pull_request_reviews: {
      dismiss_stale_reviews: Boolean(raw?.required_pull_request_reviews?.dismiss_stale_reviews),
      require_code_owner_reviews: Boolean(raw?.required_pull_request_reviews?.require_code_owner_reviews),
      required_approving_review_count: Number(
        raw?.required_pull_request_reviews?.required_approving_review_count || 1
      )
    },
    required_conversation_resolution: Boolean(raw.required_conversation_resolution),
    required_linear_history: Boolean(raw.required_linear_history),
    allow_force_pushes: Boolean(raw.allow_force_pushes),
    allow_deletions: Boolean(raw.allow_deletions),
    block_creations: Boolean(raw.block_creations)
  };
}

function buildProtectionPayload(policy) {
  return {
    required_status_checks: {
      strict: Boolean(policy.required_status_checks.strict),
      contexts: [...policy.required_status_checks.contexts]
    },
    enforce_admins: Boolean(policy.enforce_admins),
    required_pull_request_reviews: {
      dismiss_stale_reviews: Boolean(policy.required_pull_request_reviews.dismiss_stale_reviews),
      require_code_owner_reviews: Boolean(policy.required_pull_request_reviews.require_code_owner_reviews),
      required_approving_review_count: Number(policy.required_pull_request_reviews.required_approving_review_count)
    },
    restrictions: null,
    required_linear_history: Boolean(policy.required_linear_history),
    allow_force_pushes: Boolean(policy.allow_force_pushes),
    allow_deletions: Boolean(policy.allow_deletions),
    block_creations: Boolean(policy.block_creations),
    required_conversation_resolution: Boolean(policy.required_conversation_resolution),
    lock_branch: false,
    allow_fork_syncing: true
  };
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function evaluateProtection(actual, policy) {
  const failures = [];
  const expectedContexts = uniqueSorted(policy.required_status_checks.contexts);
  const actualContexts = uniqueSorted(
    Array.isArray(actual?.required_status_checks?.contexts)
      ? actual.required_status_checks.contexts.map((ctx) => String(ctx.context || ctx))
      : []
  );

  for (const ctx of expectedContexts) {
    if (!actualContexts.includes(ctx)) {
      failures.push(`missing required status check context: ${ctx}`);
    }
  }

  if (Boolean(actual?.required_status_checks?.strict) !== Boolean(policy.required_status_checks.strict)) {
    failures.push("required_status_checks.strict mismatch");
  }
  if (Boolean(actual?.enforce_admins?.enabled) !== Boolean(policy.enforce_admins)) {
    failures.push("enforce_admins mismatch");
  }

  const reviews = actual?.required_pull_request_reviews || {};
  if (Boolean(reviews.dismiss_stale_reviews) !== Boolean(policy.required_pull_request_reviews.dismiss_stale_reviews)) {
    failures.push("dismiss_stale_reviews mismatch");
  }
  if (Boolean(reviews.require_code_owner_reviews) !== Boolean(policy.required_pull_request_reviews.require_code_owner_reviews)) {
    failures.push("require_code_owner_reviews mismatch");
  }
  if (Number(reviews.required_approving_review_count || 0) < Number(policy.required_pull_request_reviews.required_approving_review_count)) {
    failures.push("required_approving_review_count below policy");
  }

  if (Boolean(actual?.required_conversation_resolution?.enabled) !== Boolean(policy.required_conversation_resolution)) {
    failures.push("required_conversation_resolution mismatch");
  }
  if (Boolean(actual?.required_linear_history?.enabled) !== Boolean(policy.required_linear_history)) {
    failures.push("required_linear_history mismatch");
  }
  if (Boolean(actual?.allow_force_pushes?.enabled) !== Boolean(policy.allow_force_pushes)) {
    failures.push("allow_force_pushes mismatch");
  }
  if (Boolean(actual?.allow_deletions?.enabled) !== Boolean(policy.allow_deletions)) {
    failures.push("allow_deletions mismatch");
  }
  if (Boolean(actual?.block_creations?.enabled) !== Boolean(policy.block_creations)) {
    failures.push("block_creations mismatch");
  }

  return {
    ok: failures.length === 0,
    failures,
    expectedContexts,
    actualContexts
  };
}

function parseRepo(input) {
  const raw = String(input || "").trim();
  const parts = raw.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format "${raw}". Expected "owner/name".`);
  }
  return {
    owner: parts[0],
    name: parts[1]
  };
}

module.exports = {
  buildProtectionPayload,
  defaultPolicyPath,
  evaluateProtection,
  parseRepo,
  readPolicy
};
