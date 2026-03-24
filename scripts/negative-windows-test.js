const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * NeuralShell Phase 8 Negative Verification - Tampering
 */

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const installer = path.join(dist, "NeuralShell Setup 2.1.29.exe");
const tampered = path.join(dist, "NeuralShell Setup 2.1.29.TAMPERED.exe");
const SIGNTOOL = "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe";

async function main() {
    console.log("[NEGATIVE-WIN] Starting tamper verification test...");

    if (!fs.existsSync(installer)) {
        console.error(`[NEGATIVE-WIN] ERROR: Original installer missing: ${installer}`);
        process.exit(1);
    }

    // 1. Create tampered copy
    console.log("[NEGATIVE-WIN] Creating tampered artifact...");
    fs.copyFileSync(installer, tampered);
    fs.appendFileSync(tampered, Buffer.from([0x00, 0x00, 0x00, 0x00])); // Append bytes

    // 2. Verify with SignTool
    console.log("[NEGATIVE-WIN] Verifying tampered artifact with SignTool...");
    try {
        const result = spawnSync(SIGNTOOL, ["verify", "/pa", "/v", tampered], { encoding: 'utf8' });
        console.log(result.stdout);
        console.log(result.stderr);

        if (result.status !== 0) {
            console.log("[NEGATIVE-WIN] RESULT: Verification FAILED as expected.");
            console.log("[NEGATIVE-WIN] DETAIL: Tampered artifact is reported as unsigned or invalid.");
        } else {
            console.error("[NEGATIVE-WIN] CRITICAL ERROR: Tampered artifact PASSED verification!");
            process.exit(1);
        }
    } catch (err) {
        console.log("[NEGATIVE-WIN] RESULT: Verification crashed/failed as expected.");
    }

    // 3. Cleanup
    if (fs.existsSync(tampered)) {
        fs.unlinkSync(tampered);
    }

    console.log("[NEGATIVE-WIN] Tamper test complete.");
}

main().catch(err => {
    console.error(`[NEGATIVE-WIN] Unhandled Error: ${err.message}`);
    process.exit(1);
});
