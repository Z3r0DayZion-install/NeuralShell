# Threat Model

Protected assets:
- runtime kernel integrity
- plugin integrity
- release artifacts
- deterministic build outputs
- registry governance chain
- node identity / local state binding

Threats addressed:
- casual artifact tampering
- direct primitive misuse outside kernel
- unsigned or drifted plugin loading
- registry replay or rollback
- release artifact substitution

Non-goals / limited guarantees:
- full defense against hardware-level adversaries
- true hardware-backed trust without TPM or attestation
- perfect protection against malicious maintainers without external anchors
