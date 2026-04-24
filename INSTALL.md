# NeuralShell Installation Guide

## System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 500 MB free space
- **Internet**: Optional (offline-first capable)

## Quick Install (Recommended)

1. Download `NeuralShell Setup 2.1.29.exe` from the [Releases](https://github.com/Z3r0DayZion-install/NeuralShell/releases) page
2. Double-click the installer
3. Follow the setup wizard (accept defaults)
4. Launch NeuralShell from the Start Menu or Desktop shortcut

## First Launch

On first run, NeuralShell will:
- Create a local workspace in `%APPDATA%/NeuralShell`
- Initialize secure identity storage
- Prompt for LLM provider configuration (optional)

## Configuration

### Built-in LLM Support

NeuralShell works with these providers out of the box:

| Provider | Setup |
|----------|-------|
| **Ollama** (local) | Install Ollama, models auto-detect |
| **OpenAI** | Add API key in Settings |
| **OpenRouter** | Add API key in Settings |
| **Groq** | Add API key in Settings |

### Adding Your API Key

1. Open NeuralShell
2. Click **Settings** (gear icon)
3. Select **Model Provider**
4. Enter your API key
5. Click **Test Connection**

## Troubleshooting

### Installer won't run
- **Cause**: Windows SmartScreen or antivirus
- **Fix**: Click "More info" → "Run anyway" (installer is code-signed)

### App won't start
- **Fix 1**: Check Windows Event Viewer for errors
- **Fix 2**: Delete `%APPDATA%/NeuralShell/state` and restart
- **Fix 3**: Run as Administrator once to initialize permissions

### No LLM responses
- Verify API key in Settings
- Check internet connection
- Try switching to Ollama (local) mode

## Uninstall

1. Windows Settings → Apps → NeuralShell → Uninstall
2. Optionally delete `%APPDATA%/NeuralShell` for complete removal

## Support

- **Documentation**: [Full Docs](docs/CANON.md)
- **Issues**: [GitHub Issues](https://github.com/Z3r0DayZion-install/NeuralShell/issues)
- **Beta Program**: [Join here](https://github.com/Z3r0DayZion-install/NeuralShell/issues/34)

---

**Version**: 2.1.29  
**Released**: April 22, 2026  
**SHA-256**: See [`SHA256SUMS.txt`](SHA256SUMS.txt)  
**Verify installer**: Run [`VERIFY_RELEASE.ps1`](VERIFY_RELEASE.ps1) in PowerShell to confirm signature and hash
