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

test("ecosystem portfolio/service/network/global packs are generated", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d18-ecosys-a-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const portfolioRun = runNode("scripts/gen_ecosystem_portfolio_brief.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const portfolioDir = extractLastPath(portfolioRun.stdout);
    const portfolio = readJson(path.join(portfolioDir, "ecosystem_portfolio_brief.json"));
    assert.equal(portfolio.strategyUsable, true);

    const serviceRun = runNode("scripts/gen_service_line_ops_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const serviceDir = extractLastPath(serviceRun.stdout);
    const service = readJson(path.join(serviceDir, "service_line_ops_pack.json"));
    assert.equal(service.localGrounded, true);

    const networkRun = runNode("scripts/gen_partner_network_report.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const networkDir = extractLastPath(networkRun.stdout);
    const network = readJson(path.join(networkDir, "partner_network_governance_report.json"));
    assert.equal(network.flowsLogged, true);

    const globalRun = runNode("scripts/gen_global_planning_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const globalDir = extractLastPath(globalRun.stdout);
    const globalSummary = fs.readFileSync(path.join(globalDir, "global_planning_summary.md"), "utf8");
    assert.equal(hasPlaceholder(globalSummary), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("revenue/board/operator packs are generated and defensible", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d18-ecosys-b-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const revenueRun = runNode("scripts/gen_ecosystem_revenue_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const revenueDir = extractLastPath(revenueRun.stdout);
    const revenue = readJson(path.join(revenueDir, "ecosystem_revenue_pack.json"));
    assert.equal(revenue.falsePrecisionAvoided, true);

    const boardRun = runNode("scripts/gen_board_operating_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const boardDir = extractLastPath(boardRun.stdout);
    const board = readJson(path.join(boardDir, "board_operating_pack.json"));
    assert.equal(board.claimsEvidenceLinked, true);

    const operatorRun = runNode("scripts/gen_operator_launch_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const operatorDir = extractLastPath(operatorRun.stdout);
    const operator = readJson(path.join(operatorDir, "licensed_operator_framework.json"));
    assert.equal(operator.noLegalOverclaiming, true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("ecosystem command pack is generated and links drilldowns", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-d18-ecosys-c-"));
  try {
    const generatedAt = "2026-03-28T00:00:00.000Z";
    const commandRun = runNode("scripts/gen_ecosystem_command_pack.cjs", ["--output-root", tmpRoot, "--generated-at", generatedAt]);
    const commandDir = extractLastPath(commandRun.stdout);
    const command = readJson(path.join(commandDir, "ecosystem_command_pack.json"));
    assert.equal(Array.isArray(command.cards), true);
    assert.equal(Array.isArray(command.drilldowns), true);
    const summary = fs.readFileSync(path.join(commandDir, "ecosystem_command_summary.md"), "utf8");
    assert.equal(hasPlaceholder(summary), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
