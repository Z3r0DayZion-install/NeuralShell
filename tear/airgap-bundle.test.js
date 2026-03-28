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
    stderr: String(run.stderr || ""),
  };
}

test("air-gap bundle verify passes for valid and fails for tampered bundle", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-airgap-"));
  try {
    const generated = runNode("scripts/gen_airgap_bundle.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", "2026-03-28T00:00:00.000Z",
      "--version", "2.1.29",
    ]);
    const bundlePath = generated.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
    assert.ok(bundlePath, "Expected generated bundle path");
    assert.equal(fs.existsSync(bundlePath), true, "Generated bundle does not exist");

    runNode("scripts/verify_airgap_bundle.cjs", ["--bundle", bundlePath], 0);

    const tamperedPath = path.join(path.dirname(bundlePath), "airgap_bundle.tampered.json");
    const tampered = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    tampered.payload.mode.allowExternalNetwork = true;
    fs.writeFileSync(tamperedPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");

    runNode("scripts/verify_airgap_bundle.cjs", ["--bundle", tamperedPath], 1);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
