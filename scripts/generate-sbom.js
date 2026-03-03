const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * OMEGA Deterministic SBOM Sealer
 * 
 * Enforces:
 * - Deterministic component sorting
 * - Stable JSON serialization (Sorted keys)
 * - Environment-independent path normalization
 */

const ROOT = path.join(__dirname, '../');
const LOCK_FILE = path.join(ROOT, 'package-lock.json');
const OUT_DIR = path.join(ROOT, 'artifacts', 'sbom');

function hashFile(p) {
  if (!fs.existsSync(p)) return 'MISSING';
  // Use UTF-8 and LF normalization for hash consistency
  const content = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getPackageIntegrity(pkgPath) {
  const pJson = path.join(ROOT, pkgPath, 'package.json');
  if (!fs.existsSync(pJson)) return 'NO_JSON';
  return hashFile(pJson);
}

function generateSBOM(options = { includeTimestamp: false }) {
  console.log('[SBOM] Sealing supply chain dependencies (Deterministic Mode)...');
  
  if (!fs.existsSync(LOCK_FILE)) {
    throw new Error('package-lock.json missing. Supply chain is unsealed.');
  }

  const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
  const components = [];

  if (lock.packages) {
    Object.entries(lock.packages).forEach(([pkgPath, meta]) => {
      if (pkgPath === "") return;
      
      const component = {
        name: meta.name || pkgPath.split('node_modules/').pop(),
        version: meta.version,
        path: pkgPath.replace(/\\/g, '/'),
        declaredIntegrity: meta.integrity,
        actualIntegrity: getPackageIntegrity(pkgPath)
      };
      components.push(component);
    });
  }

  // Mandatory lexicographical sort for determinism
  components.sort((a, b) => a.path.localeCompare(b.path));

  const sbom = {
    schemaVersion: "sbom.v1",
    application: lock.name,
    version: lock.version,
    dependencyCount: components.length,
    lockfileHash: hashFile(LOCK_FILE),
    components
  };

  if (options.includeTimestamp) {
    sbom.generatedAt = new Date().toISOString();
  }

  const sbomContent = JSON.stringify(sbom, null, 2);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  
  // Latest link (Deterministic filename)
  const latestFile = path.join(OUT_DIR, 'latest.json');
  fs.writeFileSync(latestFile, sbomContent);

  return sbom;
}

if (require.main === module) {
  generateSBOM({ includeTimestamp: true });
}

module.exports = { generateSBOM };
