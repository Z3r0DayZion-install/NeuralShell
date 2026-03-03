# Release Stabilization Checklist

## Build Artifacts
- Confirm `dist/win-unpacked/NeuralShell.exe` exists and launches.
- Confirm `dist/win-unpacked/resources/app.asar` exists and is non-empty.
- Confirm `dist/win-unpacked/resources/app-update.yml` exists.

## Core Flows
- Setup wizard: test bridge, save profile, continue.
- Auto-connect: restart app and verify bridge reconnect behavior.
- Send prompt, simulate failure, flush queue.
- Session save/load/rename/delete/duplicate.
- Settings apply with guardrail errors and valid save path.

## Advanced UI
- Command palette open/filter/run.
- Focus mode and density toggle.
- Split preview on/off and divider drag.
- Theme studio save/reset and contrast message.
- Snapshot save/load/diff.
- Template save/apply/export/import.
- Backup restore latest.

## Logs and Safety
- Run self-test command.
- Load/export app logs and chat logs.
- Verify no uncaught UI errors in normal interaction.

## Release Gate
- Run `npm run release:gate`.
- Run `npm run release:gate:strict` when validating machine-level launch stability.
- If strict launch fails, run `npm run diagnose:packaged` and inspect `release/packaged-launch-diagnostic.json`.
- If installer packaging fails due NSIS mmap, ship `win-unpacked` and track installer issue separately.
- Run `npm run release:manifest` and archive `release/manifest.json`.
- Run `npm run release:checksums` and archive `release/checksums.txt` + `release/checksums.json`.
- Run `npm run release:verify:fresh` for default unpacked-or-installer validation.
- Run `npm run release:verify:fresh:strict` when installer presence must be enforced.
- For full automated pass, run `npm run ship`.
