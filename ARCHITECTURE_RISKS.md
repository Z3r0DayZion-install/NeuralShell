# [CANONICAL] ARCHITECTURE_RISKS — NeuralShell V2.1.29 GA

This document balances architectural excellence with the practical realities of the GA release surface.

## 1. Known Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Integrity Bypass** | High | The `NEURAL_IGNORE_INTEGRITY` environment variable is the only way to boot the React-hardened UI in diagnostic environments until EV signing is finalized. Avoid using in publicly exposed workstations. |
| **IPC Context Leaks** | Medium | Large payloads across the `llm:chat` channel could potentially exceed Electron's IPC limits. Mitigated by state synchronization in `ShellContext`. |
| **Legacy Stubs** | Low | Some legacy `renderer.js` logic remains for backward compatibility with secondary utilities. Mitigated by strict separation of the React `App.jsx` lifecycle. |
| **Hardware Binding Drift** | Medium | Moving the installation to a different physical machine will invalidate the OMEGA seal. Mitigated by the documented re-profiling flow. |

## 2. Unresolved Technical Debt
- **Automated Signature Validation**: The `verify-release-signature.js` script is currently manual and requires operator execution.
- **Diagnostic Log Volume**: Sanitized diagnostic JSONs are large (40k+) and could benefit from future truncation.

## 3. Strategic Recommendations
- **Phase 12 Goal**: Prioritize the acquisition of a production certificate to remove the integrity-bypass requirement.
- **Documentation Hygiene**: Maintain the relative-pathing discipline established in Phase 11.
