#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {
  signPayload,
  fingerprintPublicKey,
  writeJson
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

function sanitizeBrandingProfile(raw = {}) {
  const payload = raw && typeof raw === "object" ? raw : {};
  const branding = payload.branding && typeof payload.branding === "object" ? payload.branding : {};
  const policyDefaults = payload.policyDefaults && typeof payload.policyDefaults === "object"
    ? payload.policyDefaults
    : {};
  return {
    schema: "neuralshell_branding_profile_v1",
    profileId: String(payload.profileId || "unnamed-profile").trim(),
    displayName: String(payload.displayName || payload.profileId || "Unnamed Profile").trim(),
    publisherId: String(payload.publisherId || "unknown-publisher").trim(),
    branding: {
      productName: String(branding.productName || "NeuralShell").trim(),
      logoText: String(branding.logoText || branding.productName || "NeuralShell").trim(),
      accentColor: String(branding.accentColor || "#22d3ee").trim(),
      supportUrl: String(branding.supportUrl || "").trim(),
      docsUrl: String(branding.docsUrl || "").trim(),
      installerName: String(branding.installerName || "").trim()
    },
    policyDefaults: {
      allowRemoteBridge: Boolean(policyDefaults.allowRemoteBridge),
      offlineOnly: Boolean(policyDefaults.offlineOnly),
      updateRing: String(policyDefaults.updateRing || "stable").trim().toLowerCase(),
      allowedProviders: Array.isArray(policyDefaults.allowedProviders)
        ? policyDefaults.allowedProviders.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean)
        : []
    }
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const inputPath = path.resolve(root, String(args.input || "config/white_label_profile.json"));
  const privateKeyPath = path.resolve(root, String(args["private-key"] || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = path.resolve(root, String(args["public-key"] || "branding/keys/demo_white_label_public.pem"));
  const outputPath = path.resolve(root, String(args.output || "config/white_label.json"));

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing unsigned profile: ${inputPath}`);
  }
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Missing private key: ${privateKeyPath}`);
  }
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Missing public key: ${publicKeyPath}`);
  }

  const unsignedPayload = sanitizeBrandingProfile(readJson(inputPath));
  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const signature = signPayload(unsignedPayload, privateKeyPem);
  const signerFingerprint = fingerprintPublicKey(publicKeyPem);

  const signed = {
    payload: unsignedPayload,
    signature,
    signer: {
      algorithm: "ECDSA_P256_SHA256",
      publicKeyPem,
      fingerprint: signerFingerprint
    },
    signedAt: new Date().toISOString()
  };
  writeJson(outputPath, signed);

  process.stdout.write(`${outputPath}\n`);
}

if (require.main === module) {
  main();
}
