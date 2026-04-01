# NeuralShell V2.1.28 Governance Snapshot

## 1. Current Baseline

- **Active baseline**: V2.1.28
- **Runtime status**: Governed onboarding, governed resume, trust-state differentiated profile management, packaged and verified. All operator actions proven in packaged environment. Installer lifecycle proven (including reconnect/offline relaunch persistence with expected `trust-invalid` badge class for unsigned test fixture profile).

## 2. Proven Capabilities

| Capability | Status | Introduced |
|---|---|---|
| Guided 6-step onboarding wizard | Verified | V2.1.17 |
| Late profile materialization (no ghost profiles) | Verified | V2.1.18 |
| SHA-256 fingerprint drift detection | Verified | V2.1.14 |
| Secret custody via `safeStorage` + recovery flow | Verified | V2.1.15 |
| HMAC-SHA256 bundle signing + tamper detection | Verified | V2.1.16 |
| Canonical trust states (VERIFIED, DRIFTED, MISSING_SECRET, SIGNATURE_TAMPERED, OFFLINE_LOCKED, INVALID) | Verified | V2.1.14 |
| Trust-gated runtime resume policy | Verified | V2.1.20 |
| Active Profile Governance Bar (runtime UI) | Verified | V2.1.20 |
| Profile switching with trust checks | Verified | V2.1.20 |
| Repair entry routing (DRIFTED → repair, MISSING_SECRET → recovery) | Verified | V2.1.20 |
| Offline runtime hardening | Verified | V2.1.20 |
| Renderer decomposition into testable runtime modules | Verified | V2.1.22 |
| Async IPC bridge for all trust evaluation paths | Verified | V2.1.24 |
| Packaged trust-state differentiation (7 scenarios, all distinct CSS classes) | Verified | V2.1.25 |
| Packaged operator actions (Disconnect, Switch, Offline, Verify, Repair) | Verified | V2.1.27 |
| Installer lifecycle (First Launch, Relaunch, Offline, Upgrade, Uninstall) | Verified | V2.1.28 |

## 3. Evidence Layers

| Layer | Description | Proof Artifact |
|---|---|---|
| Module / VM contract | 42 tests across 4 suites; governance contract covers 7 trust states + 5 actions | `tear/runtime-governance-contract.test.js` |
| Desktop dev-launch | Electron shell launches, renders governance bar, evaluates trust state | `proof/latest/phase23-smoke-evidence.md` |
| Packaged build | electron-builder NSIS installer produces functional `.exe` | `proof/latest/phase24-packaged-build-proof.md` |
| Packaged governance differentiation | Playwright probe: 7 profiles × distinct badge classes in sealed `.exe` | `proof/latest/phase25-scenario-report.json` |
| Packaged operator action proof | 5 operator actions (Disconnect, Switch, Offline, Verify, Repair) in sealed `.exe` | `proof/latest/phase28-scenario-report.json` |
| Installer lifecycle proof | Playwright NSIS probe: installation, relaunches, reconnect/offline policy persistence, upgrade, and isolated uninstall. Report path field is sanitized to installer basename only. | `proof/latest/phase29-installer-lifecycle-report.json` |

## 4. Known Boundaries / Not Yet Proven

- **Cross-platform**: All evidence is Windows x64 only. No macOS or Linux packaging proof exists.
- **External audit**: No third-party security audit has been performed.
- **Production bridge verification**: All packaged trust probes run offline (no live Ollama/OpenAI endpoint). The trust evaluator's live-bridge verification path is exercised only through dev-launch and module tests.

## 5. Release Posture

- **Internal technical DD readiness**: Yes. The codebase has a documented trust model, cryptographic profile governance, automated test coverage, and packaged build evidence with differentiated trust-state rendering and operator action proof.
- **Packaged runtime maturity**: Functional. The packaged `.exe` renders correct governance state for all 7 trust scenarios. All 5 operator actions verified.
- **Installer lifecycle**: Verified via automated Playwright NSIS probe (`smoke-installer-lifecycle.js`) with 100% test coverage including upgrades and offline data persistence. Phase 29 evidence intentionally uses an unsigned fixture profile, so relaunch trust badge remains `trust-invalid` by design.
- **Honest posture**: Pre-release internal. Suitable for technical due diligence and structured beta. Not externally audited. Not production-hardened for adversarial deployment.

## 6. Canonical Docs

| Document | Role |
|---|---|
| `docs/release/V2_1_28_GOVERNANCE_SNAPSHOT.md` | Current release-facing governance status (this file) |
| Artifact task ledger (conversation artifact) | Historical execution ledger for all baseline phases |
| `docs/maintenance/MAINTENANCE_CHANGELOG.md` | Versioned maintenance milestones |
| `docs/runtime/OPERATOR_UX_BASELINE.md` | Canonical operator UX contract (wizard, resume, trust states) |
| `docs/maintenance/PROFILE_TRUST_AND_SECRET_CUSTODY.md` | Trust mechanics and secret custody reference |
| `proof/latest/phase25-scenario-report.json` | Packaged trust-state differentiation evidence |
| `proof/latest/phase28-scenario-report.json` | Packaged operator action evidence |
| `proof/latest/phase28-packaged-operator-actions.md` | Phase 28 proof narrative |
| `proof/latest/phase29-installer-lifecycle-report.json` | Installer lifecycle automated proof |
| `proof/latest/phase29-installer-lifecycle-proof.md` | Phase 29 proof narrative |

---
*Baseline: V2.1.28 — Phase 29 Installer Lifecycle Proof*
