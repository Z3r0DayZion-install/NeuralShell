const HIGH_RISK_PATTERNS = [
  /credential\s+steal/i,
  /exfiltrat(e|ion)/i,
  /keylogger/i,
  /ransomware/i,
  /privilege\s+escalation/i,
  /disable\s+antivirus/i,
  /bypass\s+security/i,
  /phishing\s+kit/i,
  /malware/i,
  /reverse\s+shell/i
];

const MEDIUM_RISK_PATTERNS = [
  /password\s+dump/i,
  /token\s+theft/i,
  /session\s+hijack/i,
  /command\s+and\s+control/i,
  /data\s+extraction/i
];

function evaluateText(policy, text) {
  const mode = String(policy || "balanced").toLowerCase();
  const content = String(text || "");
  const high = HIGH_RISK_PATTERNS.find((rx) => rx.test(content));
  const medium = MEDIUM_RISK_PATTERNS.find((rx) => rx.test(content));

  if (mode === "off") {
    return { blocked: false, level: "off", reason: "" };
  }
  if (mode === "strict") {
    if (high || medium) {
      return {
        blocked: true,
        level: high ? "high" : "medium",
        reason: `Blocked by strict safety policy: ${(high || medium).source}`
      };
    }
    return { blocked: false, level: "low", reason: "" };
  }
  if (high) {
    return {
      blocked: true,
      level: "high",
      reason: `Blocked by balanced safety policy: ${high.source}`
    };
  }
  return { blocked: false, level: medium ? "medium" : "low", reason: "" };
}

function enforcePolicyOnMessages(policy, messages) {
  const list = Array.isArray(messages) ? messages : [];
  for (const msg of list) {
    const content = msg && typeof msg.content === "string" ? msg.content : "";
    const verdict = evaluateText(policy, content);
    if (verdict.blocked) {
      return verdict;
    }
  }
  return { blocked: false, level: "low", reason: "" };
}

function enforcePolicyOnArgs(policy, args) {
  const joined = Array.isArray(args) ? args.map((x) => String(x || "")).join("\n") : "";
  return evaluateText(policy, joined);
}

module.exports = {
  evaluateText,
  enforcePolicyOnMessages,
  enforcePolicyOnArgs
};
