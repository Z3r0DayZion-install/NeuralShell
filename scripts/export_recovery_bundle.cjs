#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  signPayload,
  writeJson,
  stableStringify,
  fingerprintPublicKey,
} = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toAbs(root, rel) {
  return path.isAbsolute(rel) ? rel : path.resolve(root, rel);
}

function readJsonMaybe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readTextMaybe(filePath, fallback = "") {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function sanitize(value, includeSecrets) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((entry) => sanitize(entry, includeSecrets));
  if (typeof value !== "object") return value;
  const out = {};
  Object.entries(value).forEach(([key, entry]) => {
    const lower = String(key || "").toLowerCase();
    if (!includeSecrets && (lower.includes("secret") || lower.includes("token") || lower.includes("password") || lower.includes("passphrase") || lower.includes("apikey"))) {
      out[key] = "[excluded]";
      return;
    }
    out[key] = sanitize(entry, includeSecrets);
  });
  return out;
}

function collectBundleData(root, includeSecrets) {
  const policyProfilesDir = toAbs(root, "config/policy_profiles");
  const policyProfiles = fs.existsSync(policyProfilesDir)
    ? fs.readdirSync(policyProfilesDir).filter((name) => name.endsWith(".json")).map((name) => ({
        file: name,
        payload: sanitize(readJsonMaybe(path.join(policyProfilesDir, name), {}), includeSecrets),
      }))
    : [];

  const nodeChainRules = sanitize(readJsonMaybe(toAbs(root, "runtime/nodechain/rules/starter_rules.json"), {}), includeSecrets);
  const runtimeSnapshots = sanitize(readJsonMaybe(toAbs(root, "proof/latest/runtime/config.json"), {}), includeSecrets);
  const operatorLayouts = {
    onboarding: sanitize(readJsonMaybe(toAbs(root, "src/renderer/src/config/onboarding_steps.json"), []), includeSecrets),
    firstBoot: sanitize(readJsonMaybe(toAbs(root, "src/renderer/src/config/first_boot_steps.json"), []), includeSecrets),
  };
  const releaseTruth = sanitize(readJsonMaybe(toAbs(root, "release/release-package/domination-delta10/release-truth.json"), {}), includeSecrets);
  const marketplaceReceipts = sanitize(readJsonMaybe(toAbs(root, "agents/reputation/install_history.json"), []), includeSecrets);
  const fleetConfig = {
    nodeModel: sanitize(readTextMaybe(toAbs(root, "fleet/models/nodeBundle.ts"), ""), includeSecrets),
    importerModel: sanitize(readTextMaybe(toAbs(root, "fleet/importers/nodeBundleImporter.ts"), ""), includeSecrets),
  };
  const analyticsBundle = sanitize(readJsonMaybe(toAbs(root, "analytics/board/sample_metrics_bundle.json"), {}), includeSecrets);

  return {
    schema: "neuralshell_recovery_bundle_v1",
    exportedAt: new Date().toISOString(),
    includeSecrets,
    scopes: {
      policyProfiles,
      nodeChainRules,
      runtimeSnapshots,
      operatorLayouts,
      releaseTruth,
      marketplaceReceipts,
      fleetConfig,
      analyticsBundle,
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const includeSecrets = args["include-secrets"] === "1";

  const privateKeyPath = toAbs(root, String(args.private || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = toAbs(root, String(args.public || "branding/keys/demo_white_label_public.pem"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/recovery"));

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Missing private key: ${privateKeyPath}`);
  }
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Missing public key: ${publicKeyPath}`);
  }

  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");

  const payload = collectBundleData(root, includeSecrets);
  const hash = crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
  const signature = signPayload(payload, privateKeyPem);
  const signerFingerprint = fingerprintPublicKey(publicKeyPem);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `bundle-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const signedBundle = {
    schema: "neuralshell_recovery_bundle_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem,
      fingerprint: signerFingerprint,
    },
  };

  writeJson(path.join(outDir, "recovery_bundle.signed.json"), signedBundle);
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    includeSecrets,
    hash,
    signerFingerprint,
    files: ["recovery_bundle.signed.json", "manifest.json"],
  });

  process.stdout.write(`${path.join(outDir, "recovery_bundle.signed.json")}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}