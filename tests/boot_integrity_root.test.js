const { verifyBootIntegrity } = require('../src/boot/verify');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

async function testBootIntegrity() {
  console.log("[Test] Verifying Boot Integrity Root Path...");

  // Simulate missing manifest
  const result = await verifyBootIntegrity();
  assert.strictEqual(result.ok, false, "Boot should fail if manifest is missing");
  assert.strictEqual(result.reason, 'MISSING_RELEASE_SEAL');

  console.log("✅ Boot integrity logic verified.");
}
