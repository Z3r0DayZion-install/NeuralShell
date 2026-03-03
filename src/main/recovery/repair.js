const fs = require('fs');
const path = require('path');

/**
 * NeuralShell Repair Engine
 * 
 * Restores corrupted files from a local trusted snapshot.
 */

const ROOT = path.join(__dirname, '../../../');
const SNAPSHOT_DIR = path.join(ROOT, 'snapshot');

async function attemptRepair(failedFiles) {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.error('[REPAIR] Snapshot directory missing.');
    return false;
  }

  console.log(`[REPAIR] Attempting to restore ${failedFiles.length} files...`);

  try {
    for (const file of failedFiles) {
      const snapshotPath = path.join(SNAPSHOT_DIR, file.path);
      const targetPath = path.join(ROOT, file.path);

      if (fs.existsSync(snapshotPath)) {
        // Ensure parent directory exists
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        
        // Copy file from snapshot back to source
        fs.copyFileSync(snapshotPath, targetPath);
        console.log(`[REPAIR] Restored: ${file.path}`);
      } else {
        console.warn(`[REPAIR] Snapshot missing for: ${file.path}`);
        return false; // Fail if any file cannot be restored
      }
    }
    return true;
  } catch (err) {
    console.error(`[REPAIR ERROR] ${err.message}`);
    return false;
  }
}

module.exports = { attemptRepair };
