const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const statusFile = path.join(root, "release", "status.json");
const manifestFile = path.join(root, "release", "manifest.json");
const benchmarkFile = path.join(root, "release", "autonomy-benchmark.json");
const checksumsFile = path.join(root, "release", "checksums.txt");
const checksumsJsonFile = path.join(root, "release", "checksums.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ageMinutes(isoTs) {
  const ts = Date.parse(String(isoTs || ""));
  if (!Number.isFinite(ts)) return Number.POSITIVE_INFINITY;
  return (Date.now() - ts) / (1000 * 60);
}

function assertArtifact(status, key) {
  const ok = Boolean(status.artifacts && status.artifacts[key]);
  assert(ok, `release/status.json indicates missing ${key}`);
}

function main() {
  const strictInstaller = process.argv.includes("--strict-installer");
  assert(fs.existsSync(statusFile), `Missing release status file: ${statusFile}`);
  assert(fs.existsSync(manifestFile), `Missing release manifest file: ${manifestFile}`);
  assert(fs.existsSync(benchmarkFile), `Missing autonomy benchmark file: ${benchmarkFile}`);
  assert(fs.existsSync(checksumsFile), `Missing release checksums file: ${checksumsFile}`);
  assert(fs.existsSync(checksumsJsonFile), `Missing release checksums metadata file: ${checksumsJsonFile}`);
  assert(fs.statSync(checksumsFile).size > 0, `Release checksums file is empty: ${checksumsFile}`);

  const status = readJson(statusFile);
  const manifest = readJson(manifestFile);
  const benchmark = readJson(benchmarkFile);
  const checksums = readJson(checksumsJsonFile);

  assertArtifact(status, "unpackedExe");
  assertArtifact(status, "appAsar");
  assertArtifact(status, "updateYml");
  if (strictInstaller) {
    assertArtifact(status, "installerExe");
  }

  assert(Number(manifest.fileCount) >= 20, "manifest fileCount unexpectedly low.");
  assert(Number(benchmark.percent) >= 80, "benchmark percent below required floor.");
  assert(Array.isArray(checksums.entries), "checksums metadata entries must be an array.");
  assert(checksums.entries.length >= 6, "checksums metadata unexpectedly short.");

  const requiredChecksumPaths = new Set([
    "release/manifest.json",
    "release/status.json",
    "release/autonomy-benchmark.json"
  ]);
  const checksumPaths = new Set(checksums.entries.map((entry) => String(entry.path || "")));
  for (const relPath of requiredChecksumPaths) {
    assert(checksumPaths.has(relPath), `checksums metadata missing required entry: ${relPath}`);
  }

  const statusAge = ageMinutes(status.generatedAt);
  const manifestAge = ageMinutes(manifest.generatedAt);
  const benchmarkAge = ageMinutes(benchmark.generatedAt);
  const checksumsAge = ageMinutes(checksums.generatedAt);
  const maxAgeMin = 120;

  assert(statusAge <= maxAgeMin, `release status is stale (${statusAge.toFixed(1)} min old).`);
  assert(manifestAge <= maxAgeMin, `release manifest is stale (${manifestAge.toFixed(1)} min old).`);
  assert(benchmarkAge <= maxAgeMin, `benchmark report is stale (${benchmarkAge.toFixed(1)} min old).`);
  assert(checksumsAge <= maxAgeMin, `release checksums are stale (${checksumsAge.toFixed(1)} min old).`);

  const expectedProfile = strictInstaller ? "installer+unpacked" : "unpacked-only";
  if (typeof status.profile === "string") {
    assert(
      status.profile === expectedProfile || (!strictInstaller && status.profile === "installer+unpacked"),
      `release status profile mismatch. expected ${strictInstaller ? "installer+unpacked" : "unpacked-only|installer+unpacked"}, got ${status.profile}`
    );
  }

  assert(status.provenance && typeof status.provenance === "object", "release status missing provenance.");
  assert(status.provenance.git && typeof status.provenance.git === "object", "release status missing provenance.git.");
  assert(
    Object.prototype.hasOwnProperty.call(status.provenance.git, "commit"),
    "release status provenance.git missing commit field."
  );
  assert(
    Object.prototype.hasOwnProperty.call(status.provenance.git, "tag"),
    "release status provenance.git missing tag field."
  );
  assert(status.provenance.github && typeof status.provenance.github === "object", "release status missing provenance.github.");

  console.log("Release freshness verification passed.");
  console.log(
    `Mode=${strictInstaller ? "strict-installer" : "default"} Ages(min): status=${statusAge.toFixed(1)} manifest=${manifestAge.toFixed(1)} benchmark=${benchmarkAge.toFixed(1)} checksums=${checksumsAge.toFixed(1)}`
  );
}

main();
