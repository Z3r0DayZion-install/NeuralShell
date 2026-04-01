# Bundle Authenticity & Key Governance (V2.1.16+)

## 1. Signing Model
NeuralShell uses a keyed **HMAC-SHA256** model to ensure the cryptographic authenticity of exported profile bundles. This prevents unauthorized modification of endpoint metadata or trust states during transit.

- **Algorithm**: `HMAC-SHA256`
- **Manifest**: `id | provider | baseUrl | lastVerifiedFingerprint`
- **Payload**: The signature is embedded in the `integrity.bundleSignature` field of the exported JSON.

## 2. Key Governance
Authenticity is bound to the operator's physical hardware to ensure local-machine integrity.

- **Key Source**: The signing key is derived from a stable seed provided by the `identityKernel`.
- **Seed Composition**: A hash of the local ED25519 identity key and the hardware-locked silicon ID.
- **Persistence**: The key is never exported. It remains physically bound to the machine that generated the bundle.

## 3. Verification Boundaries
- **Machine-Local Verification**: Profiles exported on Machine A and imported back to Machine A will be verified as `VERIFIED` (Authentic).
- **Cross-Machine Portability**: Profiles moved to Machine B will be marked as `SIGNATURE_TAMPERED` (Signature Mismatch) or `UNSIGNED`, as Machine B lacks Machine A's private signing seed.
- **Operational Impact**: This model explicitly detects "Third-Party Metadata Injection" by ensuring only locally-known signatures are trusted as authentic.

## 4. Trust Taxonomy
- `VERIFIED`: Signature matches the local machine key.
- `SIGNATURE_TAMPERED`: Signature exists but does not match (potential tampering or cross-machine movement).
- `UNSIGNED`: Legacy bundle with no signature metadata.

---
*Governance Baseline: V2.1.16 Hardened*
