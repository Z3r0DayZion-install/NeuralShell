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

test("hardware appliance build generator emits at least 3 profile bundles with decommission checklists", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-hw-build-"));
  try {
    const outDir = runNode("scripts/gen_hardware_appliance_build.cjs", [
      "--output-root", tmpRoot,
      "--generated-at", "2026-03-28T00:00:00.000Z",
    ]);
    assert.equal(fs.existsSync(outDir), true, `Missing hardware build output: ${outDir}`);
    const manifestPath = path.join(outDir, "manifest.json");
    assert.equal(fs.existsSync(manifestPath), true, "Missing hardware build manifest");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.ok(Array.isArray(manifest.profiles), "manifest.profiles must be an array");
    assert.ok(manifest.profiles.length >= 3, "Expected at least 3 generated hardware profiles");

    manifest.profiles.forEach((profile) => {
      const profileId = String(profile.profileId || "");
      assert.ok(profileId, "Profile id missing");
      assert.equal(fs.existsSync(path.join(outDir, profileId, "build_manifest.json")), true, `Missing build_manifest for ${profileId}`);
      assert.equal(fs.existsSync(path.join(outDir, profileId, "decommission_checklist.json")), true, `Missing decommission_checklist for ${profileId}`);
    });
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
