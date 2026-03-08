const path = require("path");
const {
  buildProtectionPayload,
  evaluateProtection,
  readPolicy
} = require("../scripts/branch-protection-lib");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const policy = readPolicy(path.join("governance", "branch_protection_policy.json"));
  const payload = buildProtectionPayload(policy);

  const requiredContexts = ["CI", "Merge Gate", "Release Contract", "Security Gate"];
  for (const context of requiredContexts) {
    assert(
      payload.required_status_checks.contexts.includes(context),
      `Missing required status check context in payload: ${context}`
    );
  }

  const mockActual = {
    required_status_checks: {
      strict: true,
      contexts: requiredContexts
    },
    enforce_admins: { enabled: true },
    required_pull_request_reviews: {
      dismiss_stale_reviews: true,
      require_code_owner_reviews: true,
      required_approving_review_count: 1
    },
    required_conversation_resolution: { enabled: true },
    required_linear_history: { enabled: true },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
    block_creations: { enabled: true }
  };

  const passVerdict = evaluateProtection(mockActual, policy);
  assert(passVerdict.ok, `Expected policy match. failures=${passVerdict.failures.join("; ")}`);

  const failVerdict = evaluateProtection(
    {
      ...mockActual,
      required_status_checks: {
        strict: true,
        contexts: ["CI"]
      }
    },
    policy
  );
  assert(!failVerdict.ok, "Expected failure when contexts are missing.");
  assert(
    failVerdict.failures.some((f) => f.includes("missing required status check context")),
    "Expected missing-context failure."
  );

  console.log("Branch protection policy test passed.");
}

run();
