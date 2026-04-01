#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { signPayload, writeJson, fingerprintPublicKey, stableStringify } = require("./lib/signed_artifacts.cjs");

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

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const privateKeyPath = toAbs(root, String(args.private || "branding/keys/demo_white_label_private.pem"));
  const publicKeyPath = toAbs(root, String(args.public || "branding/keys/demo_white_label_public.pem"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/shift"));
  const inputPath = args.input ? toAbs(root, String(args.input)) : "";

  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    throw new Error("Missing signing keys for shift summary export.");
  }

  const privateKeyPem = fs.readFileSync(privateKeyPath, "utf8");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const signerFingerprint = fingerprintPublicKey(publicKeyPem);

  let payload = {
    shiftId: `shift-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    activeRole: "operator",
    activeOperator: "unassigned",
    queueDepth: 0,
    pendingActions: [],
    handoffNotes: [],
    incidents: [],
    assignedNodes: [],
  };

  if (inputPath && fs.existsSync(inputPath)) {
    payload = {
      ...payload,
      ...JSON.parse(fs.readFileSync(inputPath, "utf8")),
    };
  }

  const hash = crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
  const signature = signPayload(payload, privateKeyPem);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `summary-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "shift_summary.signed.json"), {
    schema: "neuralshell_shift_summary_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem,
      fingerprint: signerFingerprint,
    },
  });
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    hash,
    signerFingerprint,
    files: ["shift_summary.signed.json", "manifest.json"],
  });

  process.stdout.write(`${path.join(outDir, "shift_summary.signed.json")}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}