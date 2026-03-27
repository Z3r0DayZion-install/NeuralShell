# RELEASE MANIFEST - NeuralShell V2.1.29 GA (React-Hardened)

## Handoff Package
- **Package Name**: `NeuralShell_V2.1.29_GA.zip`
- **Status**: GENERAL AVAILABILITY (React + OMEGA Sealed)

## ZIP Contents
| File | Purpose |
| :--- | :--- |
| `ARCHITECTURE_RISKS.md` | Documented architectural risks and mitigations. |
| `FINAL_HANDOFF_STATUS.md` | Final executive summary of release readiness. |
| `GA_KNOWLEDGE_INDEX.md` | Master index for all GA release documentation. |
| `MANUAL_VALIDATION_CHECKLIST.md` | Guide for manual verification procedures. |
| `MASTER_PROOF.md` | Evidence of LLM wiring and IPC handshake. |
| `README.md` | Project overview and quick start. |
| `RELEASE_MANIFEST.md` | This document: full manifest. |
| `SHA256SUMS.txt` | Cryptographic checksums for the package. |
| `SYSTEM_MAP.md` | Architectural breakdown of the security layers. |
| `walkthrough.md` | Technical narrative and UI gallery. |
| `governance/` | Source manifest and compliance registries. |

## Privacy & Portability Scrub
The handoff package was reviewed for machine-local and session-local references, including:
- Windows user-directory paths
- local file URL references
- session-specific link prefixes
- internal assistant temp-directory references
- generated temporary artifact markers

**Result**: No machine-local or session-local references remain in the final package content. The documentation is portable and shippable.
