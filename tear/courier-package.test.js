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
  return String(run.stdout || "").trim().split(/\r?\n/).filter(Boolean).at(-1) || "";
}

test("courier package verify passes for valid and fails for tampered payload", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-courier-"));
  try {
    const bundlePath = runNode("scripts/gen_courier_package.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", "2026-03-28T00:00:00.000Z",
      "--sender", "Station-A",
      "--receiver", "Station-B",
      "--class", "sealed",
    ], 0);
    assert.ok(bundlePath, "Expected generated courier package path");
    assert.equal(fs.existsSync(bundlePath), true, "Generated courier package missing");

    runNode("scripts/verify_courier_package.cjs", ["--bundle", bundlePath], 0);

    const tamperedPath = path.join(path.dirname(bundlePath), "courier_package.tampered.json");
    const tampered = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    tampered.payload.sender = "Tampered-Sender";
    fs.writeFileSync(tamperedPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");
    runNode("scripts/verify_courier_package.cjs", ["--bundle", tamperedPath], 1);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
