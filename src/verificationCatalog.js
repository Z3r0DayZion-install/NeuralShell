(function initVerificationCatalog(root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = catalog;
  }
  root.NeuralShellVerificationCatalog = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildVerificationCatalog() {
  const CHECKS = [
    {
      id: "lint",
      label: "Run lint",
      description: "Run the local lint pipeline against the current workspace root.",
      command: ["npm", "run", "lint"],
      commandLabel: "npm run lint",
      timeoutMs: 180000,
      scopes: [
        { label: "Local only", tone: "good" },
        { label: "Runs npm", tone: "guard" },
        { label: "Explicit run", tone: "warn" }
      ]
    },
    {
      id: "founder_e2e",
      label: "Run founder e2e",
      description: "Run the founder Playwright suite against the guarded desktop flow.",
      command: ["npm", "run", "test:e2e"],
      commandLabel: "npm run test:e2e",
      timeoutMs: 420000,
      scopes: [
        { label: "Local only", tone: "good" },
        { label: "Runs Playwright", tone: "guard" },
        { label: "Explicit run", tone: "warn" }
      ]
    },
    {
      id: "store_screenshots",
      label: "Refresh store screenshots",
      description: "Regenerate the Microsoft Store screenshot set for the current UI state.",
      command: ["npm", "run", "channel:store:screenshots"],
      commandLabel: "npm run channel:store:screenshots",
      timeoutMs: 420000,
      scopes: [
        { label: "Local only", tone: "good" },
        { label: "Writes assets", tone: "warn" },
        { label: "Explicit run", tone: "warn" }
      ]
    }
  ];

  const GROUP_CHECK_MAP = {
    documentation: ["lint", "store_screenshots"],
    interface: ["lint", "founder_e2e"],
    runtime: ["lint", "founder_e2e"],
    automation: ["lint", "founder_e2e", "store_screenshots"],
    project: ["lint"]
  };

  const checkMap = Object.fromEntries(CHECKS.map((check) => [check.id, check]));

  function getCheck(id) {
    return checkMap[String(id || "").trim()] || null;
  }

  function isCheckId(id) {
    return Object.prototype.hasOwnProperty.call(checkMap, String(id || "").trim());
  }

  function listChecks(ids) {
    return (Array.isArray(ids) ? ids : [])
      .map((id) => getCheck(id))
      .filter(Boolean);
  }

  function getChecksForGroup(groupId) {
    const normalized = String(groupId || "").trim();
    return listChecks(GROUP_CHECK_MAP[normalized] || GROUP_CHECK_MAP.project);
  }

  return {
    CHECKS,
    GROUP_CHECK_MAP,
    getCheck,
    getChecksForGroup,
    isCheckId,
    listChecks
  };
});
