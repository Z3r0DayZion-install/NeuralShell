const assert = require('assert');
const fs = require('fs');
const path = require('path');
const agencyPolicy = require('../src/core/agencyPolicy');
const { _ACTION_RISK } = require("../src/core/agencyPolicy");

async function testPolicyHotload() {
    console.log("Starting Policy Hot-Reload Verification...");

    const policyPath = path.resolve(__dirname, '../agencyPolicy.json');
    const backup = fs.readFileSync(policyPath, 'utf8');

    try {
        // 1. Initial State Check
        const initialPerm = agencyPolicy.isAutoRunPermitted("audit_package", {}); // audit_package is SAFE
        const initialMedium = agencyPolicy.isAutoRunPermitted("run_e2e", {}); // run_e2e is MEDIUM

        console.log(`Initial SAFE perm: ${initialPerm}`);
        console.log(`Initial MEDIUM perm: ${initialMedium}`);
        assert.strictEqual(initialPerm, true, "SAFE actions should start as permitted");
        assert.strictEqual(initialMedium, false, "MEDIUM actions should start as gated");

        // 2. Modify Policy
        console.log("Updating agencyPolicy.json to permit MEDIUM actions...");
        const newPolicy = JSON.parse(backup);
        newPolicy.defaultAutoRun.medium = true;
        fs.writeFileSync(policyPath, JSON.stringify(newPolicy, null, 4));

        // 3. Wait for watcher (fs.watch can be asynchronous)
        console.log("Waiting for hot-reload...");
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Verify Update
        const updatedMedium = agencyPolicy.isAutoRunPermitted("run_e2e", {});
        console.log(`Updated MEDIUM perm: ${updatedMedium}`);
        assert.strictEqual(updatedMedium, true, "MEDIUM actions should now be permitted after hot-reload");

        console.log("Policy Hot-Reload Verification PASSED.");
    } finally {
        // Restore backup
        fs.writeFileSync(policyPath, backup);
    }
    process.exit(0);
}

testPolicyHotload().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
