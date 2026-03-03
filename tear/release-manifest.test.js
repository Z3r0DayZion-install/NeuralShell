const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { generateManifest } = require("../scripts/release-manifest");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function writeFile(baseDir, relPath, contents) {
  const filePath = path.join(baseDir, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

async function run() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-release-manifest-"));
  try {
    writeFile(
      fixtureRoot,
      "package.json",
      JSON.stringify({ name: "fixture", version: "0.0.1" }, null, 2)
    );
    writeFile(fixtureRoot, "dist/zz-last.txt", "z");
    writeFile(fixtureRoot, "dist/a-first.txt", "a");
    writeFile(fixtureRoot, "dist/win-unpacked/NeuralShell.exe", "exe");
    writeFile(fixtureRoot, "dist/win-unpacked/resources/app.asar", "asar");
    writeFile(fixtureRoot, "dist/win-unpacked/resources/app-update.yml", "update");
    writeFile(fixtureRoot, "dist/NeuralShell Setup 5.9.1.exe", "installer");

    const outFile = path.join(fixtureRoot, "release", "manifest.json");
    const fixedNow = "2026-03-03T00:00:00.000Z";
    const first = await generateManifest({
      rootDir: fixtureRoot,
      distDir: path.join(fixtureRoot, "dist"),
      outFile,
      now: () => fixedNow
    });
    const second = await generateManifest({
      rootDir: fixtureRoot,
      distDir: path.join(fixtureRoot, "dist"),
      outFile,
      now: () => fixedNow
    });

    assert(fs.existsSync(outFile), "Manifest output file was not created.");
    assert(first.manifest.generatedAt === fixedNow, "Manifest generatedAt mismatch.");
    assert(first.manifest.version === "5.9.1", "Installer version inference failed.");
    assert(first.manifest.fileCount === first.manifest.files.length, "fileCount does not match files length.");
    assert(first.manifest.fileCount >= 6, "Manifest file count unexpectedly low.");

    const paths = first.manifest.files.map((entry) => entry.path);
    const sortedPaths = [...paths].sort();
    assert(JSON.stringify(paths) === JSON.stringify(sortedPaths), "Manifest paths are not sorted deterministically.");

    const aFirst = first.manifest.files.find((entry) => entry.path === "dist/a-first.txt");
    assert(Boolean(aFirst), "Missing expected dist/a-first.txt entry.");
    assert(aFirst.bytes === 1, "Unexpected byte count for dist/a-first.txt.");
    assert(aFirst.sha256 === sha256("a"), "Unexpected sha256 for dist/a-first.txt.");

    for (const entry of first.manifest.files) {
      assert(typeof entry.path === "string" && entry.path.length > 0, "Manifest entry path missing.");
      assert(Number.isFinite(entry.bytes) && entry.bytes >= 0, "Manifest entry bytes invalid.");
      assert(typeof entry.sha256 === "string" && /^[a-f0-9]{64}$/i.test(entry.sha256), "Manifest entry sha256 invalid.");
    }

    assert(
      JSON.stringify(first.manifest.files) === JSON.stringify(second.manifest.files),
      "Manifest generation is not deterministic for file entries."
    );

    console.log("Release manifest test passed.");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
