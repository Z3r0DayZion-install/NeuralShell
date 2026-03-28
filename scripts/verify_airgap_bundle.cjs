#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { verifyPayload, stableStringify } = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || "").trim();
    if (!token) continue;
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      index += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function resolveBundlePath(root, args) {
  const direct = String(args.bundle || (Array.isArray(args._) && args._[0] ? args._[0] : "")).trim();
  if (direct) return path.isAbsolute(direct) ? direct : path.resolve(root, direct);

  const base = path.resolve(root, "release/airgap");
  if (!fs.existsSync(base)) return "";
  const dirs = fs.readdirSync(base)
    .map((name) => path.join(base, name))
    .filter((entry) => fs.existsSync(entry) && fs.statSync(entry).isDirectory())
    .sort((a, b) => b.localeCompare(a));
  for (const dir of dirs) {
    const candidate = path.join(dir, "airgap_bundle.signed.json");
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function hashStable(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function checkArtifacts(payload) {
  const issues = [];
  const packages = payload && payload.offlinePackages && typeof payload.offlinePackages === "object"
    ? payload.offlinePackages
    : {};
  const all = []
    .concat(Array.isArray(packages.installers) ? packages.installers : [])
    .concat(Array.isArray(packages.updatePacks) ? packages.updatePacks : [])
    .concat(Array.isArray(packages.providerPackages) ? packages.providerPackages : [])
    .concat(Array.isArray(packages.docsBundles) ? packages.docsBundles : [])
    .concat(Array.isArray(packages.trustBundles) ? packages.trustBundles : []);

  all.forEach((artifact, index) => {
    if (!artifact || typeof artifact !== "object") {
      issues.push(`artifact[${index}] is not an object`);
      return;
    }
    if (!String(artifact.sha256 || "").trim()) {
      issues.push(`artifact[${index}] missing sha256`);
    }
    if (!String(artifact.relativePath || "").trim()) {
      issues.push(`artifact[${index}] missing relativePath`);
    }
    if (artifact.verified !== true) {
      issues.push(`artifact[${index}] not verified`);
    }
  });
  return {
    count: all.length,
    issues,
  };
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const bundlePath = resolveBundlePath(root, args);
  if (!bundlePath) {
    throw new Error("No air-gap bundle found. Provide --bundle <path>.");
  }
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing bundle: ${bundlePath}`);
  }

  const signed = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const payload = signed && signed.payload && typeof signed.payload === "object" ? signed.payload : null;
  const hash = String(signed && signed.hash ? signed.hash : "").trim().toLowerCase();
  const signature = String(signed && signed.signature ? signed.signature : "");
  const publicKeyPem = String(signed && signed.signer && signed.signer.publicKeyPem ? signed.signer.publicKeyPem : "");
  const computedHash = payload ? hashStable(payload) : "";
  const hashValid = Boolean(hash) && hash === computedHash;
  const signatureValid = Boolean(payload && signature && publicKeyPem) && verifyPayload(payload, signature, publicKeyPem);

  const modeValid = Boolean(
    payload
    && payload.mode
    && payload.mode.airGapLocked === true
    && payload.mode.allowExternalNetwork === false
  );
  const checklistsValid = Boolean(
    payload
    && Array.isArray(payload.importStationChecklist)
    && payload.importStationChecklist.length > 0
    && Array.isArray(payload.exportStationChecklist)
    && payload.exportStationChecklist.length > 0
  );
  const artifacts = checkArtifacts(payload || {});
  const ok = hashValid && signatureValid && modeValid && checklistsValid && artifacts.issues.length === 0;

  const result = {
    ok,
    bundlePath,
    hashValid,
    signatureValid,
    modeValid,
    checklistsValid,
    artifactsChecked: artifacts.count,
    reproducibilityDigest: String(payload && payload.reproducibilityDigest ? payload.reproducibilityDigest : ""),
    issues: artifacts.issues,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!ok) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
