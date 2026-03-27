#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { verifySignedBrandingConfig } = require("./verify_white_label_config.cjs");
const { readJson, writeJson } = require("./lib/signed_artifacts.cjs");

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

function toSafeSlug(value, fallback = "profile") {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

function enforceCapabilitySafeDefaults(raw = {}) {
  const payload = raw && typeof raw === "object" ? raw : {};
  const policyDefaults = payload.policyDefaults && typeof payload.policyDefaults === "object"
    ? payload.policyDefaults
    : {};
  return {
    profileId: String(payload.profileId || "unknown-profile"),
    displayName: String(payload.displayName || "Unknown Profile"),
    publisherId: String(payload.publisherId || ""),
    branding: {
      productName: String(payload.branding && payload.branding.productName ? payload.branding.productName : "NeuralShell"),
      logoText: String(payload.branding && payload.branding.logoText ? payload.branding.logoText : "NeuralShell"),
      accentColor: String(payload.branding && payload.branding.accentColor ? payload.branding.accentColor : "#22d3ee"),
      supportUrl: String(payload.branding && payload.branding.supportUrl ? payload.branding.supportUrl : ""),
      docsUrl: String(payload.branding && payload.branding.docsUrl ? payload.branding.docsUrl : ""),
      installerName: String(payload.branding && payload.branding.installerName ? payload.branding.installerName : "NeuralShell")
    },
    policyDefaults: {
      allowRemoteBridge: Boolean(policyDefaults.allowRemoteBridge),
      offlineOnly: Boolean(policyDefaults.offlineOnly),
      updateRing: String(policyDefaults.updateRing || "stable").toLowerCase(),
      allowedProviders: Array.isArray(policyDefaults.allowedProviders)
        ? policyDefaults.allowedProviders.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean)
        : ["ollama"]
    },
    // These controls stay hard-enforced regardless of branding.
    securityGuardrails: {
      canBypassProofing: false,
      canBypassPolicySuite: false,
      canBypassAuditLog: false
    }
  };
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, String(content || ""), "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const signedConfigPath = path.resolve(root, String(args.config || "config/white_label.json"));
  const trustedPublishersPath = path.resolve(
    root,
    String(args.trusted || "config/white_label_trusted_publishers.json")
  );
  const outputRoot = path.resolve(root, String(args["output-root"] || "release/white-label"));

  if (!fs.existsSync(signedConfigPath)) {
    throw new Error(`Missing signed config: ${signedConfigPath}`);
  }
  if (!fs.existsSync(trustedPublishersPath)) {
    throw new Error(`Missing trusted publishers file: ${trustedPublishersPath}`);
  }

  const verification = verifySignedBrandingConfig(signedConfigPath, trustedPublishersPath);
  if (!verification.ok) {
    throw new Error(`White-label config verification failed: ${verification.reason}`);
  }

  const signed = readJson(signedConfigPath);
  const safePayload = enforceCapabilitySafeDefaults(signed.payload);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const profileSlug = toSafeSlug(safePayload.profileId, "profile");
  const outDir = path.join(outputRoot, `${profileSlug}-${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const runtimeConfig = {
    schema: "neuralshell_white_label_runtime_v1",
    generatedAt: new Date().toISOString(),
    sourceConfig: path.relative(root, signedConfigPath),
    profile: safePayload
  };
  const proofRecord = {
    event: "white_label_build_generated",
    generatedAt: new Date().toISOString(),
    profileId: safePayload.profileId,
    displayName: safePayload.displayName,
    signerFingerprint: verification.signerFingerprint,
    publisherId: safePayload.publisherId,
    policyDefaults: safePayload.policyDefaults
  };
  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir: outDir,
    profileId: safePayload.profileId,
    displayName: safePayload.displayName,
    signerFingerprint: verification.signerFingerprint,
    files: [
      "branding/signed_profile.json",
      "branding/runtime_profile.json",
      "config/white_label.runtime.json",
      "proof/branding_profile_proof.json",
      "README.md"
    ]
  };

  writeJson(path.join(outDir, "branding", "signed_profile.json"), signed);
  writeJson(path.join(outDir, "branding", "runtime_profile.json"), safePayload);
  writeJson(path.join(outDir, "config", "white_label.runtime.json"), runtimeConfig);
  writeJson(path.join(outDir, "proof", "branding_profile_proof.json"), proofRecord);
  writeJson(path.join(outDir, "manifest.json"), manifest);
  writeText(
    path.join(outDir, "README.md"),
    [
      `# White-Label Build Artifact: ${safePayload.displayName}`,
      "",
      `- Profile ID: ${safePayload.profileId}`,
      `- Signer Fingerprint: ${verification.signerFingerprint}`,
      `- Installer Name: ${safePayload.branding.installerName || "NeuralShell"}`,
      "- Security policy behavior remains enforced and cannot be bypassed by branding fields.",
      "",
      "## Usage",
      "1. Review `config/white_label.runtime.json`.",
      "2. Feed runtime profile into your packaging workflow.",
      "3. Attach `proof/branding_profile_proof.json` to support or compliance bundles."
    ].join("\n")
  );

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  main();
}
