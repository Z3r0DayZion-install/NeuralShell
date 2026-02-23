const fs = require('node:fs');
const path = require('node:path');
const proofDir = path.join(process.cwd(), 'proof');
if (!fs.existsSync(proofDir)) {
  fs.mkdirSync(proofDir, { recursive: true });
}
