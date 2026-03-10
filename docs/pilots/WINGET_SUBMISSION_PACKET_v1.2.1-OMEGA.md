# WinGet Submission Packet (v1.2.1-OMEGA)

Use this packet to prepare a `winget-pkgs` submission for `NeuralShell`.

## Generated Manifest Output

Run:

```powershell
python scripts/generate_winget_manifests.py
python scripts/validate_winget_manifests.py
```

Or use the combined command:

```powershell
npm run channel:winget:prepare
```

Equivalent manual commands:

```powershell
python scripts/generate_winget_manifests.py
python scripts/validate_winget_manifests.py
```

Generated files:
- `release/winget/manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA/NeuralShellTeam.NeuralShell.yaml`
- `release/winget/manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA/NeuralShellTeam.NeuralShell.installer.yaml`
- `release/winget/manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA/NeuralShellTeam.NeuralShell.locale.en-US.yaml`
- `docs/pilots/WINGET_PKGS_PR_BODY_v1.2.1-OMEGA.md`

## Current Metadata

- Package identifier: `NeuralShellTeam.NeuralShell`
- Package name: `NeuralShell`
- Publisher: `NeuralShell Team`
- Version: `1.2.1-OMEGA`
- Manifest schema: `1.12.0`
- Installer type: `nullsoft`
- Architecture: `x64`
- Published installer asset: `NeuralShell.Setup.1.2.1-OMEGA.exe`
- Installer SHA-256: `BE174A1C14B0FF0CDEA85AE865DD020CEAEE359903073FDBD723AF22ED560E61`

## Published Installer URL

The generator now resolves the live release asset from the GitHub release API and uses this published URL:

`https://github.com/Z3r0DayZion-install/NeuralShell/releases/download/v1.2.1-OMEGA/NeuralShell.Setup.1.2.1-OMEGA.exe`

This is the correct public asset path for submission. The local `dist` filename differs from the published GitHub release filename, so do not use the local path directly in a `winget` manifest.

If needed, regenerate with a custom URL:

```powershell
python scripts/generate_winget_manifests.py --installer-url "https://your-public-installer-url.exe"
```

## Submission Checklist

1. Confirm the installer URL downloads without authentication.
2. Confirm silent install behavior works for the generated installer.
3. Run local validation with `python scripts/validate_winget_manifests.py`.
4. Review generated YAML files in `release/winget`.
5. Copy the generated files into a local clone of `winget-pkgs`.
6. Open the submission PR.

## Supporting Links

- Repo: `https://github.com/Z3r0DayZion-install/NeuralShell`
- Release: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.2.1-OMEGA`
- Support: `https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose`
- Privacy policy: `https://github.com/Z3r0DayZion-install/NeuralShell/blob/master/docs/PRIVACY_POLICY.md`
