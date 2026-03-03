const path = require('path');
const { computeBuildHash } = require('./_omega_utils');

/**
 * NeuralShell Build Hash Generator (Unified)
 */

const ROOT = path.join(__dirname, '../');

function run() {
  const finalHash = computeBuildHash(ROOT);
  console.log(`[BUILD] DETERMINISTIC_BUILD_HASH: ${finalHash}`);
  return finalHash;
}

if (require.main === module) run();
module.exports = { computeBuildHash: () => computeBuildHash(ROOT) };
