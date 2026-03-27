# Enterprise Deployment Guide

This guide covers unattended NeuralShell deployment with offline-safe defaults.

## Deployment Defaults

Enterprise deployment templates set:

- `LICENSE_MODE=auditor` (free baseline)
- remote bridge disabled by default
- proof relay disabled by default
- auto-update disabled by default
- telemetry export opt-in only

## Windows (MSI)

Use the deployment script:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/windows/install_silent.ps1 `
  -MsiPath "C:\Packages\NeuralShell.msi" `
  -InstallDir "C:\Program Files\NeuralShell"
```

Enable optional lanes:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/windows/install_silent.ps1 `
  -MsiPath "C:\Packages\NeuralShell.msi" `
  -EnableAutoUpdate `
  -EnableRelay
```

Intune command example:

```text
powershell.exe -ExecutionPolicy Bypass -File .\install_silent.ps1 -MsiPath .\NeuralShell.msi
```

## macOS (PKG)

Use the deployment script:

```bash
chmod +x deploy/macos/install_silent.sh
./deploy/macos/install_silent.sh ./NeuralShell.pkg /Applications /tmp/neuralshell_install.log
```

Jamf policy command example:

```bash
/bin/bash /path/to/install_silent.sh /path/to/NeuralShell.pkg
```

## Verification

1. Launch app once and confirm `Audit-Only` tier is visible.
2. Confirm provider lane shows local-only mode.
3. Confirm proof relay is off by default.
4. Confirm telemetry export remains disabled until explicitly enabled.

## Troubleshooting

- Windows MSI logs: `%TEMP%\neuralshell_msi_install.log`
- macOS installer logs: `/tmp/neuralshell_install.log`
- Runtime env file:
  - Windows portable/deploy lane: `NeuralShell.runtime.env` beside executable
  - macOS app bundle: `NeuralShell.app/Contents/MacOS/NeuralShell.runtime.env`
