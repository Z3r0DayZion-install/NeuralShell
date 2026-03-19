const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getHash(file) {
    const content = fs.readFileSync(file);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.gemini') && !file.includes('dist')) {
                walk(file, results);
            }
        } else {
            results.push(file);
        }
    });
    return results;
}

const root = process.cwd();
const dirs = ['src', 'tests', 'docs'];
const rootFiles = [
    'agencyPolicy.json',
    'walkthrough.md',
    'package.json',
    'POST_GEN_VERIFICATION_LOG.txt',
    'RC_VERIFICATION_LOG.txt'
];

let allFiles = [];
dirs.forEach(d => {
    const dPath = path.join(root, d);
    if (fs.existsSync(dPath)) {
        allFiles = allFiles.concat(walk(dPath));
    }
});

rootFiles.forEach(f => {
    const fPath = path.join(root, f);
    if (fs.existsSync(fPath)) {
        allFiles.push(fPath);
    }
});

let manifest = "# NeuralShell V2.0 RC Final (Post-Gen Expanded) — Integrity Manifest\n\n";
manifest += "| File | SHA-256 Hash |\n";
manifest += "| :--- | :--- |\n";

allFiles.sort().forEach(f => {
    const rel = path.relative(root, f);
    manifest += `| ${rel} | ${getHash(f)} |\n`;
});

const manifestName = 'POST_GEN_RC_FINAL_MANIFEST.md';
fs.writeFileSync(manifestName, manifest);
console.log(`Manifest generated: ${manifestName}`);
