const HIGH_RISK_PATTERNS = [
  /credential\s*steal/i,
  /reverse\s*shell/i,
  /\bmalware\b/i,
  /\bkeylog(?:ger)?\b/i,
  /\bransom(?:ware)?\b/i
];

function evaluateText(policy, text) {
  const mode = String(policy || "balanced").toLowerCase();
  const content = String(text || "");

  if (mode === "off") {
    return { blocked: false, reason: "" };
  }

  const strict = mode === "strict";
  const patterns = strict ? HIGH_RISK_PATTERNS : HIGH_RISK_PATTERNS.slice(0, 3);
  const match = patterns.find((pattern) => pattern.test(content));
  if (!match) {
    return { blocked: false, reason: "" };
  }

  return {
    blocked: true,
    reason: strict ? "Blocked by strict safety policy." : "Blocked by balanced safety policy."
  };
}

function enforcePolicyOnMessages(policy, messages) {
  const joined = Array.isArray(messages)
    ? messages.map((m) => (m && typeof m.content === "string" ? m.content : "")).join("\n")
    : "";
  return evaluateText(policy, joined);
}

function enforcePolicyOnArgs(policy, args) {
  const joined = Array.isArray(args) ? args.map((arg) => String(arg || "")).join(" ") : "";
  return evaluateText(policy, joined);
}

module.exports = {
  evaluateText,
  enforcePolicyOnArgs,
  enforcePolicyOnMessages
};
