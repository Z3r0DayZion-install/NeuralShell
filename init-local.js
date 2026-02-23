// Local asset directories initialized.
const fs = require('fs');
const dirs = ['public', 'public/lib', 'public/css', 'models'];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
