const fs = require("fs");
const path = require("path");

/**
 * NeuralShell Release Signer
 * Signs the release manifest using the local OMEGA identity.
 */

// ROBUST ELECTRON MOCKING FOR SCRIPTS
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
        isEncryptionAvailable: () => false
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

const identityKernel = require("../src/core/identityKernel");

async function run() {
  console.log("[SIGNER] Initiating Release Signature...");
  
  const manifestPath = path.join(__dirname, "../release/manifest.json");
  const signaturePath = path.join(__dirname, "../release/manifest.sig");
  const publicKeyPath = path.join(__dirname, "../release/manifest.pub");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  await identityKernel.init();
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const signature = identityKernel.signPayload(manifest);
  const publicKey = identityKernel.getPublicKeyPem();

  fs.writeFileSync(signaturePath, signature, "utf8");
  fs.writeFileSync(publicKeyPath, publicKey, "utf8");

  console.log(`[SIGNER] Signature generated: ${signaturePath}`);
  console.log(`[SIGNER] Node Fingerprint: ${identityKernel.getFingerprint()}`);
}

run().catch(err => {
  console.error(`[SIGNER] Critical Error: ${err.message}`);
  process.exit(1);
});
