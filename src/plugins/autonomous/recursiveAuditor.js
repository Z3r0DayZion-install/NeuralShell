/**
 * NeuralShell Recursive Auditor — OMEGA Enforcement Plugin
 * 
 * Scans src/plugins/autonomous/ and verifies all file SHA256 hashes
 * against the THREAT_LEDGER.jsonl.
 */

module.exports = {
  name: "recursive-auditor",
  description: "Audits autonomous plugins for integrity and trust against the governance ledger",
  register({ registerCommand, kernel }) {
    
    async function calculateHash(filePath) {
      const data = await kernel.request(kernel.CAP_FS, "readFile", { filePath });
      return (await kernel.request(kernel.CAP_CRYPTO, "hash", { data, algorithm: "sha256" })).toUpperCase();
    }

    async function loadTrustIndex() {
      // Use relative path from AppPath to get to governance directory
      const ledgerPath = "C:\\Users\\KickA\\Documents\\GitHub\\NeuralShell\\governance\\THREAT_LEDGER.jsonl"; 
      
      if (!(await kernel.request(kernel.CAP_FS, "exists", { filePath: ledgerPath }))) return new Map();
      const content = await kernel.request(kernel.CAP_FS, "readFile", { filePath: ledgerPath });
      const lines = content.split("\n").filter(Boolean);
      const trustMap = new Map();
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === "FILE_TRUST_INDEX") {
            trustMap.set(entry.file, entry.hash);
          }
        } catch {
          // Ignore malformed ledger lines and continue parsing.
        }
      }
      return trustMap;
    }

    async function verifyAllPlugins() {
      const trustMap = await loadTrustIndex();
      // Since readdir is not in CAP_FS, we'll hardcode the target files for this prototype
      const files = ["echo.js", "recursiveAuditor.js", "sovereign-proxy.js", "swarm-consensus.js"];
      const results = [];
      let violations = 0;

      for (const file of files) {
        const fullPath = `C:\\Users\\KickA\\Documents\\GitHub\\NeuralShell\\src\\plugins\\autonomous\\${file}`;
        const hash = await calculateHash(fullPath);
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

    registerCommand({
      name: "audit",
      description: "Perform a recursive integrity scan of autonomous plugins.",
      async run() {
        const report = await verifyAllPlugins();
        if (!report.ok) {
          return `CRITICAL INTEGRITY VIOLATION: ${report.violations} untrusted/tampered plugin(s) found!`;
        }
        return `Audit Complete: All plugins verified and trusted.`;
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
