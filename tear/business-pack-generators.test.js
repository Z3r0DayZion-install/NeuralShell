const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function runNodeScript(scriptPath, args = []) {
  const run = spawnSync(
    process.execPath,
    [scriptPath, ...args],
    { cwd: ROOT, encoding: "utf8" }
  );
  if (run.status !== 0) {
    throw new Error(
      `Command failed: node ${scriptPath} ${args.join(" ")}\nSTDOUT:\n${run.stdout}\nSTDERR:\n${run.stderr}`
    );
  }
  return String(run.stdout || "").trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("pilot pack generator creates complete non-placeholder bundle", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-pilot-pack-"));
  try {
    const outDir = runNodeScript("scripts/gen_pilot_pack.cjs", [
      "--customer", "Delta Manufacturing",
      "--industry", "industrial",
      "--use-case", "proof-first deployment validation",
      "--logo", "assets/pilot_kit/demo_customer_logo.txt",
      "--output-root", tmpRoot
    ]);
    assert.equal(fs.existsSync(outDir), true, `Pilot pack output missing: ${outDir}`);

    const required = [
      "README.md",
      "01_security_overview.md",
      "02_deployment_guide.md",
      "03_proof_checklist.md",
      "04_roi_worksheet.csv",
      "05_support_contacts.md",
      "06_use_case_brief.md",
      "manifest.json"
    ];
    required.forEach((rel) => {
      assert.equal(fs.existsSync(path.join(outDir, rel)), true, `Missing pilot artifact: ${rel}`);
    });

    const readme = read(path.join(outDir, "README.md"));
    assert.equal(readme.includes("Delta Manufacturing"), true);
    assert.equal(readme.includes("proof-first deployment validation"), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("board pack generator creates markdown/pdf-or-fallback/zip artifacts", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-board-pack-"));
  try {
    const outDir = runNodeScript("scripts/gen_board_pack.cjs", [
      "--input", "analytics/board/sample_metrics_bundle.json",
      "--output-root", tmpRoot
    ]);
    assert.equal(fs.existsSync(outDir), true, `Board pack output missing: ${outDir}`);
    assert.equal(fs.existsSync(path.join(outDir, "board-report.md")), true, "Missing board-report.md");
    assert.equal(fs.existsSync(path.join(outDir, "board-report.json")), true, "Missing board-report.json");
    assert.equal(fs.existsSync(path.join(outDir, "board-report.html")), true, "Missing board-report.html");
    const pdfExists = fs.existsSync(path.join(outDir, "board-report.pdf"));
    const fallbackExists = fs.existsSync(path.join(outDir, "board-report.pdf.fallback.txt"));
    assert.equal(pdfExists || fallbackExists, true, "Missing PDF output and fallback note.");
    assert.equal(fs.existsSync(`${outDir}.zip`), true, "Missing zipped board pack.");

    const markdown = read(path.join(outDir, "board-report.md"));
    assert.equal(markdown.includes("NeuralShell Board Pack"), true);
    assert.equal(markdown.includes("Operating Report"), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
