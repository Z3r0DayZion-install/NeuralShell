# PHASE 7 ACCEPTANCE GATES

All Phase 7 deliverables must pass the following gates before being considered for a version-locked release.

## 1. Branch Hygiene Gate
- No commits may contain modified artifacts from the `neuralshell-phases2-5-goldmaster` baseline.
- All Phase 7 specific documentation must reside in `docs/phase7/`.

## 2. UI Regression Gate
- The "Golden Flow" (Startup -> Setup -> Action -> Save -> Load) must remain functional and visually consistent with the Phase 5 baseline.
- New telemetry listeners must not introduce measurable input lag (>16ms).

## 3. Bridge Recovery Gate
- Bridge failure must trigger the refined recovery guidance established in Phase 4.
- Automatic reconnection attempts must be verified across three simulated bridge crashes.

## 4. Release Artifact Scrub Gate
- All new documentation must pass the portability scrub (no `C:\Users\`, `file:///`, or session-local strings).
- Final package building must be driven by an automated, verified script to prevent manual manifest errors.

## 5. Tag/Release Readiness Gate
- A release-candidate tag (`v2.0.0-rc[N]`) must be verified before final gold-master locking.
- All SHA-256 hashes must be authoritative and verified against the physical ZIP content.
