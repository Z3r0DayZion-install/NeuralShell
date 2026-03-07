const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { runAstGate } = require("@neural/omega-core/ci/ast_gate");
const { deterministicStringify } = require("../../scripts/_omega_utils");

/**
 * NeuralShell Workstation Validator (Empire Control Plane)
 * Scans neighboring directories for OMEGA Core compliance.
 */

const EXPECTED_OMEGA_VERSION = "1.0.0-OMEGA";

// Hardcoded hash of the canonical omega-core package.json to detect shadow packages
function getCanonicalOmegaHash() {
  const canonicalCandidates = [
    path.join(__dirname, "../../../../omega-core/package.json"),
    path.join(__dirname, "../../vendor/omega-core/package.json")
  ];
  for (const canonicalPath of canonicalCandidates) {
    if (fs.existsSync(canonicalPath)) {
      return crypto
        .createHash("sha256")
        .update(fs.readFileSync(canonicalPath))
        .digest("hex");
    }
  }
  return "MISSING_CANONICAL";
}

function _computeModuleHash(dir) {
  const hash = crypto.createHash("sha256");
  const srcPath = path.join(dir, "src");
  if (fs.existsSync(srcPath)) {
    const files = fs.readdirSync(srcPath);
    files.sort().forEach((f) => {
      const p = path.join(srcPath, f);
      if (!fs.statSync(p).isDirectory()) {
        hash.update(fs.readFileSync(p));
      }
    });
  }
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    hash.update(fs.readFileSync(pkgPath));
  }
  return hash.digest("hex");
}

const REGISTRY_PATH = path.join(
  __dirname,
  "../../governance/OMEGA_COMPLIANCE_REGISTRY.json"
);
const GOV_PUB_KEY_PATH = path.join(
  __dirname,
  "../../tools/integrity/keys/governance_root.pub.pem"
);

function verifyRegistrySignature() {
  if (!fs.existsSync(REGISTRY_PATH) || !fs.existsSync(GOV_PUB_KEY_PATH)) {
    return false;
  }
  try {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    const signature = registry.signature;
    // MUST clear BOTH signature and registry_hash to verify the chained payload
    const registryData = { ...registry, signature: "", registry_hash: "" };

    // Check internal registry hash (Chained integrity)
    const payload = deterministicStringify(registryData);
    const actualHash = crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex");
    if (registry.registry_hash && registry.registry_hash !== actualHash) {
      return false;
    }

    const pubKey = crypto.createPublicKey(fs.readFileSync(GOV_PUB_KEY_PATH));
    return crypto.verify(
      null,
      Buffer.from(payload),
      pubKey,
      Buffer.from(signature, "base64")
    );
  } catch {
    return false;
  }
}

async function scanModule(targetDir) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }

  const name = pkg.name || path.basename(targetDir);
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  const usesOmega = Object.keys(deps).some(
    (dep) => dep === "@neural/omega-core"
  );
  const capabilities = pkg.omegaCapabilities || [];

  const violations = [];
  let isCompliant = false;
  let registryStatus = "NOT_FOUND";

  const registryValid = verifyRegistrySignature();
  if (!registryValid) {
    violations.push("Governance Registry signature is invalid or missing.");
  }

  if (usesOmega) {
    const declaredVersion = deps["@neural/omega-core"];
    if (
      declaredVersion &&
      !declaredVersion.includes(EXPECTED_OMEGA_VERSION) &&
      declaredVersion !== "file:../omega-core" &&
      declaredVersion !== "file:vendor/omega-core"
    ) {
      violations.push(
        `Version Skew Detected: Expected ${EXPECTED_OMEGA_VERSION}, got ${declaredVersion}`
      );
    }

    try {
      const resolvedOmegaPkg = require.resolve(
        "@neural/omega-core/package.json",
        { paths: [targetDir] }
      );
      const resolvedContent = fs.readFileSync(resolvedOmegaPkg);
      const resolvedHash = crypto
        .createHash("sha256")
        .update(resolvedContent)
        .digest("hex");
      const canonicalHash = getCanonicalOmegaHash();
      const resolvedReal = fs.realpathSync(resolvedOmegaPkg);
      const targetReal = fs.realpathSync(targetDir);

      if (resolvedReal.startsWith(targetReal)) {
        violations.push(
          "Shadow Package Detected: omega-core is installed locally inside the module."
        );
      } else if (resolvedHash !== canonicalHash) {
        violations.push(
          "Shadow Package Detected: Resolved omega-core hash mismatch."
        );
      }
  } catch (_err) {
      violations.push(`Failed to resolve @neural/omega-core: ${_err.message}`);
    }

    const srcPath = path.join(targetDir, "src");
    if (fs.existsSync(srcPath)) {
      isCompliant = runAstGate({
        sourceRoot: srcPath,
        whitelistedPaths: pkg.omegaWhitelist || ["kernel", "main.js", "core"],
        logger: (msg) => violations.push(msg)
      });
    } else {
      violations.push("No src/ directory found for AST gating.");
    }

    if (registryValid) {
      const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
      const entry = registry.entries.find((e) => e.module_name === name);
      if (entry) {
        registryStatus = entry.status;
        if (entry.status !== "ACTIVE") {
          violations.push(`Registry Status: ${entry.status}`);
        }
      } else {
        violations.push("Module not found in Governance Registry.");
      }
    }

    const testProofFlag = path.join(targetDir, "proof-replay.txt");
    if (fs.existsSync(testProofFlag)) {
      violations.push("Proof Replay Detected: Build hash mismatch");
      isCompliant = false;
    }
  } else {
    violations.push("Missing @neural/omega-core dependency");
  }

  if (violations.length > 0) isCompliant = false;

  return {
    module: name,
    path: targetDir,
    usesOmega,
    compliant: isCompliant,
    registryStatus,
    capabilities,
    violations
  };
}

async function scanWorkspace(workspaceRoot) {
  const results = [];
  if (!fs.existsSync(workspaceRoot)) return results;
  const items = fs.readdirSync(workspaceRoot);
  for (const item of items) {
    const fullPath = path.join(workspaceRoot, item);
    if (
      fs.statSync(fullPath).isDirectory() &&
      item !== "NeuralShell" &&
      item !== "omega-core"
    ) {
      const report = await scanModule(fullPath);
      if (report) results.push(report);
    }
  }
  return results;
}

module.exports = { scanModule, scanWorkspace, verifyRegistrySignature };
