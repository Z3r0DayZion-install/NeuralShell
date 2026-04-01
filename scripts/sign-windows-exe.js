const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * NeuralShell Windows Native Signer - Phase 8
 * Targets: NeuralShell Setup 2.1.29.exe
 */

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const installer = path.join(dist, "NeuralShell Setup 2.1.29.exe");

// standard SDK location discovered during Phase 8 search
const SIGNTOOL = "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe";
const TIMESTAMP_SERVER = "http://timestamp.digicert.com";

async function main() {
    console.log("[SIGNER-WIN] Starting native signing cycle...");

    if (!fs.existsSync(installer)) {
        console.error(`[SIGNER-WIN] ERROR: Target missing: ${installer}`);
        process.exit(1);
    }

    if (!fs.existsSync(SIGNTOOL)) {
        console.error(`[SIGNER-WIN] ERROR: SignTool missing at ${SIGNTOOL}`);
        process.exit(1);
    }

    // 1. Certificate Provisioning (Phase 9)
    let pfxPath = process.env.CERTIFICATE_PFX || path.join(root, "NeuralShell.pfx");
    let pfxPass = process.env.CERTIFICATE_PASSWORD || process.env.WIN_CERT_PASS;
    let thumbprint = process.env.WIN_CERT_THUMBPRINT;
    let subject = process.env.WIN_CERT_SUBJECT;
    let tempPfxUsed = false;
    let useStore = !!(thumbprint || subject);

    // Support Base64 encoded certificates for CI/Secret environments
    if (process.env.WIN_CERT_BASE64 && !useStore) {
        console.log("[SIGNER-WIN] Provisioning certificate from environment (WIN_CERT_BASE64)...");
        const tempPfxPath = path.join(root, "release", "temp_provisioned.pfx");
        fs.writeFileSync(tempPfxPath, Buffer.from(process.env.WIN_CERT_BASE64, 'base64'));
        pfxPath = tempPfxPath;
        tempPfxUsed = true;
    }

    if (!useStore && !fs.existsSync(pfxPath)) {
        console.warn(`[SIGNER-WIN] WARNING: No Windows signing certificate (.pfx) found at ${pfxPath}`);
        console.warn(`[SIGNER-WIN] STATUS: Scaffolding complete, but trust activation is BLOCKED.`);
        console.warn(`[SIGNER-WIN] PREREQUISITE: Supply WIN_CERT_BASE64, WIN_CERT_THUMBPRINT, or place NeuralShell.pfx in repository root.`);

        const report = {
            timestamp: new Date().toISOString(),
            target: path.basename(installer),
            method: "SignTool (Authenticode)",
            status: "BLOCKED_BY_CERTIFICATE_MATERIAL",
            prerequisite: "Missing PFX, thumbprint, or WIN_CERT_BASE64",
            tool_path: SIGNTOOL
        };

        fs.writeFileSync(path.join(root, "release", "windows-signing-report.json"), JSON.stringify(report, null, 2));
        return;
    }

    // 2. Execution (Real Signing Activation)
    try {
        console.log(`[SIGNER-WIN] Applying Windows Native Signature to ${path.basename(installer)}...`);
        let cmd;
        if (useStore) {
            console.log(`[SIGNER-WIN] Using Certificate Store (${thumbprint ? `Thumbprint: ${thumbprint}` : `Subject: ${subject}`})...`);
            cmd = `"${SIGNTOOL}" sign ${thumbprint ? `/sha1 "${thumbprint}"` : `/n "${subject}"`} /sm /tr "${TIMESTAMP_SERVER}" /td sha256 /fd sha256 "${installer}"`;
        } else {
            console.log(`[SIGNER-WIN] Using PFX file: ${pfxPath}`);
            // Command: signtool sign /f <pfx> /p <pass> /tr <ts> /td sha256 /fd sha256 <target>
            cmd = `"${SIGNTOOL}" sign /f "${pfxPath}" ${pfxPass ? `/p "${pfxPass}"` : ""} /tr "${TIMESTAMP_SERVER}" /td sha256 /fd sha256 "${installer}"`;
        }

        execSync(cmd, { stdio: 'inherit' });
        console.log("[SIGNER-WIN] Real Windows Signature: SUCCESS");

        // Cleanup temporary material
        if (tempPfxUsed && fs.existsSync(pfxPath)) {
            fs.unlinkSync(pfxPath);
            console.log("[SIGNER-WIN] Temporary certificate material purged.");
        }
    } catch (err) {
        console.error(`[SIGNER-WIN] CRITICAL ERROR: Signing failed: ${err.message}`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(`[SIGNER-WIN] Unhandled Error: ${err.message}`);
    process.exit(1);
});
