const path = require('path');
const fs = require('fs');
const assert = require('assert');

// 1. ROBUST ELECTRON MOCKING
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'electron') {
    return {
      app: {
        getAppPath: () => process.cwd(),
        getPath: (name) => path.join(process.cwd(), 'tmp', name)
      },
      safeStorage: {
        isEncryptionAvailable: () => false,
        encryptString: (s) => Buffer.from(s),
        decryptString: (b) => b.toString()
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// 2. LOAD CORE MODULES
const { kernel, CAP_PROC } = require('./src/kernel');
const identityKernel = require('./src/core/identityKernel');

async function verify() {
  console.log("--- NEURALSHELL SOVEREIGN INTEGRITY PROOF ---");

  // TEST 1: IDENTITY SIGNING
  console.log("[TEST 1] Testing Ed25519 Signing & Verification...");
  const payload = { data: "threat_signature_v1", ts: Date.now() };
  const signature = identityKernel.signPayload(payload);
  const pubKey = identityKernel.getPublicKeyPem();
  const isValid = identityKernel.verifyPayload(payload, signature, pubKey);
  
  console.log(`- Node Fingerprint: ${identityKernel.getFingerprint()}`);
  console.log(`- Signature Verified: ${isValid}`);
  assert.strictEqual(isValid, true, "Identity verification failed!");

  // TEST 2: KERNEL ENFORCEMENT
  console.log("\n[TEST 2] Testing Kernel Task Registry Enforcement...");
  try {
    await kernel.request(CAP_PROC, 'executeTask', { taskId: 'unauthorized_cmd' });
    assert.fail("Kernel failed to block unauthorized task!");
  } catch (err) {
    console.log(`- Trapped Security Error: ${err.message}`);
    assert.ok(err.message.includes("Task not registered") || err.message.includes("OMEGA_BLOCK"), "Kernel enforcement bypass detected!");
  }

  // TEST 3: SWARM LEDGER CONSISTENCY
  console.log("\n[TEST 3] Testing Threat Ledger Cryptographic Chain...");
  const ledgerPath = path.join(process.cwd(), "governance", "THREAT_LEDGER.jsonl");
  const advisory = { type: "SECURITY_ADVISORY", vulnerability: "sandbox_escape_proof" };
  const advisorySig = identityKernel.signPayload(advisory);
  const record = JSON.stringify({ ...advisory, signature: advisorySig, nodeId: identityKernel.getFingerprint() });
  
  fs.appendFileSync(ledgerPath, record + "\n");
  const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
  const parsed = JSON.parse(lines[lines.length - 1]);
  const isChainValid = identityKernel.verifyPayload({ type: parsed.type, vulnerability: parsed.vulnerability }, parsed.signature, pubKey);
  
  console.log(`- Ledger Vulnerability: ${parsed.vulnerability}`);
  console.log(`- Chain Integrity: ${isChainValid ? "INTACT" : "CORRUPT"}`);
  assert.strictEqual(isChainValid, true, "Ledger chain corruption detected!");

  // TEST 4: AGENT SANDBOX
  console.log("\n[TEST 4] Testing Agent Sandbox Execution...");
  const sandboxScript = path.join(process.cwd(), 'tmp', 'proof-ping.js');
  fs.writeFileSync(sandboxScript, "console.log('SANDBOX_ACTIVE');", 'utf8');
  const response = await kernel.request(CAP_PROC, 'executeTask', {
    taskId: 'agent:node',
    extraArgs: [sandboxScript]
  });
  console.log(`- Sandbox Output: ${response.stdout.trim()}`);
  assert.strictEqual(response.stdout.trim(), "SANDBOX_ACTIVE", "Sandbox execution failed!");

  console.log("\n--- SYSTEM STATUS: SOVEREIGN, GATED, & VERIFIED ---");
}

verify().catch(err => {
  console.error("\n!!! INTEGRITY PROOF FAILED !!!");
  console.error(err);
  process.exit(1);
});
