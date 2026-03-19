# Microsoft Store Submission Packet (V2.0-RC-Final)

Use this packet for the `EXE/MSI` submission path in Partner Center.

## Current Product Fields

- Product name: `NeuralShell`
- Version: `V2.0-RC-Final`
- Category: `Developer tools`
- Support URL: `https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose`
- Privacy URL: `https://github.com/Z3r0DayZion-install/NeuralShell/blob/master/docs/PRIVACY_POLICY.md`
- Release URL: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/V2.0-RC-Final`
- Published installer URL: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/download/V2.0-RC-Final/NeuralShell.Setup.V2.0-RC-Final.exe`

## Short Description

`Security-first desktop workstation for local AI workflows`

## Full Description

```text
NeuralShell is a desktop workstation for local AI and developer workflows.

The app is designed around controlled local operation rather than loose desktop automation. The current build emphasizes:
- strict IPC validation between application boundaries
- offline-first defaults
- release provenance and verification gates
- structured beta intake and support flow

NeuralShell is currently in public beta as V2.0-RC-Final.

Support and issue intake:
https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose
```

## Store Screenshot Set Ready

Generated with:

`npm run channel:store:screenshots`

Screenshot set directory:

- `release/store-assets/microsoft-store/V2.0-RC-Final/`
- Manifest: `release/store-assets/microsoft-store/V2.0-RC-Final/manifest.json`
- Index: `release/store-assets/microsoft-store/V2.0-RC-Final/README.md`

Recommended required upload order:
1. `02-main-workspace.png`
2. `03-session-management.png`
3. `04-settings-and-profiles.png`
4. `05-runtime-and-integrity.png`

Optional extras:
1. `01-onboarding-safe-defaults.png`
2. `06-command-palette.png`

Still missing:
1. 1200x630 hero/banner image
2. Short demo clip

## Upload Assets Available Now

- `assets/icon.ico`
- `assets/icon-512.png`
- `dist/NeuralShell Setup V2.0-RC-Final.exe`
- Published installer: `NeuralShell.Setup.V2.0-RC-Final.exe`
- Store screenshot set: `release/store-assets/microsoft-store/V2.0-RC-Final/`

## Submission Notes

- Use the `EXE/MSI` submission path.
- Do not promise cloud features or hosted services that are not present.
- Use the GitHub issue form as the current support route.
- Use the screenshot upload order above so the first four images cover workspace, sessions, settings, and integrity.
- The remaining blocker is the manual Partner Center submission flow, not missing assets.
