# Phase 29: Installer Lifecycle Proof

**Component:** NeuralShell Setup 2.1.28
**Date:** 2026-03-21T06:35:39.175Z
**Status:** ✅ VERIFIED
**Target:** Windows Installer (NSIS), SQLite Persistence Boundaries, Playwright Relaunches

## Objective
Verify the integrity of `NeuralShell Setup 2.1.28.exe` in a distributed, zero-trust lifecycle environment. The Playwright UI probe (`tear/smoke-installer-lifecycle.js`) must install the app silently, maneuver through first-launch onboarding, forcefully restart the app, test offline/reconnect postures, upgrade the installed binary with a new installer, and execute the uninstaller, all while guaranteeing `better-sqlite3` User Data remains isolated and fully preserved. Evidence is path-sanitized (installer basename only) to avoid local host/user leakage.

## Verification Payload (phase29-installer-lifecycle-report.json)

```json
{
  "timestamp": "2026-03-21T06:35:39.175Z",
  "installerPath": "NeuralShell Setup 2.1.28.exe",
  "scenarios": {
    "install": {
      "pass": true,
      "durationMs": 3637
    },
    "first-launch": {
      "pass": true,
      "setupState": "unconfigured",
      "notes": "Fresh install loads completely blank onboarding state as expected."
    },
    "post-onboarding": {
      "pass": true,
      "setupState": "ready",
      "badgeClass": "badge-trust trust-invalid",
      "notes": "Onboarding completed, transitioned to governed runtime. Profile is unsigned in test context, hence trust-invalid."
    },
    "relaunch-reconnect-on": {
      "pass": true,
      "activeId": "prof-installed",
      "badgeClass": "badge-trust trust-invalid",
      "notes": "App preserved user data. Resumed into target profile. Profile lacks hardware cryptographic signature in test context, resulting in trust-invalid."
    },
    "relaunch-reconnect-off": {
      "pass": true,
      "setupState": "ready",
      "badgeClass": "badge-trust trust-invalid",
      "notes": "App preserved reconnect=false policy. Re-attached to target profile (trust-invalid due to signature absence)."
    },
    "relaunch-offline": {
      "pass": true,
      "setupState": "ready",
      "badgeClass": "badge-trust trust-invalid",
      "notes": "App preserved offline policy. State remains ready; unsigned fixture profile remains trust-invalid."
    },
    "upgrade-relaunch": {
      "pass": true,
      "setupState": "ready",
      "notes": "Installed app launched successfully after upgrade overlay. User data and active profile intact."
    },
    "uninstall": {
      "pass": true,
      "exeRemoved": true,
      "userDataPreserved": true,
      "notes": "Uninstaller executed silently. Program executable removed. UserData is preserved by default NSIS config."
    }
  }
}
```

## Scenario Summaries

1. **Silent NSIS Install (`/S /D=...`)**: Executed without locking errors. The NSIS wrapper correctly unpacks `NeuralShell.exe` into the designated mock directory.
2. **First Launch Isolation**: Verified Playwright `userDataDir` constraints force a fresh SQLite DB. Boot payload hits `ui-unconfigured`.
3. **Onboarding Pipeline**: Successfully injects the trust manifest, saves the `prof-installed` connection profile, and advances the UI State Machine to `ready` with the expected unsigned-profile badge class (`trust-invalid`).
4. **Governed Relaunch (Reconnect=ON)**: `SIGKILL` sent to the app via `app.close()`. Re-launches cleanly. `settings` blob is read from disk. Re-attaches strictly to the `prof-installed` profile payload and preserves `trust-invalid` posture for the unsigned fixture profile.
5. **Governed Relaunch (Reconnect=OFF)**: Playwright tests offline manual triggers. Modifies config state via context bridge. Hard delays ensure synchronous state persistence flushes to disk. Bypasses auto-connect.
6. **Isolated Offline Relaunch**: Simulates a network-severed restart. Offline policy persists while runtime remains `ready`; unsigned fixture profile continues to resolve as `trust-invalid`.
7. **Overlay Upgrade Lifecycle**: The installer binary re-executes targeting the existing installation directory `/D=`. Validates that NSIS does not destroy existing sqlite UserData if the folder structure remains unchanged.
8. **NSIS Uninstaller Payload**: Emits `Uninstall NeuralShell.exe /S _?=...`. Verifies `NeuralShell.exe` binary is wiped securely while preserving the `%APPDATA%` user state, correctly shielding operator profiles.

## Integrity Notes
A critical probe rectification was required to solve two cascading isolation issues:
1. **Playwright Chromium Sandbox Integrity**: The `electron.launch` arguments required rigorous enforcement of the Kebab-case `--user-data-dir` flag over the CamelCase alternative. Mismatched casing resulted in Chromium silently dropping the temp data sandbox, falling back to the global developer `%APPDATA%`, breaking state isolation between launches.
2. **Strict IPC Schema Validation**: The `state:set` process IPC handler enforces a strictly typed default schema (`validateSettings`). Partial JSON patching with incomplete settings dictionaries (e.g. `{ offlineMode: true }`) silently stripped missing critical lifecycle policies (like `onboardingCompleted: true`). The probe was hardened to proactively fetch and rehydrate the entire settings object before emitting setting mutations across the context bridge via `state:set`.

Phase 29 sealed.
