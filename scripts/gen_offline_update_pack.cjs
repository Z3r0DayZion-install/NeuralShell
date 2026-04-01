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

function normalizeRing(value) {
  const safe = String(value || "").trim().toLowerCase();
  if (safe === "canary" || safe === "standard" || safe === "delayed" || safe === "locked") {
    return safe;
  }
  return "standard";
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const packageJsonPath = toAbs(root, "package.json");
  const privateKeyPath = toAbs(root, String(args.private || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = toAbs(root, String(args.public || "branding/keys/demo_white_label_public.pem"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/update-packs"));

  if (!fs.existsSync(packageJsonPath)) throw new Error("Missing package.json");
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) throw new Error("Missing signing keys");

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = String(args.version || pkg.version || "0.0.0");
  const ring = normalizeRing(args.ring || "canary");
  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const fingerprint = fingerprintPublicKey(publicKeyPem);

  const payload = {
    schema: "neuralshell_offline_update_pack_v1",
    generatedAt: new Date().toISOString(),
    version,
    ring,
    artifacts: [
      "dist-renderer/index.html",
      "src/main.js",
      "scripts/release_truth_verify.cjs",
    ],
    notes: [
      "Offline update packs must verify signature/hash before assignment.",
      "Promotion between rings should be auditable and deliberate.",
    ],
  };

  const hash = crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
  const signature = signPayload(payload, privateKeyPem);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `pack-${version}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "update_pack.signed.json"), {
    schema: "neuralshell_offline_update_pack_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem,
      fingerprint,
    },
  });
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    version,
    ring,
    hash,
    signerFingerprint: fingerprint,
    files: ["update_pack.signed.json", "manifest.json"],
  });

  process.stdout.write(`${path.join(outDir, "update_pack.signed.json")}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}