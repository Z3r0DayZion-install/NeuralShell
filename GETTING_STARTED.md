# Getting Started with NeuralShell

NeuralShell is a local-first AI operator shell for secure, offline, hardware-bound workflows.

## Quick Start

### 1. Download and Install

Download from the [Releases page](https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v2.1.29):

#### Windows (available now)
```powershell
# Verify the installer hash before running
Get-FileHash ".\NeuralShell Setup 2.1.29.exe" -Algorithm SHA256
# Run the full verification suite
.\VERIFY_RELEASE.ps1
```
Double-click `NeuralShell Setup 2.1.29.exe` and follow the wizard (accept defaults). NeuralShell will:
- Create a Start Menu shortcut and Desktop icon
- Initialize a local workspace in `%APPDATA%/NeuralShell`
- Establish a hardware-bound identity on first launch

> **macOS and Linux** builds are planned but not yet available.

### 2. Configure Your AI Provider

**Option A: Local AI — fully offline, no API key needed**
1. Install [Ollama](https://ollama.com)
2. In NeuralShell: **Settings → Model Provider → Ollama**
3. Models auto-detect

**Option B: Cloud AI**
1. Get an API key from [OpenAI](https://openai.com), [OpenRouter](https://openrouter.ai), or [Groq](https://groq.com)
2. **Settings → Model Provider** → paste key → **Test Connection**

### 3. Create Your First Thread

1. Press `Ctrl+Shift+P` to open the Command Palette
2. Click **+ New Thread** in the left rail
3. Start typing — each thread is isolated

### 4. Run the Proof Flow (Recommended)

Before relying on NeuralShell for sensitive work, verify its hardware-binding claims yourself:

1. Create a thread and do some work
2. Click **Export Session** → save `backup.enc`
3. Close NeuralShell
4. Delete `%APPDATA%/NeuralShell` entirely
5. Reopen NeuralShell → **Import from Backup** → select `backup.enc`
6. Confirm: session restores on this machine, and returns an error on any other

Full scenario documentation: [proof/latest/](proof/latest/)

## Key Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | `Ctrl+Shift+P` |
| Settings | `Ctrl+,` |
| New Thread | `Ctrl+N` |
| Close Thread | `Ctrl+W` |

## Offline Mode

With Ollama installed, NeuralShell runs fully offline. Disconnect your network and confirm local workflows still execute — no cloud dependency.

## Troubleshooting

**App won't start**
- Delete `%APPDATA%/NeuralShell/state` and restart
- Run as Administrator once to initialize permissions

**No AI responses**
- Verify API key in Settings
- Check internet connection (cloud providers only)
- Switch to Ollama for offline operation

**SmartScreen warning on installer**
- Click "More info" → "Run anyway"
- Verify the installer hash against `SHA256SUMS.txt` before running

## More

- [Full Documentation](docs/CANON.md)
- [Verification Proof](landing/proof.html)
- [GitHub Issues](https://github.com/Z3r0DayZion-install/NeuralShell/issues)
