const fs = require('fs');
const path = require('path');
const { runAstGate } = require('@neural/omega-core/ci/ast_gate');

/**
 * NeuralShell Workstation Validator (Empire Control Plane)
 * Scans neighboring directories for OMEGA Core compliance.
 */

async function scanModule(targetDir) {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;

    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch { return null; }

    const name = pkg.name || path.basename(targetDir);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    
    // Using string matching to support local file paths or registry versions
    const usesOmega = Object.keys(deps).some(dep => dep === '@neural/omega-core');
    const capabilities = pkg.omegaCapabilities || [];

    const violations = [];
    let isCompliant = false;

    if (usesOmega) {
        const srcPath = path.join(targetDir, 'src'); 
        if (fs.existsSync(srcPath)) {
            // Run programmatic AST Gate
            isCompliant = runAstGate({
                sourceRoot: srcPath,
                whitelistedPaths: pkg.omegaWhitelist || ['kernel', 'main.js', 'core'],
                logger: (msg) => violations.push(msg)
            });
        } else {
            violations.push("No src/ directory found for AST gating.");
        }
    } else {
        violations.push("Missing @neural/omega-core dependency");
    }

    return {
        module: name,
        path: targetDir,
        usesOmega,
        compliant: isCompliant,
        capabilities,
        violations
    };
}

async function scanWorkspace(workspaceRoot) {
    const results = [];
    if (!fs.existsSync(workspaceRoot)) return results;
    
    const items = fs.readdirSync(workspaceRoot);
    for (const item of items) {
        const fullPath = path.join(workspaceRoot, item);
        if (fs.statSync(fullPath).isDirectory() && item !== 'NeuralShell' && item !== 'omega-core') {
            const report = await scanModule(fullPath);
            if (report) results.push(report);
        }
    }
    return results;
}

module.exports = { scanModule, scanWorkspace };
