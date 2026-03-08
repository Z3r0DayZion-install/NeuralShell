# Governance Rotation Protocol

1. Generate replacement governance keypair in a controlled environment
2. Sign the new public key with the old governance key
3. Publish the new governance fingerprint externally
4. Record the event in the release ledger
5. Bump governance key version
6. Re-sign the compliance registry under the new governance key
7. Preserve the historical chain of registry attestations
