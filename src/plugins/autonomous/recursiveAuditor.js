const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * NeuralShell Recursive Auditor — OMEGA Enforcement Plugin
 * 
 * Scans src/plugins/autonomous/ and verifies all file SHA256 hashes
 * against the THREAT_LEDGER.jsonl.
 */

const PLUGINS_DIR = path.join(__dirname, ".");
const LEDGER_PATH = path.join(__dirname, "../../../governance/THREAT_LEDGER.jsonl");

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex").toUpperCase();
}

function loadTrustIndex() {
  if (!fs.existsSync(LEDGER_PATH)) return new Map();
  const lines = fs.readFileSync(LEDGER_PATH, "utf8").split("\n").filter(Boolean);
  const trustMap = new Map();
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === "FILE_TRUST_INDEX") {
        trustMap.set(entry.file, entry.hash);
      }
    } catch (err) {
      // Ignore malformed lines
    }
  }
  return trustMap;
}

async function verifyAllPlugins() {
  const trustMap = loadTrustIndex();
  const files = fs.readdirSync(PLUGINS_DIR);
  const results = [];
  let violations = 0;

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const fullPath = path.join(PLUGINS_DIR, file);
    const hash = calculateHash(fullPath);
    const trustedHash = trustMap.get(file);

    if (!trustedHash) {
      results.push({ file, status: "UNTRUSTED", currentHash: hash });
      violations++;
    } else if (hash !== trustedHash.toUpperCase()) {
      results.push({ file, status: "TAMPERED", expected: trustedHash, actual: hash });
      violations++;
    } else {
      results.push({ file, status: "VERIFIED", hash });
    }
  }

  return {
    ok: violations === 0,
    timestamp: new Date().toISOString(),
    totalChecked: files.length,
    violations,
    details: results
  };
}

module.exports = {
  name: "recursive-auditor",
  description: "Audits autonomous plugins for integrity and trust against the governance ledger",
  register({ registerCommand }) {
    registerCommand({
      name: "audit",
      description: "Perform a recursive integrity scan of autonomous plugins.",
      async run() {
        const report = await verifyAllPlugins();
        if (!report.ok) {
          return `CRITICAL INTEGRITY VIOLATION: ${report.violations} untrusted/tampered plugin(s) found! Run !audit-report for details.`;
        }
        return `Audit Complete: All ${report.totalChecked} plugins are verified and trusted.`;
      }
    });

    registerCommand({
      name: "audit-report",
      description: "Display detailed results of the last plugin audit.",
      async run() {
        const report = await verifyAllPlugins();
        return JSON.stringify(report, null, 2);
      }
    });
  }
};
