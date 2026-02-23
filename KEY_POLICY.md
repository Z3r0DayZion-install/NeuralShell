# NEURALSHELL KEY HANDLING POLICY

1. **Private Keys**:
   - MUST NEVER be committed to source control or included in any application bundle.
   - MUST NEVER be pasted into AI prompts, chat interfaces, or logged in debug output.
   - Production signing MUST occur in a secured environment (HSM, offline signer, or encrypted CI secret store).

2. **Public Keys**:
   - The RSA-4096 PSS public key is embedded in `src/boot/verify.js` for boot integrity.
   - SPKI hashes for trusted endpoints are hard-pinned in `src/kernel/network.js`.

3. **Seal Verification**:
   - The `seal.manifest.json` and `.sig` are generated during the build phase and verified at runtime before the application initializes.
