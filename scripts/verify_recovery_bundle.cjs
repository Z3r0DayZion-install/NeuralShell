#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { verifyPayload, stableStringify } = require("./lib/signed_artifacts.cjs");

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

function resolveBundlePath(root, args) {
  const positional = Array.isArray(args._) && args._[0] ? String(args._[0]) : "";
  const direct = String(args.bundle || positional || "").trim();
  if (direct) return path.isAbsolute(direct) ? direct : path.resolve(root, direct);

  const recoveryRoot = path.resolve(root, "release/recovery");
  if (!fs.existsSync(recoveryRoot)) return "";
  const dirs = fs.readdirSync(recoveryRoot)
    .map((name) => path.join(recoveryRoot, name))
    .filter((entry) => fs.existsSync(entry) && fs.statSync(entry).isDirectory())
    .sort((a, b) => b.localeCompare(a));
  for (const dir of dirs) {
    const candidate = path.join(dir, "recovery_bundle.signed.json");
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const bundlePath = resolveBundlePath(root, args);
  if (!bundlePath) {
    throw new Error("No recovery bundle found. Provide --bundle <path>.");
  }
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing recovery bundle: ${bundlePath}`);
  }

  const signed = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const payload = signed && signed.payload && typeof signed.payload === "object" ? signed.payload : null;
  const signature = String(signed && signed.signature ? signed.signature : "");
  const publicKeyPem = String(signed && signed.signer && signed.signer.publicKeyPem ? signed.signer.publicKeyPem : "");
  const hash = String(signed && signed.hash ? signed.hash : "").trim().toLowerCase();

  const computedHash = payload
    ? crypto.createHash("sha256").update(stableStringify(payload)).digest("hex")
    : "";
  const hashValid = Boolean(hash) && hash === computedHash;
  const signatureValid = Boolean(payload && signature && publicKeyPem) && verifyPayload(payload, signature, publicKeyPem);

  const result = {
    ok: hashValid && signatureValid,
    bundlePath,
    hashValid,
    signatureValid,
    hash,
    computedHash,
    scopeKeys: payload && payload.scopes && typeof payload.scopes === "object"
      ? Object.keys(payload.scopes).sort()
      : [],
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}