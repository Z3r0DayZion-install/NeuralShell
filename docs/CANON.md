# Documentation Canon - NeuralShell (Current Branch)

This file declares which documents are authoritative for the current repository state.
If a document is not listed here, treat it as historical context or working material.

## Canonical Documents (Root)

| Document | Authority |
|:---|:---|
| `README.md` | Product entrypoint and operator command surface |
| `task.md` | Current lifecycle state and completed stage record |
| `walkthrough.md` | Proof-of-work narrative and release hardening context |
| `CHANGELOG.md` | Release-line history and tag narrative |
| `RELEASE_NOTES.md` | Current release-note delta summary |
| `ARCHITECTURE_RULES.md` | Architecture constraints and guardrails |
| `IPC_CONTRACT.md` | Main-to-renderer contract boundary |
| `SHELL_CONTRACT.md` | Behavioral contract for shell operations |
| `SOURCE_AUDIT_SNAPSHOT_HANDOFF.md` | Audit snapshot and handoff boundary |
| `SOC2_PREP_REPORT.md` | SOC2 prep status output |
| `HARD_PROOF_V2.1.29_EVIDENCE_LOG.md` | Consolidated hard-proof evidence index |

## Canonical Documents (Subdirectories)

| Document | Authority |
|:---|:---|
| `docs/install/INSTALL_WINDOWS.md` | Windows install guide |
| `docs/install/INSTALL_MACOS.md` | macOS install guide |
| `docs/install/INSTALL_LINUX.md` | Linux install guide |
| `docs/maintops/MAINTOPS_HANDOFF.md` | Maintenance operations operating model |
| `docs/maintenance/MAINTENANCE_HANDOFF.md` | Maintenance governance and LTS handoff |
| `docs/rc/GA_PROMOTION_GATES.md` | GA blockers and promotion requirements |
| `proof/latest/phase10-reproducibility-proof.md` | Reproducibility proof reference |
| `governance/OMEGA_RELEASE_LEDGER.md` | Cryptographic release authority ledger |

## Historical References

The following legacy documents remain available under `archive/historical/` for audit traceability:

- `archive/historical/GA_KNOWLEDGE_INDEX.md`
- `archive/historical/FINAL_HANDOFF_STATUS.md`
- `archive/historical/RELEASE_MANIFEST.md`
- `archive/historical/SYSTEM_MAP.md`
- `archive/historical/ARCHITECTURE_RISKS.md`
- `archive/historical/WHITEPAPER_NeuralShell.md`

## Rule

Any claim promoted into release, launch, or compliance surfaces must be verifiable against canonical documents above.
