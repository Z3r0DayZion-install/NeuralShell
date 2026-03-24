# NeuralShell Maintenance Changelog

## [V2.1.29] — 2026-03-21
### Pending (Phase 30 — Native Trust Proof & Signed Profile Lifecycle)
- Proving native signed profile creation via real onboarding flow.
- Proving native trust persistence through application relaunch.
- Proving native drift detection via setting mutation.
- Proving native missing-secret handling.
- Proving native signature tamper detection on profile artifacts.
- Proving native offline lock posture.
- Proving repair and recovery outcomes for degraded states.

---


## [V2.1.28] — 2026-03-21
### Verified (Phase 29 — Installer Lifecycle Proof)
- Created `smoke-installer-lifecycle.js` NSIS execution probe via Playwright.
- Bypassed wrapper execution environment drops by leveraging `userDataDir` inside Playwright natively.
- Fixed `ipcMain` vs `SIGKILL` Sqlite flush race condition with hard 2000ms delay barriers.
- Verified Silent NSIS install, First Launch, Reconnect On/Off, and Offline Relaunch scenarios.
- Verified NSIS Upgrade lifecycle overlay and Silent Uninstallation while preserving user data.
- Exported `proof/latest/phase29-installer-lifecycle-report.json` and generated Markdown proof document.

---

## [V2.1.27] — 2026-03-20
### Verified (Phase 28 — Packaged Operator Action Proof)
- Extended packaged probe (`smoke-packaged-governance.js`) with 4 operator action scenarios.
- All 5 operator actions verified in the packaged `.exe`: Disconnect, Switch Profile, Enter Offline, Verify, Repair.
- Probe defect fixed: profile injection scoped to Node process instead of renderer `window` (destroyed on reload).
- Evidence: `proof/latest/phase28-scenario-report.json`, 4 action screenshots.
- Governance snapshot upgraded to V2.1.27; packaged operator-action proof gap fully closed.

---

## [V2.1.26] — 2026-03-20
### Added (Phase 27 — Canonical Task Ledger & Release-Ready Governance Snapshot)
- Retitled task artifact from stale Phase 16 framing to canonical execution ledger.
- Created `docs/release/V2_1_26_GOVERNANCE_SNAPSHOT.md` — factual release-facing governance snapshot.
- Added role-clarity cross-references to `OPERATOR_UX_BASELINE.md`, `PROFILE_TRUST_AND_SECRET_CUSTODY.md`, `walkthrough.md`.
- Evidence hygiene verified: zero `file:///` or absolute path violations in touched docs.

---

## [V2.1.25] — 2026-03-20
### Fixed (Phase 26 — Packaged Trust Differentiation Proof)
- Identified and removed legacy Phase 19 synchronous `checkProfileDrift` in `renderer.js` that shadowed the Phase 25 async evaluator.
- Root cause: legacy function compared a `Promise` object against a string hash, collapsing every profile to `DRIFTED`.
- Converted all renderer consumers (`getTrustBadge`, `renderSavedProfiles`, `showTrustReport`, `loadConnectionProfile`) to correctly `await` the global async evaluator.
- Removed diagnostic `console.log` from production `trust-evaluator.js`.

### Verified (Phase 26)
- All 7 trust scenarios (A–G) produce distinct badge classes in the packaged `.exe`: `trust-verified`, `trust-drifted`, `trust-tampered`, `trust-offline`, `trust-invalid`.
- Evidence hygiene re-locked: all `file:///` and absolute paths purged from walkthrough.

---

## [V2.1.24] — 2026-03-20
### Fixed (Phase 25 — Packaged Trust-State UI Proof)
- Refactored `trust-evaluator.js`, `runtime-governance.js`, and `session-control.js` to async for IPC bridge compatibility.
- Added `calculateProfileFingerprint`, `retrieveSecret`, `logProfileEvent`, and `TRUST_STATES` to `preload.js` context bridge.
- Added corresponding `ipcMain.handle()` bindings in `main.js`.
- Fixed IPC field stripping: `normalizeConnectionProfile` in `ipcValidators.js` and `normalizeBridgeProfile` in `bridgeProfileModel.js` now preserve `lastVerifiedFingerprint`, `authenticity`, and `trustState`.
- Fixed bootstrap race: `bootstrapGovernance` correctly awaits async governance call.

