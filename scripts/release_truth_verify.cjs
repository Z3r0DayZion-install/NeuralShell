#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();

function resolveArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const token = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!token) return fallback;
  return String(token).slice(prefix.length).trim() || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function toAbs(filePath) {
  if (!filePath) return "";
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
}

function readJson(absPath, errors, label) {
  try {
    if (!fs.existsSync(absPath)) {
      errors.push(`${label} is missing: ${absPath}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (err) {
    errors.push(`${label} cannot be parsed: ${err && err.message ? err.message : String(err)}`);
    return null;
  }
}

function existsFileOrDir(relOrAbsPath, errors, label) {
  const abs = toAbs(relOrAbsPath);
  if (!abs || !fs.existsSync(abs)) {
    errors.push(`${label} is missing: ${relOrAbsPath}`);
    return false;
  }
  return true;
}

function safeGit(command) {
  try {
    return execSync(command, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return "";
  }
}

function verifyWorkflowPatterns(errors) {
  const publishPath = path.join(root, ".github", "workflows", "publish.yml");
  const proofPath = path.join(root, ".github", "workflows", "proof-drop-friday.yml");
  const publishText = fs.existsSync(publishPath) ? fs.readFileSync(publishPath, "utf8") : "";
  const proofText = fs.existsSync(proofPath) ? fs.readFileSync(proofPath, "utf8") : "";

  if (!publishText) {
    errors.push("publish workflow is missing.");
  } else {
    if (/if:\s*github\.event_name\s*==\s*'workflow_dispatch'\s*\|\|\s*startsWith\(github\.ref_name,\s*matrix\./.test(publishText)) {
      errors.push("publish workflow still uses matrix context in a job-level if expression.");
    }
  }

  if (!proofText) {
    errors.push("proof-drop workflow is missing.");
  } else {
    if (/if:\s*\$\{\{\s*secrets\./.test(proofText)) {
      errors.push("proof-drop workflow still uses direct secrets.* expressions in if conditions.");
    }
  }
}

function verifyTagCommit(truth, errors) {
  const release = truth && truth.release ? truth.release : {};
  const tag = String(release.tag || "").trim();
  const expectedCommit = String(release.commit || "").trim().toLowerCase();
  if (!tag) {
    errors.push("release.tag is missing in truth file.");
    return;
  }
  if (!expectedCommit) {
    errors.push("release.commit is missing in truth file.");
    return;
  }
  const actualCommit = safeGit(`git rev-parse ${tag}`).toLowerCase();
  if (!actualCommit) {
    errors.push(`Git tag '${tag}' is missing locally.`);
    return;
  }
  if (actualCommit !== expectedCommit) {
    errors.push(`Git tag '${tag}' mismatch. expected=${expectedCommit} actual=${actualCommit}`);
  }
}

function verifyWorkflowWaivers(truth, errors) {
  const workflows = truth && truth.workflows ? truth.workflows : {};
  const broken = Array.isArray(workflows.brokenWorkflowIssues) ? workflows.brokenWorkflowIssues : [];
  const waived = Array.isArray(workflows.waivedBrokenWorkflowIssues) ? workflows.waivedBrokenWorkflowIssues : [];
  const unresolved = broken.filter((issue) => !waived.includes(issue));
  if (unresolved.length) {
    errors.push(`Unwaived workflow issues remain: ${unresolved.join(", ")}`);
  }
}

function verifyTruthAssets(truth, errors) {
  const assets = truth && truth.assets ? truth.assets : {};
  const localReleasePackage = Array.isArray(assets.localReleasePackage) ? assets.localReleasePackage : [];
  if (!localReleasePackage.length) {
    errors.push("assets.localReleasePackage is empty.");
  }
  localReleasePackage.forEach((entry) => existsFileOrDir(entry, errors, "Required release package asset"));
}

function verifyGeneratedArtifacts(truth, errors) {
  const artifacts = truth && truth.generatedArtifacts ? truth.generatedArtifacts : {};
  ["pilotPackDir", "boardPackDir", "boardPackZip", "whiteLabelDir", "screenshotDir"].forEach((key) => {
    if (!artifacts[key]) {
      errors.push(`generatedArtifacts.${key} is missing.`);
      return;
    }
    existsFileOrDir(artifacts[key], errors, `Generated artifact '${key}'`);
  });
}

function verifyScreenshotSet(truth, errors) {
  const artifacts = truth && truth.generatedArtifacts ? truth.generatedArtifacts : {};
  const screenshotDir = artifacts.screenshotDir ? toAbs(artifacts.screenshotDir) : "";
  const screenshots = Array.isArray(truth && truth.screenshots) ? truth.screenshots : [];
  if (!screenshots.length) {
    errors.push("screenshots list is empty.");
    return;
  }
  if (!screenshotDir || !fs.existsSync(screenshotDir)) {
    errors.push(`Screenshot directory is missing: ${artifacts.screenshotDir || "<empty>"}`);
    return;
  }
  screenshots.forEach((name) => {
    const abs = path.join(screenshotDir, String(name || ""));
    if (!fs.existsSync(abs)) {
      errors.push(`Missing screenshot: ${path.join(artifacts.screenshotDir, String(name || ""))}`);
    }
  });
}

function verifyChecklist(errors) {
  existsFileOrDir("docs/release/DOMINATION_DELTA10_TRUTH_CHECKLIST.md", errors, "Release truth checklist");
}

function verifyRemoteReleaseAssets(truth, errors, warnings) {
  if (hasFlag("skip-remote")) {
    warnings.push("Skipped remote release asset verification (--skip-remote).");
    return;
  }
  const release = truth && truth.release ? truth.release : {};
  const tag = String(release.tag || "").trim();
  const expected = Array.isArray(truth && truth.assets && truth.assets.releaseDraftAssets)
    ? truth.assets.releaseDraftAssets
    : [];
  if (!tag || !expected.length) return;

  let raw = "";
  try {
    raw = execSync(`gh release view ${tag} --json assets`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8");
  } catch (err) {
    warnings.push(`Remote asset check skipped (gh release view failed): ${err && err.message ? err.message : String(err)}`);
    return;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    warnings.push(`Remote asset check skipped (invalid gh JSON): ${err && err.message ? err.message : String(err)}`);
    return;
  }
  const names = new Set(Array.isArray(parsed.assets) ? parsed.assets.map((asset) => String(asset.name || "")) : []);
  expected.forEach((assetName) => {
    if (!names.has(assetName)) {
      errors.push(`Release draft asset missing on GitHub release '${tag}': ${assetName}`);
    }
  });
}

function verifyBundleDeterminism(errors) {
  const expectedPath = path.join(root, "EXPECTED_DETERMINISM_HASH.json");
  const expectedData = readJson(expectedPath, [], "Expected determinism JSON");
  if (!expectedData) {
    errors.push("EXPECTED_DETERMINISM_HASH.json is missing or invalid at root.");
    return;
  }

  const expectedHash = expectedData.expected_bundle_hash;
  if (!expectedHash) {
    errors.push("EXPECTED_DETERMINISM_HASH.json is missing 'expected_bundle_hash'.");
    return;
  }

  const manifestPath = path.join(root, "dist", "SHA256SUMS.txt");
  if (!fs.existsSync(manifestPath)) {
    errors.push("Proof bundle manifest is missing: dist/SHA256SUMS.txt. Please run 'npm run proof:bundle' first.");
    return;
  }

  const crypto = require("crypto");
  const data = fs.readFileSync(manifestPath);
  const actualHash = crypto.createHash("sha256").update(data).digest("hex");

  if (actualHash !== expectedHash) {
    errors.push(`Bundle determinism hash mismatch! expected=${expectedHash} actual=${actualHash}`);
  }
}

function main() {
  const errors = [];
  const warnings = [];
  const truthPath = resolveArg("truth", "release/release-package/domination-delta10/release-truth.json");
  const truthAbs = toAbs(truthPath);
  const truth = readJson(truthAbs, errors, "Release truth JSON");

  verifyChecklist(errors);
  verifyWorkflowPatterns(errors);
  verifyBundleDeterminism(errors);

  if (truth) {
    verifyTagCommit(truth, errors);
    verifyWorkflowWaivers(truth, errors);
    verifyTruthAssets(truth, errors);
    verifyGeneratedArtifacts(truth, errors);
    verifyScreenshotSet(truth, errors);
    verifyRemoteReleaseAssets(truth, errors, warnings);
  }

  if (warnings.length) {
    warnings.forEach((msg) => console.warn(`[release-truth] WARN: ${msg}`));
  }

  if (errors.length) {
    errors.forEach((msg) => console.error(`[release-truth] FAIL: ${msg}`));
    console.error(`[release-truth] STATUS: FAIL (${errors.length} issue${errors.length === 1 ? "" : "s"})`);
    process.exit(1);
  }

  console.log(`[release-truth] STATUS: PASS`);
}

main();
