const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const docsDir = path.join(process.cwd(), 'docs');
const allFiles = walk(docsDir);

console.log(`Processing ${allFiles.length} files...`);

allFiles.forEach(f => {
    // 1. Content Replacement
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    const patterns = [
        { from: /v1\.2\.1-OMEGA/g, to: 'V2.0-RC-Final' },
        { from: /v1\.2\.1/g, to: 'V2.0-RC-Final' },
        { from: /1\.2\.1-OMEGA/g, to: 'V2.0-RC-Final' },
        { from: /Beyond Existence/g, to: 'RC Finalization' },
        { from: /absolute finalization/gi, to: 'RC finalization' },
        { from: /post-causal operational excellence/gi, to: 'operational hardening' },
        { from: /Farewell, Operator/g, to: 'Ready for stewardship' },
        { from: /The cycle is absolute/g, to: 'The release is complete' }
    ];

    patterns.forEach(p => {
        if (p.from.test(content)) {
            content = content.replace(p.from, p.to);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(f, content);
        console.log(`Updated content: ${path.relative(process.cwd(), f)}`);
    }

    // 2. Renaming
    const base = path.basename(f);
    if (base.includes('v1.2.1') || base.includes('OMEGA')) {
        const newBase = base.replace(/v1\.2\.1-OMEGA/g, 'V2.0-RC-Final')
            .replace(/v1\.2\.1/g, 'V2.0-RC-Final')
            .replace(/1\.2\.1-OMEGA/g, 'V2.0-RC-Final');
        const newPath = path.join(path.dirname(f), newBase);
        if (f !== newPath) {
            fs.renameSync(f, newPath);
            console.log(`Renamed: ${path.relative(process.cwd(), f)} -> ${newBase}`);
        }
    }
});

console.log("Cleanup complete.");
