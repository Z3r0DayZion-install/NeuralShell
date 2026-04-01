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

test("partner and managed-service packs are generated and complete", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d17-partner-managed-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const partnerRun = runNode("scripts/gen_partner_enablement_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--partner", "NorthGrid Partner Group"
    ]);
    const partnerDir = extractLastPath(partnerRun.stdout);
    const partnerPack = readJson(path.join(partnerDir, "co_sell_readiness.json"));
    assert.equal(typeof partnerPack.readinessScore, "number");
    assert.ok(["ready", "attention", "blocked"].includes(partnerPack.status));

    const managedRun = runNode("scripts/gen_managed_services_summary.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const managedDir = extractLastPath(managedRun.stdout);
    const summary = readJson(path.join(managedDir, "managed_services_summary.json"));
    assert.equal(typeof summary.managedAccounts, "number");
    assert.equal(summary.noHiddenCloudDependency, true);
    const weekly = fs.readFileSync(path.join(managedDir, "managed_services_weekly_summary.md"), "utf8");
    assert.equal(hasPlaceholder(weekly), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("strategic, rollout, and revenue packs are generated with non-placeholder output", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d17-ops-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const strategicRun = runNode("scripts/gen_strategic_account_brief.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt,
      "--account", "Metro Utility"
    ]);
    const strategicDir = extractLastPath(strategicRun.stdout);
    const strategicManifest = readJson(path.join(strategicDir, "manifest.json"));
    assert.equal(strategicManifest.nonPlaceholderValidated, true);

    const rolloutRun = runNode("scripts/gen_portfolio_rollout_summary.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const rolloutDir = extractLastPath(rolloutRun.stdout);
    const matrix = readJson(path.join(rolloutDir, "rollout_stage_matrix.json"));
    assert.equal(Array.isArray(matrix.rows), true);
    assert.ok(matrix.rows.length >= 1);

    const revenueRun = runNode("scripts/gen_revenue_ops_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const revenueDir = extractLastPath(revenueRun.stdout);
    const monthly = fs.readFileSync(path.join(revenueDir, "monthly_revenue_ops_pack.md"), "utf8");
    assert.equal(hasPlaceholder(monthly), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("channel, renewal, and scale status packs are generated and internally consistent", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d17-scale-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const channelRun = runNode("scripts/gen_channel_expansion_plan.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const channelDir = extractLastPath(channelRun.stdout);
    const channelScore = readJson(path.join(channelDir, "channel_type_scorecards.json"));
    assert.equal(Array.isArray(channelScore.scorecards), true);

    const renewalRun = runNode("scripts/gen_cross_account_renewal_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const renewalDir = extractLastPath(renewalRun.stdout);
    const renewal = readJson(path.join(renewalDir, "renewal_calendar_matrix.json"));
    assert.equal(Array.isArray(renewal.rows), true);

    const scaleRun = runNode("scripts/gen_scale_status_pack.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", generatedAt
    ]);
    const scaleDir = extractLastPath(scaleRun.stdout);
    const scale = readJson(path.join(scaleDir, "scale_status_pack.json"));
    assert.equal(typeof scale.certifiedPartners, "number");
    assert.equal(typeof scale.activeManagedAccounts, "number");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
