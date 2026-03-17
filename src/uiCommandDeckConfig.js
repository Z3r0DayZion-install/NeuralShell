(function initCommandDeckConfig(root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = config;
  }
  root.NeuralShellCommandDeckConfig = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCommandDeckConfig() {
  const PROMPT_SNIPPETS = [
    {
      id: "debug",
      label: "Debug Plan",
      text: "Diagnose this issue. List likely root causes, verification steps, and the smallest safe fix."
    },
    {
      id: "summary",
      label: "Summarize",
      text: "Summarize the current conversation into key points and concrete next actions."
    },
    {
      id: "strict",
      label: "Strict Output",
      text: "Answer with: assumptions, solution, risks, and verification checklist. Keep it concise and exact."
    },
    {
      id: "command",
      label: "Command Script",
      text: "Generate copy-paste commands with a brief explanation for each command."
    },
    {
      id: "release",
      label: "Shipping Gate",
      text: "Audit shipping readiness, list blockers first, and finish with explicit pass/fail gates plus verification."
    },
    {
      id: "modular",
      label: "Modular Refactor",
      text: "Refactor this surface into smaller modules, preserve behavior, and call out risks before changing public contracts."
    }
  ];

  const COMMAND_PALETTE_PREFIXES = {
    action: ["action", "actions"],
    artifact: ["artifact", "artifacts", "dock"],
    apply: ["apply", "patch", "diff"],
    command: ["command", "commands"],
    context: ["context", "repo"],
    memory: ["memory", "draft", "recent"],
    profile: ["profile", "profiles"],
    release: ["shipping", "ship"],
    session: ["session", "sessions"],
    shortcut: ["shortcut", "shortcuts"],
    workflow: ["workflow", "workflows"],
    slash: ["slash"]
  };

  const COMMAND_PALETTE_SECTION_ORDER = [
    "Context Profiles",
    "Repo Context",
    "Workflow Actions",
    "Shipping Controls",
    "Apply Deck",
    "Artifact Dock",
    "Session Controls",
    "Operator Memory",
    "Shortcuts",
    "Interface Controls",
    "Command Catalog",
    "Slash Commands",
    "Other Actions"
  ];

  return {
    COMMAND_PALETTE_PREFIXES,
    COMMAND_PALETTE_SECTION_ORDER,
    PROMPT_SNIPPETS
  };
});
