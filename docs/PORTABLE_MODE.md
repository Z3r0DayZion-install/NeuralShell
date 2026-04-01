# Portable Mode (Windows)

## What It Does

Portable mode keeps NeuralShell runtime data in a local `portable-data` folder next to the executable, instead of `%APPDATA%`.

## How To Run

From `dist/win-unpacked`:

```powershell
$env:NEURAL_PORTABLE_MODE = "1"
.\NeuralShell.exe --portable-mode
```

Optional custom portable data path:

```powershell
$env:NEURAL_PORTABLE_MODE = "1"
$env:NEURAL_PORTABLE_DATA_DIR = "D:\NeuralShellPortableData"
.\NeuralShell.exe --portable-mode
```

## Portable Folder Requirement

NeuralShell is not a single-file portable app. Keep the full `win-unpacked` folder together with `NeuralShell.exe`, `resources`, and runtime DLLs.

## Multi-Device Practical Use

For device-to-device carry:

1. close NeuralShell
2. copy `dist/win-unpacked` including `portable-data`
3. run on the target device with `--portable-mode`

Session payloads remain passphrase-gated. Environment-specific trust prompts can still vary by machine policy.