### Verified (Phase 25)
- NSIS installer lifecycle: install, first-launch, uninstall.
- 7 packaged trust-state entry scenarios with Playwright probe.
- Disconnect operator action verified.
- Evidence: `proof/latest/phase25-scenario-report.json`.

---

## [V2.1.23] — 2026-03-20
### Verified (Phase 24 — Packaged Build Proof)
- Rebuilt distributable via `npm run build` (electron-builder, Windows x64 NSIS).
- Artifact: `dist/NeuralShell Setup 2.1.23.exe`.
- Packaged smoke test passed: rendererLoad=true, rendererDom=true, ipcHandshake=true, uptimeMs=3537.
- Evidence hygiene: removed all `file:///` and absolute `C:/Users/` paths from docs.
- Three-layer evidence model documented: module/VM contract, desktop dev launch, packaged build.

---

## [V2.1.22] — 2026-03-20
### Added
- **Renderer Decomposition (Phase 22)**: Extracted 5 runtime modules from `renderer.js` into `src/runtime/`: `trust-evaluator.js`, `session-control.js`, `profile-switcher.js`, `runtime-governance.js`, `active-profile-bar.js`.
- **Module-Level Test Coverage**: 42 tests across 4 suites covering trust evaluation, session control, profile switching, runtime governance contract, and integration.
- **Governance Contract Test**: `tear/runtime-governance-contract.test.js` validates all 7 trust-state entry scenarios (A–G) and 5 control-surface actions.

### Verified (Phase 23)
- Packaged runtime smoke verification performed against desktop Electron shell.
- All 7 runtime entry scenarios verified: VERIFIED+ON, VERIFIED+OFF, DRIFTED, MISSING_SECRET, SIGNATURE_TAMPERED, OFFLINE_LOCKED, INVALID.
- All 5 control-surface actions verified: Switch (allowed), Switch (blocked), Disconnect, Offline Entry, Profile List.
- Production audit: no debug leaks, correct `renderer.html` script ordering, `bootstrapGovernance` wrapper intact.
- 1 defect found and fixed: mock `TRUST_STATES` missing `NEEDS_REVIEW` caused `undefined === undefined` match in `checkProfileDrift`.

---

## [V2.1.20] — 2026-03-20
### Added
- **Runtime Resume Governance**: Trust-gated auto-resume replacing raw Cold Boot Suppression. Only VERIFIED profiles with `connectOnStartup` may auto-resume.
- **Active Profile Bar**: Compact runtime UI showing profile name, provider, model, trust badge, reconnect policy, and action buttons.
- **Profile Switching**: Governed activation with trust checks; SIGNATURE_TAMPERED and INVALID profiles are blocked.
- **Repair Entry**: First-class runtime action routing DRIFTED→repair and MISSING_SECRET→repair_secret.
- **Offline Runtime Hardening**: OFFLINE_LOCKED profiles enter offline-only mode with remote actions disabled.
- **Runtime Trust Telemetry**: Events for runtime_resume_allowed, runtime_resume_blocked, repair_mode_entered, offline_entry, profile_switch, verification_requested.
- **Verification Proof**: 10-case runtime governance contract suite (`tear/runtime-governance.test.js`).

### Changed
- **Cold Boot Suppression**: Replaced with `runtimeResumeGovernance()` in `renderer.js`.
- **Operator Baseline**: Updated to V2.1.20 with § 6 Runtime Resume Policy table.

---

## [V2.1.19] — 2026-03-20
### Added
- **Semantic Lock**: Normalization of the onboarding wizard to a strict 6-step gated gateway (Step 6 = Final Seal).
- **Terminology Consolidation**: Unified all authenticity states/badges to canonical `SIGNATURE_TAMPERED`.
- **Evidence Provenance**: Synchronized the walkthrough verification summary to the full 11-test suite results.

### Changed
- **Operator Baseline**: Updated to V2.1.19 to reflect standardized step mapping and vocabulary.

---

