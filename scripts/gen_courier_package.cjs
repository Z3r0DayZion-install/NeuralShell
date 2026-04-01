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

function hashBytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function hashText(text) {
  return hashBytes(Buffer.from(String(text || ""), "utf8"));
}

function computeManifestRoot(artifacts) {
  const leaves = (Array.isArray(artifacts) ? artifacts : []).map((artifact) => hashText(stableStringify(artifact)));
  if (!leaves.length) return hashText("empty");
  let layer = leaves.slice();
  while (layer.length > 1) {
    const next = [];
    for (let index = 0; index < layer.length; index += 2) {
      const left = layer[index];
      const right = layer[index + 1] || left;
      next.push(hashText(`${left}:${right}`));
    }
    layer = next;
  }
  return layer[0];
}

function asClassLabel(value) {
  const safe = String(value || "").trim().toLowerCase();
  if (safe === "standard" || safe === "sensitive" || safe === "sealed" || safe === "emergency") return safe;
  return "standard";
}

function collectArtifacts(root, inputArg) {
  const candidates = String(inputArg || "")
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  const fallback = [
    "release/security-pass.json",
    "release/release-gate.json",
    "docs/runtime/OFFLINE_UPDATE_PACKS.md",
  ];
  const files = (candidates.length ? candidates : fallback)
    .map((entry) => toAbs(root, entry))
    .filter((absPath) => fs.existsSync(absPath) && fs.statSync(absPath).isFile());
  return files.map((absPath) => {
    const bytes = fs.readFileSync(absPath);
    return {
      artifactId: path.basename(absPath).replace(/[^a-zA-Z0-9._-]/g, "_"),
      label: path.basename(absPath),
      relativePath: path.relative(root, absPath).replace(/\\/g, "/"),
      sha256: hashBytes(bytes),
      sizeBytes: bytes.length,
    };
  });
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const sender = String(args.sender || "Ops-Station-A");
  const receiver = String(args.receiver || "Ops-Station-B");
  const courierClass = asClassLabel(args.class || "standard");
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const outputRoot = toAbs(root, String(args["output-root"] || "release/courier"));
  const privateKeyPath = toAbs(root, String(args.private || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = toAbs(root, String(args.public || "branding/keys/demo_white_label_public.pem"));

  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    throw new Error("Missing signing keys for courier package.");
  }

  const artifacts = collectArtifacts(root, args.input || "");
  if (!artifacts.length) {
    throw new Error("No artifact files found for courier package.");
  }

  const payload = {
    schema: "neuralshell_offline_courier_package_v1",
    packageId: `courier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedAt,
    courierClass,
    sender,
    receiver,
    quarantineRequired: true,
    artifacts,
    manifestRootHash: computeManifestRoot(artifacts),
    handoffSignoff: {
      senderSignedAt: generatedAt,
      receiverSignedAt: "",
    },
  };

  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const hash = hashText(stableStringify(payload));
  const signature = signPayload(payload, privateKeyPem);
  const fingerprint = fingerprintPublicKey(publicKeyPem);

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `courier-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "courier_package.signed.json"), {
    schema: "neuralshell_offline_courier_package_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem,
      fingerprint,
    },
  });
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    packageId: payload.packageId,
    courierClass,
    sender,
    receiver,
    manifestRootHash: payload.manifestRootHash,
    files: ["courier_package.signed.json", "manifest.json"],
  });

  process.stdout.write(`${path.join(outDir, "courier_package.signed.json")}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
