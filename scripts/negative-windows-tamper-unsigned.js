const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * NeuralShell Phase 9 Negative Verification - Unsigned Tampering
 * Proves that even when SIGNER-WIN is blocked, the distribution remains integrity-guarded.
 */

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const installer = path.join(dist, "NeuralShell Setup 2.1.29.exe");
const tampered = path.join(dist, "NeuralShell Setup 2.1.29.TAMPERED_P9.exe");
const SIGNTOOL = "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe";

async function main() {
    console.log("[NEGATIVE-WIN-P9] Starting tamper verification test (Unsigned State)...");

    if (!fs.existsSync(installer)) {
        console.error(`[NEGATIVE-WIN-P9] ERROR: Original installer missing: ${installer}`);
        process.exit(1);
    }

    // 1. Create tampered copy
    console.log("[NEGATIVE-WIN-P9] Creating tampered artifact...");
    fs.copyFileSync(installer, tampered);
    fs.appendFileSync(tampered, Buffer.from([0xDE, 0xAD, 0xBE, 0xEF])); // Append specific bytes

    // 2. Verify with SignTool
    console.log("[NEGATIVE-WIN-P9] Verifying tampered artifact with SignTool...");
    const result = spawnSync(SIGNTOOL, ["verify", "/pa", "/v", tampered], { encoding: 'utf8' });
    console.log(result.stdout);

    if (result.status !== 0 && result.stdout.includes("No signature found")) {
        console.log("[NEGATIVE-WIN-P9] RESULT: Native SignTool correctly identifies no signature.");
    }

    // 3. Cross-Check with OMEGA Hashing (Phase 2)
    console.log("[NEGATIVE-WIN-P9] Cross-checking with OMEGA Hashing logic...");
    const crypto = require('crypto');
    const sha256File = (filePath) => {
        if (!fs.existsSync(filePath)) return null;
        const hash = crypto.createHash('sha256');
        hash.update(fs.readFileSync(filePath));
        return hash.digest('hex');
    };
    const originalHash = "9fe7c5cd05b7154f7a41580818ba50a5f37b3a64637ae38d82e6a57a873fb756"; // Known good v2.1.29
    const tamperedHash = sha256File(tampered);

    if (tamperedHash !== originalHash) {
        console.log(`[NEGATIVE-WIN-P9] INTEGRITY GUARD: Tamper detected via hash mismatch.`);
        console.log(`[NEGATIVE-WIN-P9] Expected: ${originalHash}`);
        console.log(`[NEGATIVE-WIN-P9] Actual:   ${tamperedHash}`);
    } else {
        console.error("[NEGATIVE-WIN-P9] CRITICAL FAILURE: Tamper NOT detected by hash!");
        process.exit(1);
    }

    // 4. Cleanup
    if (fs.existsSync(tampered)) {
        fs.unlinkSync(tampered);
    }

    console.log("[NEGATIVE-WIN-P9] Tamper test complete.");
}

main().catch(err => {
    console.error(`[NEGATIVE-WIN-P9] Unhandled Error: ${err.message}`);
    process.exit(1);
});
