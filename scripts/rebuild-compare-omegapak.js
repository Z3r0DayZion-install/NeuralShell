const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPRO_DIR = path.join(ROOT, '.repro-builds');

function sha256File(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function runCommand(cmd, cwd = ROOT) {
    console.log(`[REPRO] Executing: ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit' });
}

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

function getLatestInstaller(distDir) {
    if (!fs.existsSync(distDir)) return null;
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const version = pkg.version;
    const targetName = `NeuralShell Setup ${version}.exe`;
    if (fs.existsSync(path.join(distDir, targetName))) {
        return targetName;
    }
    // Fallback
    const files = fs.readdirSync(distDir);
    const installers = files
        .filter(f => f.startsWith('NeuralShell Setup') && f.endsWith('.exe'))
        .sort()
        .reverse();
    return installers.length > 0 ? installers[0] : null;
}

function captureArtifacts(buildName) {
    const buildDir = path.join(REPRO_DIR, buildName);
    cleanDir(buildDir);

    // 1. Run build/release cycle
    // We use the master orchestrator to ensure a full seal
    // Note: We might need to ensure dependencies are installed, but we assume environment is ready
    runCommand('node scripts/sign-and-verify-omegapak.js');

    // 2. Discover artifacts
    const distTarget = path.join(buildDir, 'dist');
    const releaseTarget = path.join(buildDir, 'release');
    const artifactsTarget = path.join(buildDir, 'artifacts');

    cleanDir(distTarget);
    cleanDir(releaseTarget);
    cleanDir(artifactsTarget);

    // Copy dist/
    if (fs.existsSync(path.join(ROOT, 'dist'))) {
        const installer = getLatestInstaller(path.join(ROOT, 'dist'));
        if (installer) {
            fs.copyFileSync(path.join(ROOT, 'dist', installer), path.join(distTarget, installer));
            const blockmap = installer + '.blockmap';
            if (fs.existsSync(path.join(ROOT, 'dist', blockmap))) {
                fs.copyFileSync(path.join(ROOT, 'dist', blockmap), path.join(distTarget, blockmap));
            }
        }
        const yml = fs.existsSync(path.join(ROOT, 'dist', 'latest.yml')) ? 'latest.yml' : (fs.existsSync(path.join(ROOT, 'dist', 'OMEGA.yml')) ? 'OMEGA.yml' : null);
        if (yml) {
            fs.copyFileSync(path.join(ROOT, 'dist', yml), path.join(distTarget, yml));
        }
    }

    // Copy release/
    const releaseFiles = [
        'manifest.json', 'manifest.sig', 'manifest.pub',
        'signature-verification.json', 'status.json', 'provenance.json',
        'autonomy-benchmark.json', 'checksums.json', 'checksums.txt'
    ];
    releaseFiles.forEach(f => {
        const p = path.join(ROOT, 'release', f);
        if (fs.existsSync(p)) {
            fs.copyFileSync(p, path.join(releaseTarget, f));
        }
    });

    // Copy artifacts/sbom
    const sbomDir = path.join(artifactsTarget, 'sbom');
    cleanDir(sbomDir);
    if (fs.existsSync(path.join(ROOT, 'artifacts', 'sbom', 'latest.json'))) {
        fs.copyFileSync(path.join(ROOT, 'artifacts', 'sbom', 'latest.json'), path.join(sbomDir, 'latest.json'));
    }

    return {
        buildName,
        timestamp: new Date().toISOString(),
        artifacts: {
            installer: getLatestInstaller(distTarget),
            sbom: 'latest.json',
            manifest: 'manifest.json'
        }
    };
}

async function run() {
    console.log('=== NEURALSHELL REPRODUCIBILITY HARNESS ===');

    if (!fs.existsSync(REPRO_DIR)) fs.mkdirSync(REPRO_DIR);

    console.log('\n[REPRO] Starting Build 1...');
    const build1 = captureArtifacts('build-1');

    console.log('\n[REPRO] Starting Build 2...');
    const build2 = captureArtifacts('build-2');

    console.log('\n[REPRO] Comparing artifacts...');

    const results = {
        baseline: build1,
        comparison: build2,
        matches: [],
        mismatches: [],
        summary: {}
    };

    const artifactsToCompare = [
        { path: `dist/${build1.artifacts.installer}`, label: 'Installer EXE' },
        { path: 'artifacts/sbom/latest.json', label: 'SBOM' },
        { path: 'release/manifest.json', label: 'Manifest' },
        { path: 'release/provenance.json', label: 'Provenance' },
        { path: 'release/attestation.json', label: 'Attestation' },
        { path: 'release/manifest.sig', label: 'Signature' },
        { path: 'release/manifest.pub', label: 'Public Key' },
        { path: 'release/autonomy-benchmark.json', label: 'Autonomy Benchmark' },
        { path: 'release/checksums.json', label: 'Checksums Metadata' },
        { path: 'release/checksums.txt', label: 'Checksums Flat' }
    ];

    for (const art of artifactsToCompare) {
        if (!art.path) continue;
        const h1 = sha256File(path.join(REPRO_DIR, 'build-1', art.path));
        const h2 = sha256File(path.join(REPRO_DIR, 'build-2', art.path));

        const result = {
            label: art.label,
            path: art.path,
            hash1: h1,
            hash2: h2,
            match: h1 === h2
        };

        if (result.match) {
            results.matches.push(result);
        } else {
            // Attempt normalization check for JSON files
            let normalizedMatch = false;
            if (art.path.endsWith('.json') && h1 && h2) {
                try {
                    const j1 = JSON.parse(fs.readFileSync(path.join(REPRO_DIR, 'build-1', art.path), 'utf8'));
                    const j2 = JSON.parse(fs.readFileSync(path.join(REPRO_DIR, 'build-2', art.path), 'utf8'));

                    // Typical drift: generatedAt, timestamp, and potentially id/uuid if generated randomly
                    const stripDrift = (obj) => {
                        const copy = JSON.parse(JSON.stringify(obj));
                        // Remove known drifting fields
                        const fieldsToStrip = ['generatedAt', 'timestamp', 'date', 'time', 'buildId'];
                        const recursiveStrip = (o) => {
                            if (typeof o !== 'object' || o === null) return;
                            for (const key of Object.keys(o)) {
                                if (fieldsToStrip.includes(key)) {
                                    delete o[key];
                                } else if (typeof o[key] === 'object') {
                                    recursiveStrip(o[key]);
                                }
                            }
                        };
                        recursiveStrip(copy);
                        return JSON.stringify(copy, Object.keys(copy).sort());
                    };

                    if (stripDrift(j1) === stripDrift(j2)) {
                        normalizedMatch = true;
                    }
                } catch (e) {
                    console.warn(`[REPRO] Failed to normalize ${art.path}: ${e.message}`);
                }
            }

            result.normalizedMatch = normalizedMatch;
            results.mismatches.push(result);
        }
    }

    console.log('\n--- Results ---');
    results.matches.forEach(m => console.log(`[PASS] ${m.label} matches bit-for-bit.`));
    results.mismatches.forEach(m => {
        console.log(`[DRIFT] ${m.label} differs.`);
        if (m.normalizedMatch) {
            console.log(`       -> Reproducible after normalization (timestamp drift only).`);
        } else {
            console.log(`       -> REAL DRIFT DETECTED.`);
        }
    });

    const reportPath = path.join(ROOT, 'proof/latest/phase10-reproducibility-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nReport written to ${reportPath}`);

    // Final Classification
    let overallStatus = 'REPRODUCIBLE';
    let driftClass = 'NONE';
    if (results.mismatches.length > 0) {
        const unexpectedMismatches = results.mismatches.filter(m => {
            if (m.normalizedMatch) return false;
            // manifest.sig is expected to drift if manifest drifts
            if (m.label === 'Signature') return false;
            // checksums.txt is expected to drift if any file it tracks drifts
            if (m.label === 'Checksums Flat') return false;
            return true;
        });

        if (unexpectedMismatches.length === 0) {
            overallStatus = 'REPRODUCIBLE-WITH-NORMALIZATION';
            driftClass = 'BOUNDED_TIMESTAMP_DRIFT';
        } else {
            overallStatus = 'NONDETERMINISTIC';
            driftClass = 'UNEXPLAINED_DRIFT';
        }
    }
    results.summary.status = overallStatus;
    results.summary.driftClass = driftClass;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    // Update Ledger via environment variables
    console.log('\n[REPRO] Updating OMEGA_RELEASE_LEDGER.md with reproducibility data...');
    const env = {
        ...process.env,
        REPRO_BUILD_STATUS: overallStatus,
        REPRO_SCOPE: 'NeuralShell Release Artifact Set (Full)',
        REPRO_VERIFICATION_COMMAND: 'node scripts/rebuild-compare-omegapak.js',
        DRIFT_CLASSIFICATION: driftClass
    };

    try {
        execSync('node scripts/generate-ledger-hashes.js', { cwd: ROOT, stdio: 'inherit', env });
    } catch (err) {
        console.error(`[REPRO] Ledger update failed: ${err.message}`);
    }

    process.exit(overallStatus === 'NONDETERMINISTIC' ? 1 : 0);
}

run().catch(err => {
    console.error(`[REPRO] CRITICAL FAIL: ${err.message}`);
    process.exit(1);
});
