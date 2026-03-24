/**
 * Phase 15: Sovereign Audit Trace
 * Unified verification of all 15 technical phases for NeuralShell V2.0 RC Final.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CONTRACT_TESTS = [
    "tear/contract-state-schema.test.js",
    "tear/contract-session-schema.test.js",
    "tear/contract-migration-guard.test.js",
    "tear/contract-profile-mobility.test.js"
];

function log(msg) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${msg}`);
    fs.appendFileSync(path.join(process.cwd(), "SOVEREIGN_AUDIT_LOG.txt"), `[${ts}] ${msg}\n`);
}

async function run() {
    const logPath = path.join(process.cwd(), "SOVEREIGN_AUDIT_LOG.txt");
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

    log("================================================================================");
    log("NEURALSHELL SOVEREIGN AUDIT TRACE (V2.0 RC FINAL)");
    log("================================================================================");
    log("Target Stage: 515 (Post-Gen Finalization)");
    log("Status: Audit Initiated");

    try {
        log("STEP 1: Executing Core Contract Verification Architecture...");
        for (const testFile of CONTRACT_TESTS) {
            log(`  - Validating ${testFile}...`);
            execSync(`node ${testFile}`, { stdio: "inherit" });
        }

        log("STEP 2: Executing Unit & Smoke Tests...");
        execSync("npm test", { stdio: "inherit" });

        log("STEP 3: Executing Parallelized E2E Pulse (Workers: 2)...");
        execSync("npm run test:e2e:parallel", { stdio: "inherit" });

        log("STEP 4: Executing Parallelized Visual Regression Pulse (Workers: 2)...");
        execSync("npm run test:visual:parallel", { stdio: "inherit" });

        log("================================================================================");
        log("SOVEREIGN AUDIT RESULT: PASSED");
        log("================================================================================");
        log("All 15 development phases verified as stable and integrated.");
        log("Repository baseline is now sealed and ready for master archival.");

    } catch (err) {
        log("================================================================================");
        log("SOVEREIGN AUDIT RESULT: FAILED");
        log("================================================================================");
        log(`Error: ${err.message}`);
        process.exit(1);
    }
}

run();