## [V2.1.18] — 2026-03-20
### Added
- **Governance Seal**: Implementation of strict Phase 18 materialization rules and secret gating for all remote providers.
- **Wizard Convergence**: Canonical mapping of onboarding steps to internal setup states with draft persistence.
- **Verification Proof**: Expanded convergence test suite (`tear/onboarding-profile-convergence.test.js`) covering abort/resume/offline isolation.

### Changed
- **Renderer Refactor**: Structural separation of `loadInitialState` and `initEventListeners` to resolve technical debt and nesting errors.
- **Baseline Normalization**: Consolidation of versioning to exactly `V2.1.18` and removal of machine-local URI leaks from documentation.

---

## [V2.1.17] — 2026-03-20
### Added
- **Guided Onboarding**: Implementation of the 6-step setup wizard for cold-boot professionalization.
- **Dynamic Model Fetching**: Real-time model discovery during the onboarding verification step.
- **First-Session Summary**: Governance abstract view (Step 5) with reconnection controls.

### Changed
- **Cold Boot Suppression**: Moved diagnostic banners and bridge errors behind the setup gate for unconfigured users.

---

## [V2.1.16] — 2026-03-20
### Added
- **Secret Recovery**: Implementation of `repair_secret` flow for manual secret re-entry when custody is lost (e.g., cross-machine mobility).
- **Bundle Signing**: HMAC-SHA256 signature layer for profile bundles to ensure cryptographic authenticity and prevent tampering.
- **Forensic Export**: Professional JSON and Markdown export capabilities for full profile lifecycle and trust histories.
- **Verification Proof**: Automated authenticity contract tests (`tear/bundle-authenticity.test.js`) and recovery tests (`tear/secret-recovery.test.js`).

### Changed
- **Resume Governance**: Hardened blocking logic to prevent resumption of any profile with a `SIGNATURE_TAMPERED` signature or `MISSING_SECRET` status.
- **Trust Report UI**: Enhanced with professional forensic export actions and high-fidelity authenticity badges.

---

## [V2.1.15] — 2026-03-20
### Added
- **Secret Custody**: Implementation of secure API key storage using `electron.safeStorage` with fallback for unconfigured environments.
- **Portable Mobility**: Tamper-aware profile export/import with integrity verification and metadata-only bundling.
- **Forensic Timeline**: Persistent lifecycle event logging (`profileTrustHistory`) for all trust-critical transitions.
- **Trust Report UI**: Dedicated operator dashboard for viewing profile forensic history and custody state.

### Changed
- **Resume Hardening**: Enforced strict blocks for `MISSING_SECRET` and `DRIFTED` states, requiring forensic re-verification.
- **State Version 8**: Migrated state schema to include secret custody and trust timeline structures.

---

## [V2.1.14] — 2026-03-20
### Added
- **Profile Trust**: Implementation of SHA-256 fingerprinting for all saved connection profiles.
- **Drift Detection**: Automated detection of configuration changes since last verification, with UI [DRIFTED] badges and alert banners.
- **Resume Governance**: Tiered policies (Verified, Drifted, Invalid) to prevent blind boot sequences.
- **Repair Telemetry**: Persistent audit log of profile failures and corrective actions.
- **Verification Proof**: Automated trust contract tests (`tear/profile-trust.test.js`).

### Changed
- **Maintenance Seal**: Normalized documentation headers and repo-relative evidence links across all baseline artifacts.

---

## [V2.1.13] — 2026-03-20
### Added
- **Recovery States**: Implementation of `repair_mode`, `offline_locked`, and `profile_invalid` states for graceful lifecycle management.
- **Profile Persistence**: Named provider profiles with "Last Success" timestamping and re-verification logic.
- **Connectivity Heartbeats**: Background verification for active connections providing live operational proof.
- **Verification Proof**: Automated recovery contract tests (`tear/recovery-contract.test.js`).

### Changed
- **Setup State Machine**: Expanded from one-time onboarding to full lifecycle recovery.
- **Operator UX Baseline**: Updated to V2.1.13 (and subsequently V2.1.14) to reflect hardened recovery paths.

---

## [V2.1.8] — 2026-03-20
### Added
- **Cadence Pack**: Implementation of foundational maintenance and governance documentation.
- **LTS Strategy**: Implementation of long-term support models and compatibility boundaries.

**Project Status: SEALED (V2.1.28 Installer Lifecycle Proof)**
