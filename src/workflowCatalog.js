(function initWorkflowCatalog(root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = catalog;
  }
  root.NeuralShellWorkflowCatalog = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildWorkflowCatalog() {
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
      id: "release_packet",
      label: "Release Packet",
      instruction: "Return a release-ready packet with verification state, evidence posture, blockers, and next ship actions."
    }
  ];

  const WORKFLOWS = [
    {
      id: "release_audit",
      title: "Release Audit",
      description: "Validate a local release workflow, runtime posture, and ship-readiness without leaving the guarded console.",
      defaultOutputMode: "checklist",
      starterPrompt: "Audit the current release state, identify the highest-risk gaps, and prepare a ship checklist that stays local-first.",
      followUpActions: [
        "Summarize the top 3 release risks and how to verify each one.",
        "Turn this audit into a final ship checklist with pass/fail gates.",
        "Draft a founder handoff for the release state and unresolved blockers."
      ]
    },
    {
      id: "bug_triage",
      title: "Bug Triage",
      description: "Turn an issue, log sample, or runtime symptom into a concrete diagnosis and smallest safe fix path.",
      defaultOutputMode: "patch_plan",
      starterPrompt: "Triage the current issue, list likely root causes, rank them by probability, and recommend the smallest safe fix plus verification.",
      followUpActions: [
        "Convert this triage into a reproduction checklist.",
        "Write a regression test plan for the most likely fix.",
        "Summarize the user-visible impact and rollback path."
      ]
    },
    {
      id: "spec_writer",
      title: "Spec Writer",
      description: "Convert a rough idea into a decision-complete implementation spec with interfaces, risks, and acceptance criteria.",
      defaultOutputMode: "brief",
      starterPrompt: "Write a product and implementation spec for the requested feature. Keep it decision complete, pragmatic, and implementation ready.",
      followUpActions: [
        "Turn this spec into an engineering checklist.",
        "Call out the highest-risk assumptions and edge cases.",
        "Rewrite the spec as a release-ready change summary."
      ]
    },
    {
      id: "session_handoff",
      title: "Session Handoff",
      description: "Condense the current session into a clean handoff that another engineer or future session can pick up immediately.",
      defaultOutputMode: "handoff",
      starterPrompt: "Summarize the current session into a handoff with current state, key decisions, open work, risks, and the next 3 concrete actions.",
      followUpActions: [
        "Rewrite this handoff for a founder update.",
        "Turn this handoff into a checklist for the next session.",
        "Extract only the blockers, assumptions, and verification steps."
      ]
    },
    {
      id: "bridge_diagnostics",
      title: "Bridge Diagnostics",
      description: "Inspect local model bridge health, runtime posture, and the minimum fix path for offline-first operation.",
      defaultOutputMode: "checklist",
      starterPrompt: "Diagnose the local bridge, explain the current operating posture, and produce a minimal checklist to restore a healthy offline-first workflow.",
      followUpActions: [
        "Summarize bridge health as a short runtime brief.",
        "Convert the diagnosis into a local operator checklist.",
        "Write a verification plan for reconnect and safe fallback behavior."
      ]
    }
  ];

  const workflowMap = Object.fromEntries(WORKFLOWS.map((workflow) => [workflow.id, workflow]));
  const outputModeMap = Object.fromEntries(OUTPUT_MODES.map((mode) => [mode.id, mode]));

  function getWorkflow(id) {
    return workflowMap[String(id || "").trim()] || WORKFLOWS[0];
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
    OUTPUT_MODES,
    WORKFLOWS,
    getOutputMode,
    getWorkflow,
    isOutputModeId,
    isWorkflowId
  };
});
