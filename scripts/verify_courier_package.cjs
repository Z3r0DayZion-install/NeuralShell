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
  const base = path.resolve(root, "release/courier");
  if (!fs.existsSync(base)) return "";
  const dirs = fs.readdirSync(base)
    .map((name) => path.join(base, name))
    .filter((entry) => fs.existsSync(entry) && fs.statSync(entry).isDirectory())
    .sort((a, b) => b.localeCompare(a));
  for (const dir of dirs) {
    const candidate = path.join(dir, "courier_package.signed.json");
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function hashText(text) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
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

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const bundlePath = resolveBundlePath(root, args);
  if (!bundlePath) {
    throw new Error("No courier bundle found. Provide --bundle <path>.");
  }
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing courier bundle: ${bundlePath}`);
  }

  const signed = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const payload = signed && signed.payload && typeof signed.payload === "object" ? signed.payload : null;
  const hash = String(signed && signed.hash ? signed.hash : "").trim().toLowerCase();
  const signature = String(signed && signed.signature ? signed.signature : "");
  const publicKeyPem = String(signed && signed.signer && signed.signer.publicKeyPem ? signed.signer.publicKeyPem : "");

  const computedHash = payload ? hashText(stableStringify(payload)) : "";
  const hashValid = Boolean(hash) && hash === computedHash;
  const signatureValid = Boolean(payload && signature && publicKeyPem) && verifyPayload(payload, signature, publicKeyPem);
  const artifacts = payload && Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const manifestRoot = payload ? String(payload.manifestRootHash || "") : "";
  const computedRoot = computeManifestRoot(artifacts);
  const manifestRootValid = Boolean(manifestRoot) && manifestRoot === computedRoot;
  const quarantineRequired = Boolean(payload && payload.quarantineRequired === true);

  const result = {
    ok: hashValid && signatureValid && manifestRootValid && quarantineRequired,
    bundlePath,
    hashValid,
    signatureValid,
    manifestRootValid,
    quarantineRequired,
    artifactCount: artifacts.length,
    courierClass: String(payload && payload.courierClass ? payload.courierClass : "unknown"),
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
