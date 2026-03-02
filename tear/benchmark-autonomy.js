const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function has(text, needle) {
  return text.includes(needle);
}

function scoreCheck(label, ok, points) {
  return { label, ok: Boolean(ok), points: ok ? points : 0, max: points };
}

function run() {
  const renderer = read("src/renderer.js");
  const main = read("src/main.js");
  const preload = read("src/preload.js");
  const validators = read("src/core/ipcValidators.js");
  const rgb = read("src/core/rgbController.js");
  const policy = read("src/core/policyFirewall.js");
  const audit = read("src/core/auditChain.js");

  const checks = [
    scoreCheck("autonomy.multi_agent", has(renderer, "runMultiAgentStep("), 10),
    scoreCheck("autonomy.checkpoint", has(renderer, "updateAutonomousCheckpoint("), 10),
    scoreCheck("autonomy.replay", has(renderer, "replayLastAutonomousRunPrompts("), 6),
    scoreCheck("autonomy.safety_policy", has(renderer, "safetyPromptPrefix("), 10),
    scoreCheck("autonomy.personality", has(renderer, "personalityPromptPrefix("), 8),
    scoreCheck("ui.clock.settings", has(renderer, "clockUtcOffset"), 6),
    scoreCheck("rgb.controller", has(rgb, "applyMood(") && has(rgb, "sendOpenRgbColor("), 10),
    scoreCheck("rgb.main_ipc", has(main, "rgb:status") && has(main, "rgb:applyMood"), 10),
    scoreCheck("rgb.preload_surface", has(preload, "rgb:status") && has(preload, "rgb:applyMood"), 8),
    scoreCheck("validator.safety", has(validators, "safetyPolicy"), 6),
    scoreCheck("validator.rgb_targets", has(validators, "rgbTargets"), 8),
    scoreCheck("validator.safety_policy", has(validators, "safetyPolicy"), 6),
    scoreCheck("policy.firewall", has(policy, "enforcePolicyOnMessages") && has(policy, "evaluateText"), 10),
    scoreCheck("audit.chain", has(audit, "class AuditChain") && has(main, "audit:verify"), 10),
    scoreCheck("release.gate.hardening", fs.existsSync(path.join(root, "tear", "release-gate.js")), 8)
  ];

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const max = checks.reduce((sum, c) => sum + c.max, 0);
  const pct = Math.round((score / Math.max(1, max)) * 100);
  const verdict = pct >= 90 ? "elite" : pct >= 75 ? "strong" : pct >= 60 ? "good" : "needs_work";

  const report = {
    generatedAt: new Date().toISOString(),
    score,
    max,
    percent: pct,
    verdict,
    checks
  };

  const outFile = path.join(root, "release", "autonomy-benchmark.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Autonomy benchmark: ${score}/${max} (${pct}%) -> ${verdict}`);
  console.log(`Report: ${outFile}`);
}

try {
  run();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
