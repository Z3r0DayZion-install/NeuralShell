(function initWorkflowCatalog(root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = catalog;
  }
  root.NeuralShellWorkflowCatalog = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildWorkflowCatalog() {
  const DEFAULT_WORKFLOW_ID = "bridge_diagnostics";
  const OUTPUT_MODES = [
    {
      id: "brief",
      label: "Brief",
      instruction: "Return a concise brief with summary, key findings, and next actions."
    },
    {
      id: "checklist",
      label: "Checklist",
      instruction: "Return a concrete checklist with short action items and verification notes."
    },
    {
      id: "test_plan",
      label: "Test Plan",
      instruction: "Return a test plan with scenarios, acceptance checks, and failure risks."
    },
    {
      id: "patch_plan",
      label: "Patch Plan",
      instruction: "Return valid JSON with title, summary, verification, and files[]. Each file must include path, rationale, and full replacement content."
    },
    {
      id: "handoff",
      label: "Handoff",
      instruction: "Return a handoff note with current state, decisions made, open work, and next steps."
    },
    {
      id: "shipping_packet",
      label: "Shipping Packet",
      instruction: "Return a shipping-ready packet with verification state, evidence status, blockers, and next ship actions."
    }
  ];

  const WORKFLOWS = [
    {
      id: "shipping_audit",
      title: "Shipping Audit",
      description: "Validate a local shipping workflow, performance status, and ship-readiness without leaving the guarded console.",
      defaultOutputMode: "checklist",
      starterPrompt: "Audit the current shipping state, identify the highest-risk gaps, and prepare a ship checklist that stays local-first.",
      followUpActions: [
        "Top 3 shipping risks + verification",
        "Final ship checklist with pass/fail gates",
        "Founder handoff for blockers"
      ]
    },
    {
      id: "bug_triage",
      title: "Bug Triage",
      description: "Turn an issue, log sample, or performance symptom into a concrete diagnosis and smallest safe fix path.",
      defaultOutputMode: "patch_plan",
      starterPrompt: "Triage the current issue, list likely root causes, rank them by probability, and recommend the smallest safe fix plus verification.",
      followUpActions: [
        "Reproduction checklist",
        "Regression test plan",
        "User impact + rollback path"
      ]
    },
    {
      id: "spec_writer",
      title: "Spec Writer",
      description: "Convert a rough idea into a decision-complete implementation spec with interfaces, risks, and acceptance criteria.",
      defaultOutputMode: "brief",
      starterPrompt: "Write a product and implementation spec for the requested feature. Keep it decision complete, pragmatic, and implementation ready.",
      followUpActions: [
        "Engineering checklist",
        "Risk assumptions + edge cases",
        "Shipping-ready change summary"
      ]
    },
    {
      id: "session_handoff",
      title: "Session Handoff",
      description: "Condense the current session into a clean handoff that another engineer or future session can pick up immediately.",
      defaultOutputMode: "handoff",
      starterPrompt: "Summarize the current session into a handoff with current state, key decisions, open work, risks, and the next 3 concrete actions.",
      followUpActions: [
        "Founder update version",
        "Next-session checklist",
        "Blockers, assumptions, and verification"
      ]
    },
    {
      id: "bridge_diagnostics",
      title: "Bridge Diagnostics",
      description: "Inspect local model bridge health, performance status, and the minimum fix path for offline-first operation.",
      defaultOutputMode: "checklist",
      starterPrompt: "Diagnose the local bridge, explain the current operating status, and produce a minimal checklist to restore a healthy offline-first workflow.",
      followUpActions: [
        "Performance brief",
        "Local operator checklist",
        "Reconnect + fallback verification plan"
      ]
    }
  ];

  const workflowMap = Object.fromEntries(WORKFLOWS.map((workflow) => [workflow.id, workflow]));
  const outputModeMap = Object.fromEntries(OUTPUT_MODES.map((mode) => [mode.id, mode]));

  function getWorkflow(id) {
    return workflowMap[String(id || "").trim()] || workflowMap[DEFAULT_WORKFLOW_ID] || WORKFLOWS[0];
  }

  function getOutputMode(id) {
    return outputModeMap[String(id || "").trim()] || OUTPUT_MODES[0];
  }

  function isWorkflowId(id) {
    return Object.prototype.hasOwnProperty.call(workflowMap, String(id || "").trim());
  }

  function isOutputModeId(id) {
    return Object.prototype.hasOwnProperty.call(outputModeMap, String(id || "").trim());
  }

  return {
    DEFAULT_WORKFLOW_ID,
    OUTPUT_MODES,
    WORKFLOWS,
    getOutputMode,
    getWorkflow,
    isOutputModeId,
    isWorkflowId
  };
});
