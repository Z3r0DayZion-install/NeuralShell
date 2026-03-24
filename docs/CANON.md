# Documentation Canon — NeuralShell V2.1.29 GA

This file declares which documents are **authoritative** for the current release.
If a document is not listed here, treat it as historical reference only.

## Canonical Documents (Root)

| Document | Authority |
|:---|:---|
| `GA_KNOWLEDGE_INDEX.md` | Master documentation entry point |
| `walkthrough.md` | Proof-of-work and UI gallery |
| `CHANGELOG.md` | Version history (authoritative through V2.1.29) |
| `FINAL_HANDOFF_STATUS.md` | Executive release summary |
| `RELEASE_MANIFEST.md` | Distribution file inventory |
| `SYSTEM_MAP.md` | Architecture and TCB mapping |
| `ARCHITECTURE_RISKS.md` | Security risk mitigations |
| `WHITEPAPER_NeuralShell.md` | Conceptual security model |

## Canonical Documents (Subdirectories)

| Document | Authority |
|:---|:---|
| `docs/install/INSTALL_WINDOWS.md` | Windows install guide |
| `docs/install/INSTALL_MACOS.md` | macOS install guide |
| `docs/install/INSTALL_LINUX.md` | Linux install guide |
| `docs/release/PLATFORM_TRUST_PLAN.md` | Per-platform signing/trust plan |
| `governance/OMEGA_RELEASE_LEDGER.md` | Release authority protocol |

## Superseded / Historical

The following directories contain phase-specific documentation from earlier development.
They are preserved for audit trail purposes but are **not authoritative** for V2.1.29 GA:

- `docs/phase7/` — V7 release stewardship (superseded)
- `docs/phase9/` — Certificate provisioning drafts (superseded by `PLATFORM_TRUST_PLAN.md`)
- `docs/phase10/` — Reproducible build parity (merged into release pipeline)
- `docs/phase11/` — Stage 11/12 changelogs (historical)
- `docs/stage12/` — Stage 12 changelog (historical)
- `docs/archive/` — Explicitly archived materials
- `docs/pilots/` — Beta pilot tracking (operational, not release docs)
- `docs/beta/` — Beta outreach materials (operational)
- `docs/maintops/` — Maintenance operations (living docs, not release-specific)

## Rule
> Any document not listed in the Canonical tables above should be treated as
> context-only. Do not propagate claims from superseded documents into release
> surfaces without explicit verification against the canonical source.
