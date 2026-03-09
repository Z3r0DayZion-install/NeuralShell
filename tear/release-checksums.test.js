const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { generateReleaseChecksums } = require("../scripts/release-checksums");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function writeFile(baseDir, relPath, contents) {
  const filePath = path.join(baseDir, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function run() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-release-checksums-"));
  try {
    writeFile(fixtureRoot, "dist/NeuralShell Setup 9.9.9.exe", "installer");
    writeFile(fixtureRoot, "dist/NeuralShell Setup 9.9.9.exe.blockmap", "blockmap");
    writeFile(fixtureRoot, "dist/OMEGA.yml", "version: 9.9.9");
    writeFile(fixtureRoot, "release/manifest.json", '{"ok":true}');
    writeFile(fixtureRoot, "release/manifest.sig", "ZmFrZS1zaWduYXR1cmU=");
    writeFile(fixtureRoot, "release/manifest.pub", "-----BEGIN PUBLIC KEY-----\nFAKE\n-----END PUBLIC KEY-----\n");
    writeFile(fixtureRoot, "release/signature-verification.json", '{"verified":true}');
    writeFile(fixtureRoot, "release/status.json", '{"ok":true}');
    writeFile(fixtureRoot, "release/provenance.json", '{"ok":true}');
    writeFile(fixtureRoot, "release/autonomy-benchmark.json", '{"percent":100}');
    writeFile(fixtureRoot, "release/installer-smoke-report.json", '{"passed":true}');

    const fixedNow = "2026-03-03T00:00:00.000Z";
    const first = await generateReleaseChecksums({ rootDir: fixtureRoot, now: () => fixedNow });
    const second = await generateReleaseChecksums({ rootDir: fixtureRoot, now: () => fixedNow });

    assert(fs.existsSync(first.outTxt), "checksums.txt not created.");
    assert(fs.existsSync(first.outJson), "checksums.json not created.");

    const text = fs.readFileSync(first.outTxt, "utf8").trim().split(/\r?\n/).filter(Boolean);
    assert(text.length === 11, `Expected 11 checksum entries, got ${text.length}.`);
    for (const line of text) {
      assert(/^[a-f0-9]{64}\s\s.+$/i.test(line), `Invalid checksum line format: ${line}`);
    }

    const parsed = JSON.parse(fs.readFileSync(first.outJson, "utf8"));
    assert(parsed.generatedAt === fixedNow, "checksums.json generatedAt mismatch.");
    assert(Array.isArray(parsed.entries), "checksums.json entries must be array.");
    assert(parsed.entries.length === 11, "checksums.json entries length mismatch.");

    const manifestEntry = parsed.entries.find((entry) => entry.path === "release/manifest.json");
    assert(Boolean(manifestEntry), "Missing release/manifest.json checksum entry.");
    assert(manifestEntry.sha256 === sha256('{"ok":true}'), "Unexpected checksum for release/manifest.json.");
    const provenanceEntry = parsed.entries.find((entry) => entry.path === "release/provenance.json");
    assert(Boolean(provenanceEntry), "Missing release/provenance.json checksum entry.");
    const signatureEntry = parsed.entries.find((entry) => entry.path === "release/manifest.sig");
    assert(Boolean(signatureEntry), "Missing release/manifest.sig checksum entry.");
    const verificationEntry = parsed.entries.find((entry) => entry.path === "release/signature-verification.json");
    assert(Boolean(verificationEntry), "Missing release/signature-verification.json checksum entry.");
    const installerSmokeEntry = parsed.entries.find((entry) => entry.path === "release/installer-smoke-report.json");
    assert(Boolean(installerSmokeEntry), "Missing release/installer-smoke-report.json checksum entry.");

    assert(
      JSON.stringify(first.entries) === JSON.stringify(second.entries),
      "Release checksum generation is not deterministic."
    );

    console.log("Release checksums test passed.");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
