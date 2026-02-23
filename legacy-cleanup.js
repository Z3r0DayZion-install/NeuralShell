const fs = require('fs');
const files = [
  'src/intelligence/vectorMemory.js',
  'src/sandbox/safeRuntime.js',
  'state/memory_vector_store.json'
];
files.forEach(f => {
  try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
});
