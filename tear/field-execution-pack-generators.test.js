const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function runNode(scriptPath, args = [], expectStatus = 0) {
  const run = spawnSync(
    process.execPath,
    [scriptPath, ...args],
    { cwd: ROOT, encoding: "utf8" }
  );
  if (run.status !== expectStatus) {
    throw new Error(
      `Unexpected exit code for node ${scriptPath} ${args.join(" ")}\n` +
      `Expected: ${expectStatus}\nActual: ${run.status}\nSTDOUT:\n${run.stdout}\nSTDERR:\n${run.stderr}`
    );
  }
  return {
    stdout: String(run.stdout || ""),
    stderr: String(run.stderr || "")
  };
}

function extractLastPath(stdout) {
  return String(stdout || "").trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasPlaceholder(text) {
  const safe = String(text || "").toLowerCase();
  return safe.includes("todo") || safe.includes("tbd") || safe.includes("placeholder");
}

test("buyer follow-up and demo recap packs are generated and stage-correct", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d16-buyer-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const buyerRun = runNode("scripts/gen_buyer_followup_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "Metro Utility Evaluator",
      "--stage", "security_review",
      "--days-since-touch", "9"
    ]);
    const buyerDir = extractLastPath(buyerRun.stdout);
    const buyerPack = readJson(path.join(buyerDir, "buyer_followup_pack.json"));
    assert.equal(buyerPack.stage.id, "security_review");
    assert.equal(buyerPack.nudgeRecommended, true);
    const timeline = fs.readFileSync(path.join(buyerDir, "buyer_timeline_summary.md"), "utf8");
    assert.equal(hasPlaceholder(timeline), false);

    const recapRun = runNode("scripts/gen_demo_recap.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "Metro Utility Evaluator",
      "--panels", "mission-control,trust-fabric,field-launch"
    ]);
    const recapDir = extractLastPath(recapRun.stdout);
    const recap = readJson(path.join(recapDir, "demo_recap.json"));
    assert.equal(Array.isArray(recap.panelCoverage), true);
    assert.ok(recap.panelCoverage.includes("trust-fabric"));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("demo-to-pilot and expansion packs produce non-placeholder outputs", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d16-conversion-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const demoToPilotRun = runNode("scripts/gen_demo_to_pilot_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "NorthGrid Utilities"
    ]);
    const d2pDir = extractLastPath(demoToPilotRun.stdout);
    const d2pManifest = readJson(path.join(d2pDir, "manifest.json"));
    assert.equal(d2pManifest.nonPlaceholderValidated, true);
    const decision = readJson(path.join(d2pDir, "decision_status.json"));
    assert.ok(["ready_for_pilot", "revisit", "not_fit"].includes(decision.decision));

    const expansionRun = runNode("scripts/gen_expansion_summary_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "NorthGrid Utilities"
    ]);
    const expansionDir = extractLastPath(expansionRun.stdout);
    const summary = readJson(path.join(expansionDir, "expansion_summary_pack.json"));
    assert.equal(Array.isArray(summary.suggestedPaths), true);
    assert.ok(summary.suggestedPaths.length >= 1);
    const stakeholder = fs.readFileSync(path.join(expansionDir, "stakeholder_summary.md"), "utf8");
    assert.equal(hasPlaceholder(stakeholder), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("renewal and feedback summaries are generated and complete", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d16-retention-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const renewalRun = runNode("scripts/gen_renewal_summary.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "City Infrastructure Agency",
      "--support-load", "81",
      "--incident-backlog", "63",
      "--deployment-health", "68",
      "--adoption-health", "49",
      "--executive-sponsor", "55"
    ]);
    const renewalDir = extractLastPath(renewalRun.stdout);
    const renewal = readJson(path.join(renewalDir, "renewal_summary.json"));
    assert.equal(typeof renewal.riskScore, "number");
    assert.ok(["low", "medium", "high"].includes(renewal.riskBand));
    assert.ok(Array.isArray(renewal.recommendedInterventions));

    const feedbackRun = runNode("scripts/gen_field_feedback_summary.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const feedbackDir = extractLastPath(feedbackRun.stdout);
    const feedback = readJson(path.join(feedbackDir, "field_feedback_routing.json"));
    assert.equal(typeof feedback.totalNotes, "number");
    assert.ok(feedback.totalNotes >= 1);
    const weekly = fs.readFileSync(path.join(feedbackDir, "weekly_field_feedback_summary.md"), "utf8");
    assert.equal(hasPlaceholder(weekly), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
