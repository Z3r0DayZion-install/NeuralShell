/**
 * NeuralShell V2.0 - Release Verification Utility
 * Validates Gold Master artifacts (Zip -> Hash -> Content).
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DEFAULT_GOLD_MASTER_PATH = path.resolve(__dirname, "..", "NeuralShell_Distribution_Ready", "NeuralShell_Evidence_v1.0.zip");
const DESKTOP_GOLD_MASTER_PATH = path.join(process.env.USERPROFILE, "Desktop", "NeuralShell_Evidence_v1.0.zip");
const _GOLD_MASTER_PATH = "scripts/release-verify.js";
const _EXPECTED_HASH = "d41d8cd98f00b204e9800998ecf8427e";
// The original hash was "de9fd93e42b88814465401c8116d324880defc4d55254c66391e015616a8e015";
// The instruction provided a partial hash and a syntax error.
// Assuming the intent was to mark the original EXPECTED_HASH as unused and replace it with the new value.

const PROFILES = {
    "v1-gold-master": {
        label: "NeuralShell Phase 2-5 Gold Master",
        path: fs.existsSync(DESKTOP_GOLD_MASTER_PATH) ? DESKTOP_GOLD_MASTER_PATH : DEFAULT_GOLD_MASTER_PATH,
        hash: "c4b9cbfbe0154c30aa875dda8c15252c72cfc507c6c76f4fae94528ea22c7bce",
        requiredFiles: [
            "SHA256SUMS.txt",
            "RELEASE_MANIFEST.md",
            "README.md",
            "walkthrough.md",
            "SYSTEM_MAP.md",
            "MASTER_PROOF.md",
            "HARD_PROOF_v1.0.0-OMEGA.md",
            "MANUAL_VALIDATION_CHECKLIST.md",
            "FINAL_HANDOFF_STATUS.md"
        ]
    },
    "v2-kickoff": {
        label: "NeuralShell V2.0 Alpha Kickoff",
        path: path.resolve(__dirname, "..", "NeuralShell_V2.0_Kickoff_Evidence.zip"),
        hash: "de9fd93e42b88814465401c8116d324880defc4d55254c66391e015616a8e015",
        requiredFiles: [
            "RELEASE_MANIFEST_V2.md",
            "config.js",
            "telemetry.js",
            "logger.js",
            "release-verify.js",
            "walkthrough.md",
            "task.md",
            "renderer.js",
            "main.js",
            "llmService.js",
            "ipcValidators.js"
        ]
    }
};

function log(msg, type = "info") {
    const prefix = type === "error" ? "[ERROR]" : type === "warn" ? "[WARN]" : "[INFO]";
    console.log(`${new Date().toISOString()} ${prefix} ${msg}`);
}

async function sha256File(filePath) {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });
}

function verifyZipContents(zipPath, requiredFiles) {
    log(`Listing contents of ${path.basename(zipPath)} via PowerShell...`);
    try {
        const listCommand = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipPath}').Entries.FullName"`;
        const output = execSync(listCommand, { encoding: "utf8" });
        const lines = output.split(/\r?\n/).filter(Boolean);
        log(`Found ${lines.length} entries in ZIP.`);

        let missingCount = 0;
        for (const req of requiredFiles) {
            if (!lines.some(l => l.includes(req.replace(/\//g, "\\")) || l.includes(req))) {
                log(`Missing required file in ZIP: ${req}`, "error");
                missingCount++;
            } else {
                log(`Verified file in ZIP: ${req}`);
            }
        }

        return missingCount === 0;
    } catch (err) {
        log(`Failed to verify ZIP contents: ${err.message}`, "error");
        return false;
    }
}

async function run() {
    log("Starting Release Verification (Detached Proof Model)...");
    const profileKey = process.argv[2] || "v2-kickoff";
    const profile = PROFILES[profileKey];

    if (!profile) {
        log(`Unknown profile: ${profileKey}`, "error");
        log(`Available profiles: ${Object.keys(PROFILES).join(", ")}`);
        process.exit(1);
    }

    log(`Target Profile: ${profile.label}`);

    if (!fs.existsSync(profile.path)) {
        log(`Target ZIP not found at ${profile.path}`, "error");
        process.exit(1);
    }

    log(`Verifying hash for ${path.basename(profile.path)}...`);
    const actualHash = await sha256File(profile.path);

    if (actualHash.toLowerCase() !== profile.hash.toLowerCase()) {
        log(`Hash mismatch!`, "error");
        log(`  Expected: ${profile.hash}`, "error");
        log(`  Actual:   ${actualHash}`, "error");
        process.exit(1);
    }
    log("Hash verified successfully.");

    const contentsOk = verifyZipContents(profile.path, profile.requiredFiles);
    if (!contentsOk) {
        log("Content verification failed.", "error");
        process.exit(1);
    }

    log(`NeuralShell ${profile.label}: VERIFICATION PASSED`, "info");
}

run().catch((err) => {
    log(err.message || String(err), "error");
    process.exit(1);
});
