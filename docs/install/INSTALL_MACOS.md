# Install Guide: macOS (DMG / ZIP)

> **⚠️ Not yet available.** The macOS DMG build is planned but has not been published. This guide is provided for when the build ships. Currently only Windows x64 is available.

## Requirements
- macOS 11 (Big Sur) or later
- ~200 MB disk space

## Download
Download `NeuralShell-2.1.29.dmg` (or `.zip`) from the release page.

## Verify Integrity (Optional)
```bash
shasum -a 256 NeuralShell-2.1.29.dmg
# Compare against checksums.txt
```

## Install (DMG)
1. Double-click the `.dmg` to mount it
2. Drag **NeuralShell** into the **Applications** folder
3. Eject the DMG

## Install (ZIP)
1. Extract the `.zip`
2. Move `NeuralShell.app` to `/Applications`

## Gatekeeper Warning
If macOS blocks the app ("from an unidentified developer"):
- **Option A**: Right-click → Open → Open (bypasses Gatekeeper for this app)
- **Option B**: Run in Terminal:
```bash
xattr -cr /Applications/NeuralShell.app
```

## First Launch
1. Open NeuralShell from the Applications folder or Spotlight
2. Complete the onboarding wizard (set up your LLM connection profile)
3. Settings are stored in `~/Library/Application Support/neuralshell-v5/`

## Upgrade
Download the new DMG/ZIP and replace the app in `/Applications`. User data is preserved.

## Uninstall
1. Move `NeuralShell.app` from `/Applications` to Trash
2. Optionally remove user data:
```bash
rm -rf ~/Library/Application\ Support/neuralshell-v5/
```
