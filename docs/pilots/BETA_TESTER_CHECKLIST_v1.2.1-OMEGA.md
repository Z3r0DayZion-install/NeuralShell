# NeuralShell Beta Tester Checklist (One Page)

Build under test: `v1.2.1-OMEGA`  
Release link: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.2.1-OMEGA`  
Goal: validate real install/use/restart behavior on non-dev machines.

## Tester Setup
1. Use a normal user account (not admin terminal workflows unless required by installer).
2. Use a machine that does not already have your local dev copy running.
3. Record OS version and security tools (Defender/EDR/AV).

## Execution Checklist
Mark each as `PASS` or `FAIL` and add notes.

1. Download and trust
- Download `NeuralShell.Setup.1.2.1-OMEGA.exe` from the release page.
- Note SmartScreen/AV behavior.

2. Install
- Run installer with default settings.
- Confirm install completes without crash/hang.

3. First launch
- App opens and reaches usable UI in under 30 seconds.
- No crash or freeze on first launch.

4. Onboarding flow
- Complete onboarding.
- Close and reopen app.
- Confirm onboarding is remembered.
- Use reset path and confirm onboarding can be shown again.

5. Core interaction
- Send at least one prompt.
- Open command palette and toggle theme.
- Confirm palette closes cleanly and app remains responsive.

6. Persistence
- Edit profile/settings.
- Fully close app and relaunch.
- Confirm profile/settings persisted.

7. Session behavior
- Create a conversation/session.
- Restart app.
- Confirm session history still exists.

8. Stability pass (10 minutes)
- Keep app open for 10 minutes with normal use.
- Confirm no crash, blank screen, hard freeze, or runaway CPU.

9. Reinstall check
- Uninstall app.
- Reinstall same version.
- Confirm launch still succeeds.

## Blocker Definition (Stop and Report Immediately)
- Install fails or app cannot launch.
- Data/settings disappear unexpectedly.
- Reproducible crash/freeze on core flow.
- Security warning appears malicious or unverifiable.

## Submit Back
1. Checklist result summary: `Passed X/9`.
2. Any `FAIL` item with exact step number.
3. Bug report(s) using `docs/pilots/BETA_BUG_REPORT_TEMPLATE.md`.
