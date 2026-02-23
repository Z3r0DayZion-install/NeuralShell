const fs = require('node:fs');
const path = require('node:path');
const schemaDir = path.join(process.cwd(), 'src', 'kernel', 'schemas');
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir, { recursive: true });
}
