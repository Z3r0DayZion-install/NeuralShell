const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * NeuralShell Windows Native Verifier - Phase 8
 * Targets: NeuralShell Setup 2.1.29.exe
 */

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const installer = path.join(dist, "NeuralShell Setup 2.1.29.exe");
const SIGNTOOL = "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe";

async function main() {
    console.log("[VERIFIER-WIN] Starting native verification...");

    if (!fs.existsSync(installer)) {
        console.error(`[VERIFIER-WIN] ERROR: Target missing: ${installer}`);
        process.exit(1);
    }

    let status = "FAIL";
    let detail = "Not signed";
    let timestamp = "Absent";
    let signer = "None";

    try {
        console.log(`[VERIFIER-WIN] Verifying ${path.basename(installer)}...`);
        // /pa used as specified in documentation for public trust verification
        const cmd = `"${SIGNTOOL}" verify /pa /v "${installer}"`;
        const output = execSync(cmd, { encoding: 'utf8' });
        console.log(output);

        if (output.includes("Successfully verified")) {
            status = "PASS";
            detail = "Authenticode Signed";

            // Extract Signer Details
            const signerMatch = output.match(/Signer: (.*)/);
            if (signerMatch) {
                signer = signerMatch[1].trim();
            }

            if (output.includes("The signature includes a timestamp")) {
                timestamp = "Verified (RFC3161)";
            }
        }
    } catch (err) {
        detail = "Verification failed or unsigned";
    }

    const report = {
        timestamp: new Date().toISOString(),
        artifact: path.basename(installer),
        method: "SignTool / Authenticode",
        result: status,
        detail: detail,
        signer_subject: signer,
        timestamp_presence: timestamp,
        command: `signtool verify /pa /v "${path.basename(installer)}"`
    };

    const reportPath = path.join(root, "release", "windows-verification-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`[VERIFIER-WIN] Result: ${status}`);
    console.log(`[VERIFIER-WIN] Report saved to ${path.relative(root, reportPath)}`);
}

main().catch(err => {
    console.error(`[VERIFIER-WIN] Unhandled Error: ${err.message}`);
    process.exit(1);
});
