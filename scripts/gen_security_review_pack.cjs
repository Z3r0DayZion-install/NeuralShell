#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeJson } = require("./lib/signed_artifacts.cjs");

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

function hashFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${String(text || "").trim()}\n`, "utf8");
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
  const version = String(args.version || packageJson.version || "0.0.0");
  const outputRoot = toAbs(root, String(args["output-root"] || "release/security-review-pack"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const previousManifestPath = args.previous ? toAbs(root, String(args.previous)) : "";
  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `review-${version}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const inventoryFiles = [
    "package.json",
    "scripts/release_truth_verify.cjs",
    "scripts/verify_airgap_bundle.cjs",
    "scripts/verify_courier_package.cjs",
    "docs/security/PKI_TRUST_FABRIC.md",
    "docs/deployment/AIR_GAPPED_OPERATIONS.md",
  ]
    .map((rel) => path.resolve(root, rel))
    .filter((filePath) => fs.existsSync(filePath));

  const artifactInventory = inventoryFiles.map((filePath) => ({
    path: path.relative(root, filePath).replace(/\\/g, "/"),
    sha256: hashFile(filePath),
  }));

  const topology = {
    deploymentModes: ["local-first", "air-gapped", "sealed-network", "appliance"],
    trustAnchors: ["local_ca", "signed_artifacts", "certificate_revocation"],
    transferBoundaries: ["offline_import_station", "offline_courier_chain"],
  };

  let previousManifest = null;
  if (previousManifestPath && fs.existsSync(previousManifestPath)) {
    previousManifest = JSON.parse(fs.readFileSync(previousManifestPath, "utf8"));
  }
  const delta = {
    previousVersion: previousManifest ? String(previousManifest.version || "") : "",
    currentVersion: version,
    changedArtifacts: artifactInventory.filter((item) => {
      if (!previousManifest || !Array.isArray(previousManifest.artifactInventory)) return true;
      const before = previousManifest.artifactInventory.find((entry) => String(entry.path || "") === String(item.path || ""));
      return !before || String(before.sha256 || "") !== String(item.sha256 || "");
    }),
  };

  const questionnaire = [
    "# Security Questionnaire",
    "",
    `- Product: NeuralShell ${version}`,
    "- Data Residency: Local-only by default",
    "- Air-gap Support: Native, verification-first import/export workflows",
    "- PKI Trust: Local CA issuance + revocation controls",
    "- Offline Transfer: Signed courier package + quarantine gates",
    "- Continuity: Drill engine with evidence artifacts",
  ].join("\n");
  const architecture = [
    "# Architecture One-Pager",
    "",
    "- Local-first runtime with optional bounded relay components.",
    "- Trust fabric enforced via signatures, certificate lifecycle, and revocation checks.",
    "- Operational command modules include AirGap, PKI, Appliance, Courier, Continuity, Procurement.",
    "- Evidence trails are exportable and tied to explicit verification outcomes.",
  ].join("\n");
  const dataFlow = [
    "# Data Flow Declaration",
    "",
    "- Runtime telemetry remains local unless operator exports bundles.",
    "- Import paths require signed artifact verification before activation.",
    "- Outbound courier transfers require sender/receiver metadata and ledger events.",
    "- Procurement packs redact secrets and include explicit artifact inventory hashes.",
  ].join("\n");
  const complianceSummary = [
    "# Compliance Posture Summary",
    "",
    "- Local data control: enforced",
    "- Offline operations: first-class",
    "- Trust revocation: enforced by CRL and trust-chain viewer",
    "- Audit evidence: generated and exportable",
    "- Packaging integrity: signature + checksum verification paths available",
  ].join("\n");
  const faq = [
    "# Procurement FAQ",
    "",
    "Q: Does NeuralShell require cloud connectivity?",
    "A: No. Air-gapped mode supports local operations and controlled transfers.",
    "",
    "Q: How is trust identity managed?",
    "A: Through local CA-issued certificates, lifecycle rotation, and revocation.",
    "",
    "Q: Can review evidence be exported?",
    "A: Yes. Security/procurement packs are generated locally with artifact hashes.",
  ].join("\n");

  writeText(path.join(outDir, "security_questionnaire.md"), questionnaire);
  writeText(path.join(outDir, "architecture_one_pager.md"), architecture);
  writeText(path.join(outDir, "data_flow_declaration.md"), dataFlow);
  writeText(path.join(outDir, "compliance_posture_summary.md"), complianceSummary);
  writeText(path.join(outDir, "procurement_faq.md"), faq);
  writeJson(path.join(outDir, "deployment_topology.json"), topology);
  writeJson(path.join(outDir, "artifact_inventory.json"), artifactInventory);
  writeJson(path.join(outDir, "review_delta.json"), delta);
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    version,
    outDir,
    artifactInventory,
    topology,
    delta,
    files: fs.readdirSync(outDir).sort(),
  });

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
