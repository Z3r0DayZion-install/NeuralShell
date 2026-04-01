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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function extractLastPath(stdout) {
  return String(stdout || "").trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
}

function findReportPath(stdout) {
  const line = String(stdout || "").split(/\r?\n/).find((entry) => entry.startsWith("report="));
  return line ? line.slice("report=".length).trim() : "";
}

function hasPlaceholder(text) {
  const safe = String(text || "").toLowerCase();
  return safe.includes("todo") || safe.includes("tbd") || safe.includes("placeholder");
}

test("demo bundle and reset plan generate deterministic-ready outputs", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-demo-pack-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const bundleRun = runNode("scripts/gen_demo_bundle.cjs", [
      "--profile", "institutional_exec_brief",
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--version", "2.2.0"
    ]);
    const bundleDir = extractLastPath(bundleRun.stdout);
    assert.ok(bundleDir, "Expected demo bundle output path");
    const bundlePath = path.join(bundleDir, "demo_bundle.json");
    assert.equal(fs.existsSync(bundlePath), true, "Missing demo bundle payload");
    const demoBundle = readJson(bundlePath);
    assert.equal(demoBundle.profileId, "institutional_exec_brief");
    assert.equal(Array.isArray(demoBundle.presenterFlow), true);
    assert.ok(demoBundle.presenterFlow.length >= 5, "Expected seeded presenter flow");
    assert.equal(demoBundle.safeMode.allowOutboundNetwork, false);
    assert.equal(demoBundle.safeMode.resetSupported, true);

    const resetRun = runNode("scripts/reset_demo_state.cjs", [
      "--profile", "institutional_exec_brief",
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const resetDir = extractLastPath(resetRun.stdout);
    assert.ok(resetDir, "Expected demo reset output path");
    const resetPlan = readJson(path.join(resetDir, "demo_reset_plan.json"));
    assert.equal(resetPlan.profileId, "institutional_exec_brief");
    assert.equal(Array.isArray(resetPlan.clearKeys), true);
    assert.ok(resetPlan.clearKeys.includes("neuralshell_demo_mode_v1"));
    assert.equal(resetPlan.applySeedState.neuralshell_demo_mode_v1, "1");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("training/support/pilot pack generators produce complete non-placeholder outputs", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-commercial-packs-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";

    const trainingRun = runNode("scripts/gen_training_bundle.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const trainingDir = extractLastPath(trainingRun.stdout);
    assert.equal(fs.existsSync(path.join(trainingDir, "manifest.json")), true);
    assert.equal(fs.existsSync(path.join(trainingDir, "exam_export_manifest.json")), true);
    const trainingManifest = readJson(path.join(trainingDir, "manifest.json"));
    assert.ok(Number(trainingManifest.trackCount) >= 3, "Expected multiple training tracks");

    const supportRun = runNode("scripts/gen_support_playbook.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const supportDir = extractLastPath(supportRun.stdout);
    const supportManifest = readJson(path.join(supportDir, "manifest.json"));
    assert.equal(supportManifest.nonPlaceholderValidated, true);
    const bulletin = fs.readFileSync(path.join(supportDir, "known_issue_bulletin_template.md"), "utf8");
    assert.equal(hasPlaceholder(bulletin), false, "Support template must not include placeholders");

    const pilotRun = runNode("scripts/gen_pilot_conversion_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const pilotDir = extractLastPath(pilotRun.stdout);
    const pilotManifest = readJson(path.join(pilotDir, "manifest.json"));
    assert.equal(pilotManifest.nonPlaceholderValidated, true);
    assert.equal(fs.existsSync(path.join(pilotDir, "proof_of_value_worksheet.json")), true);
    const recommendation = fs.readFileSync(path.join(pilotDir, "renewal_expansion_recommendation.md"), "utf8");
    assert.equal(hasPlaceholder(recommendation), false, "Pilot recommendation template must not include placeholders");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("deployment preflight and field-launch health checks pass", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-field-launch-health-"));
  try {
    const preflight = runNode("scripts/preflight_deployment_check.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", "2026-03-28T00:00:00.000Z"
    ]);
    const preflightReportPath = findReportPath(preflight.stdout);
    assert.ok(preflightReportPath, "Expected preflight report path");
    const preflightReport = readJson(preflightReportPath);
    assert.equal(preflightReport.passed, true);

    const health = runNode("scripts/field_launch_health_check.cjs", [
      "--output-root", tmpRoot,
      "--freshness-days", "36500",
      "--generated-at", "2026-03-28T00:00:00.000Z"
    ]);
    const healthReportPath = findReportPath(health.stdout);
    assert.ok(healthReportPath, "Expected field launch health report path");
    const healthReport = readJson(healthReportPath);
    assert.equal(healthReport.passed, true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
