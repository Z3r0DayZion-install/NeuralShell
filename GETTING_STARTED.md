# Getting Started with NeuralShell

Welcome to NeuralShell — your local-first operator shell for autonomous workflows.

## 5-Minute Quick Start

### 1. Install
Download `NeuralShell Setup 2.1.29.exe` and double-click to install. The installer will:
- Create a Start Menu shortcut
- Add a Desktop icon (optional)
- Set up auto-updates

### 2. Launch
Open NeuralShell. You'll see:
- **Command Palette** (top) — your control center
- **Thread Rail** (left) — conversation history
- **Workbench** (center) — active workspace
- **Status Bar** (bottom) — system indicators

### 3. Configure Your AI
**Option A: Local AI (Free, Private)**
1. Install [Ollama](https://ollama.com) if you haven't
2. In NeuralShell, go to **Settings** → **Model Provider**
3. Select **Ollama**
4. Models will auto-detect

**Option B: Cloud AI (More Powerful)**
1. Get an API key from [OpenAI](https://openai.com), [OpenRouter](https://openrouter.ai), or [Groq](https://groq.com)
2. Paste it in **Settings** → **Model Provider**
3. Click **Test Connection**

### 4. Your First Command
Press `Ctrl+Shift+P` (or click the search icon) to open the Command Palette.

Try these:
- `/help` — Show all commands
- `/clear` — Clear current chat
- Type any question — Get AI-powered responses

### 5. Create a Thread
1. Click **+ New Thread** in the left rail
2. Give it a name
3. Start working — each thread is isolated

## Key Features

| Feature | How to Use |
|---------|------------|
| **Command Palette** | `Ctrl+Shift+P` |
| **Quick Actions** | Type `/` for slash commands |
| **Thread Switching** | Click any thread in the left rail |
| **Settings** | Gear icon or `Ctrl+,` |
| **Lock/Unlock** | Click the lock icon to encrypt threads |

## Pro Tips

**Offline Mode**
With Ollama, NeuralShell works 100% offline. No internet required after initial setup.

**Keyboard Shortcuts**
- `Ctrl+Shift+P` — Command palette
- `Ctrl+,` — Settings
- `Ctrl+N` — New thread
- `Ctrl+W` — Close thread

**Custom Workflows**
Create reusable command sequences in **Settings** → **Workflows**.

## Troubleshooting

**App won't start?**
- Delete `%APPDATA%/NeuralShell/state` and restart
- Run as Administrator once

**No AI responses?**
- Check your API key in Settings
- Verify internet connection (for cloud providers)
- Try switching to Ollama mode

**Need help?**
- [Full Documentation](docs/CANON.md)
- [GitHub Issues](https://github.com/Z3r0DayZion-install/NeuralShell/issues)

---

**You're ready to go.** The Command Palette is your friend — just start typing.
