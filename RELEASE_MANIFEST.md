# RELEASE MANIFEST - NeuralShell Phases 2–5

## Handoff Package
- **Package Name**: `NeuralShell_Evidence_v1.0.zip`
- **Status**: GOLD MASTER

## ZIP Contents
| File | Purpose |
| :--- | :--- |
| `FINAL_HANDOFF_STATUS.md` | Final project status and portability verification summary. |
| `HARD_PROOF_v1.0.0-OMEGA.md` | Engineering certification for core runtime and release gates. |
| `MANUAL_VALIDATION_CHECKLIST.md` | Comprehensive guide for manual functional verification. |
| `MASTER_PROOF.md` | Evidence of LLM wiring, IPC handshake, and automated test passes. |
| `README.md` | Project overview, quick start, and release flow documentation. |
| `RELEASE_MANIFEST.md` | This document: full manifest and portability audit record. |
| `SHA256SUMS.txt` | Cryptographic SHA-256 checksums for all included documents. |
| `SYSTEM_MAP.md` | Architectural breakdown of the trusted computing base and security layers. |
| `walkthrough.md` | Technical narrative of UX polish and MVP hardening (Phases 2-5). |

## Privacy & Portability Scrub
The handoff package was reviewed for machine-local and session-local references, including:
- Windows user-directory paths
- local file URL references
- session-specific link prefixes
- internal assistant temp-directory references
- generated temporary artifact markers

**Result**: No machine-local or session-local references remain in the final package content. The documentation is portable and shippable.
