const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const statusFile = path.join(root, "release", "status.json");
const manifestFile = path.join(root, "release", "manifest.json");
const benchmarkFile = path.join(root, "release", "autonomy-benchmark.json");

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

  const status = readJson(statusFile);
  const manifest = readJson(manifestFile);
  const benchmark = readJson(benchmarkFile);

  assertArtifact(status, "unpackedExe");
  assertArtifact(status, "appAsar");
  assertArtifact(status, "updateYml");
  if (strictInstaller) {
    assertArtifact(status, "installerExe");
  }

  assert(Number(manifest.fileCount) >= 20, "manifest fileCount unexpectedly low.");
  assert(Number(benchmark.percent) >= 80, "benchmark percent below required floor.");

  const statusAge = ageMinutes(status.generatedAt);
  const manifestAge = ageMinutes(manifest.generatedAt);
  const benchmarkAge = ageMinutes(benchmark.generatedAt);
  const maxAgeMin = 120;

  assert(statusAge <= maxAgeMin, `release status is stale (${statusAge.toFixed(1)} min old).`);
  assert(manifestAge <= maxAgeMin, `release manifest is stale (${manifestAge.toFixed(1)} min old).`);
  assert(benchmarkAge <= maxAgeMin, `benchmark report is stale (${benchmarkAge.toFixed(1)} min old).`);

  const expectedProfile = strictInstaller ? "installer+unpacked" : "unpacked-only";
  if (typeof status.profile === "string") {
    assert(
      status.profile === expectedProfile || (!strictInstaller && status.profile === "installer+unpacked"),
      `release status profile mismatch. expected ${strictInstaller ? "installer+unpacked" : "unpacked-only|installer+unpacked"}, got ${status.profile}`
    );
  }

  console.log("Release freshness verification passed.");
  console.log(
    `Mode=${strictInstaller ? "strict-installer" : "default"} Ages(min): status=${statusAge.toFixed(1)} manifest=${manifestAge.toFixed(1)} benchmark=${benchmarkAge.toFixed(1)}`
  );
}

main();
