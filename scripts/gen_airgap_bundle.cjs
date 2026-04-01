#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  signPayload,
  stableStringify,
  fingerprintPublicKey,
  writeJson,
} = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || "").trim();
    if (!token.startsWith("--")) continue;
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

function toAbs(root, relPath) {
  return path.isAbsolute(relPath) ? relPath : path.resolve(root, relPath);
}

function asRel(root, absPath) {
  return path.relative(root, absPath).replace(/\\/g, "/");
}

function hashFile(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hashStable(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function toRecord(root, filePath, artifactType, direction, label) {
  if (!fs.existsSync(filePath)) return null;
  return {
    artifactId: `${artifactType}-${path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    artifactType,
    direction,
    label,
    relativePath: asRel(root, filePath),
    sha256: hashFile(filePath),
    verified: true,
  };
}

function latestDir(rootPath) {
  if (!fs.existsSync(rootPath)) return "";
  const dirs = fs.readdirSync(rootPath)
    .map((name) => path.join(rootPath, name))
    .filter((entry) => fs.existsSync(entry) && fs.statSync(entry).isDirectory())
    .sort((a, b) => b.localeCompare(a));
  return dirs[0] || "";
}

function buildPayload(root, version, generatedAt) {
  const installers = [];
  const updatePacks = [];
  const providerPackages = [];
  const docsBundles = [];
  const trustBundles = [];

  const pkgInstaller = path.resolve(root, `dist/NeuralShell Setup ${version}.exe`);
  const portableExe = path.resolve(root, "dist/win-unpacked/NeuralShell.exe");
  [toRecord(root, pkgInstaller, "installer", "import", "Offline installer"), toRecord(root, portableExe, "installer", "import", "Portable runtime executable")]
    .filter(Boolean)
    .forEach((entry) => installers.push(entry));

  const latestUpdatePackDir = latestDir(path.resolve(root, "release/update-packs"));
  const updatePackSigned = latestUpdatePackDir ? path.join(latestUpdatePackDir, "update_pack.signed.json") : "";
  const updatePackManifest = latestUpdatePackDir ? path.join(latestUpdatePackDir, "manifest.json") : "";
  [toRecord(root, updatePackSigned, "update_pack", "import", "Signed update pack"), toRecord(root, updatePackManifest, "update_pack", "import", "Update pack manifest")]
    .filter(Boolean)
    .forEach((entry) => updatePacks.push(entry));

  const providerPackageCandidates = [
    path.resolve(root, "vendor/omega-core/package.json"),
    path.resolve(root, "vendor/omega-core/index.js"),
    path.resolve(root, "src/bridgeProviderCatalog.js"),
  ];
  providerPackageCandidates
    .map((filePath, index) => toRecord(root, filePath, "provider_package", "import", `Provider package artifact ${index + 1}`))
    .filter(Boolean)
    .forEach((entry) => providerPackages.push(entry));

  const docsCandidates = [
    path.resolve(root, "docs/index.html"),
    path.resolve(root, "docs/nav.json"),
    path.resolve(root, "docs/deployment/AIR_GAPPED_OPERATIONS.md"),
    path.resolve(root, "docs/runtime/OFFLINE_UPDATE_PACKS.md"),
    path.resolve(root, "docs/runtime/BUNDLE_AUTHENTICITY_AND_KEY_GOVERNANCE.md"),
  ];
  docsCandidates
    .map((filePath, index) => toRecord(root, filePath, "docs_bundle", "import", `Offline docs artifact ${index + 1}`))
    .filter(Boolean)
    .forEach((entry) => docsBundles.push(entry));

  const trustCandidates = [
    path.resolve(root, "config/white_label_trusted_publishers.json"),
    path.resolve(root, "branding/keys/demo_white_label_public.pem"),
    path.resolve(root, "RELEASE_CERT.txt"),
  ];
  trustCandidates
    .map((filePath, index) => toRecord(root, filePath, "trust_bundle", "import", `Trust anchor artifact ${index + 1}`))
    .filter(Boolean)
    .forEach((entry) => trustBundles.push(entry));

  const payload = {
    schema: "neuralshell_airgap_bundle_v1",
    bundleVersion: version,
    generatedAt,
    mode: {
      airGapLocked: true,
      allowExternalNetwork: false,
      transferBoundary: "manual-import-export-station",
    },
    importStationChecklist: [
      "Validate transfer media serial and operator handoff signature.",
      "Run SHA256 and signature verification on every inbound artifact.",
      "Quarantine unverified artifacts until dual-operator review completes.",
      "Activate only artifacts that pass verification and policy checks.",
    ],
    exportStationChecklist: [
      "Tag outbound package with courier class and environment scope.",
      "Sign export manifest and include sender/receiver approval block.",
      "Record transfer in offline ledger before physical movement.",
      "Verify destination receipt hash before release closeout.",
    ],
    offlinePackages: {
      installers,
      updatePacks,
      providerPackages,
      docsBundles,
      trustBundles,
    },
  };

  const reproducibilityDigest = hashStable({
    ...payload,
    generatedAt: "normalized",
  });

  return {
    ...payload,
    reproducibilityDigest,
  };
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  const pkg = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
  const version = String(args.version || pkg.version || "0.0.0");
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const outputRoot = toAbs(root, String(args["output-root"] || "release/airgap"));
  const privateKeyPath = toAbs(root, String(args.private || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = toAbs(root, String(args.public || "branding/keys/demo_white_label_public.pem"));

  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    throw new Error("Missing signing keys for air-gap bundle generation.");
  }

  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const payload = buildPayload(root, version, generatedAt);
  const hash = hashStable(payload);
  const signature = signPayload(payload, privateKeyPem);
  const signerFingerprint = fingerprintPublicKey(publicKeyPem);

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `bundle-${version}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const signedBundle = {
    schema: "neuralshell_airgap_bundle_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem,
      fingerprint: signerFingerprint,
    },
  };

  writeJson(path.join(outDir, "airgap_bundle.signed.json"), signedBundle);
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    version,
    reproducibilityDigest: payload.reproducibilityDigest,
    signerFingerprint,
    hash,
    files: ["airgap_bundle.signed.json", "manifest.json"],
  });

  process.stdout.write(`${path.join(outDir, "airgap_bundle.signed.json")}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
