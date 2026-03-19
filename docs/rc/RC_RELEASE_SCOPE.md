# NeuralShell V2.0 RC Final (Post-Gen Expanded) — Release Scope

This document defines the normative boundary for the **NeuralShell V2.0 RC Final** release. It distinguishes between the current active release surface and historical artifacts maintained for traceability.

## Normative Release Surface (Bucket A)

The following artifacts define the current public handoff. These are the primary sources of truth for the V2.0 RC Final state:

### Core Documentation
- **walkthrough.md**: Primary operational guide.
- **RC_CHANGELOG.md**: Record of changes leading to RC Final.
- **V2_RC_RELEASE_NOTES.md**: Technical overview of RC capabilities.
- **RC_HANDOFF.md**: Operator stewardship guidelines.

### Integrity & Verification
- **POST_GEN_RC_FINAL_MANIFEST.md**: Cryptographic manifest of release assets.
- **POST_GEN_VERIFICATION_LOG.txt**: Final master audit trace.
- **RC_VERIFICATION_LOG.txt**: Core RC hardening audit trace.

### Source & Configuration
- **src/**: Current production-hardened source code.
- **tests/**: Current verification suite.
- **agencyPolicy.json**: Externalized strategy configuration.

---

## Internal Build Identification
- **Stage 515**: Refers strictly to the **internal post-gen finalization stage** (Phase 15). It is used for internal build tracking and does not replace the public release label.

---

## Historical & Archival Context (Bucket B)
The NeuralShell repository contains historical artifacts from prior development phases (Alpha, Beta, OMEGA). While these files remain in the repository for traceability and auditability, they are **not** part of the normative `V2.0 RC Final` release surface.

For a detailed classification of historical residue, refer to:
- **LEGACY_ARTIFACTS_AUDIT.md**

---
**Status: Normative Lock Established (V2.0 RC Final)**
