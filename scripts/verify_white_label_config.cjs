#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {
  verifyPayload,
  fingerprintPublicKey
} = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token) continue;
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function verifySignedBrandingConfig(signedConfigPath, trustedPublishersPath) {
  const signed = readJson(signedConfigPath);
  const trusted = readJson(trustedPublishersPath);
  const payload = signed && signed.payload && typeof signed.payload === "object"
    ? signed.payload
    : null;
  const signature = String(signed && signed.signature ? signed.signature : "");
  const signer = signed && signed.signer && typeof signed.signer === "object"
    ? signed.signer
    : {};
  const publicKeyPem = String(signer.publicKeyPem || "");

  if (!payload || !signature || !publicKeyPem) {
    return {
      ok: false,
      reason: "missing_payload_signature_or_signer"
    };
  }

  const verified = verifyPayload(payload, signature, publicKeyPem);
  if (!verified) {
    return {
      ok: false,
      reason: "signature_invalid"
    };
  }

  const signerFingerprint = fingerprintPublicKey(publicKeyPem);
  const trustedFingerprints = new Set(
    (Array.isArray(trusted && trusted.publishers) ? trusted.publishers : [])
      .map((entry) => String(entry && entry.fingerprint ? entry.fingerprint : "").trim())
      .filter(Boolean)
  );
  if (trustedFingerprints.size > 0 && !trustedFingerprints.has(signerFingerprint)) {
    return {
      ok: false,
      reason: "signer_not_trusted",
      signerFingerprint
    };
  }

  return {
    ok: true,
    profileId: String(payload.profileId || ""),
    displayName: String(payload.displayName || ""),
    publisherId: String(payload.publisherId || ""),
    signerFingerprint
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const positionalConfig = Array.isArray(args._) && args._[0] ? String(args._[0]) : "";
  const signedConfigPath = path.resolve(root, String(args.config || positionalConfig || "config/white_label.json"));
  const trustedPublishersPath = path.resolve(
    root,
    String(args.trusted || "config/white_label_trusted_publishers.json")
  );
  if (!fs.existsSync(signedConfigPath)) {
    throw new Error(`Missing signed config: ${signedConfigPath}`);
  }
  if (!fs.existsSync(trustedPublishersPath)) {
    throw new Error(`Missing trusted publishers file: ${trustedPublishersPath}`);
  }
  const result = verifySignedBrandingConfig(signedConfigPath, trustedPublishersPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  verifySignedBrandingConfig
};
