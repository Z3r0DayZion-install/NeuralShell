# NeuralShell Hacker News Launch Package

## Title Options

**Primary:**
> "Show HN: I built an AI shell that survives OS reinstalls and works offline"

**Alternatives:**
- "Show HN: Hardware-bound AI operator shell with cryptographic session continuity"
- "Show HN: The AI shell for paranoid developers (local-first, hardware-bound)"
- "Show HN: Cursor alternative that doesn't trust the cloud"

## Opening Comment Template

```markdown
After using Cursor and Claude Desktop, I got paranoid about cloud AI having access to my codebase and conversations.

So I built NeuralShell - a local-first AI operator shell that:

1. **Survives OS reinstalls** - Sessions cryptographically bound to your hardware (CPU + BIOS + UUID)
2. **Works 100% offline** - Bundle Ollama, never touch the internet
3. **Audit-ready logs** - Every interaction hashed, tamper-evident compliance reports

**The demo:** Create an encrypted thread, wipe your app data, reinstall - the session restores but ONLY on your original hardware.

**Built for:** Crypto founders, security researchers, air-gapped environments

**Not for:** People who want "it just works" (this requires Ollama setup)

[2-min demo video] | [GitHub] | [Download 305MB installer]

Tech: Electron 41, React 18, Node 22, 182 automated security assertions

What would make this undeniable for you?
```

## Demo Video Script (2 minutes)

**0:00-0:15** - Hook
- "This is my AI shell. Watch what happens when I wipe it."

**0:15-0:45** - Create session
- Open NeuralShell
- Show hardware binding status (green checkmark)
- Create thread "Secret Project Alpha"
- Type: "Plan a secure messaging architecture"
- Show AI response

**0:45-1:15** - The wipe
- Close app
- Navigate to `%APPDATA%/NeuralShell`
- DELETE the folder (dramatic)
- "App data is gone. This is a fresh install."

**1:15-1:45** - The restore
- Reopen NeuralShell
- "Import from backup"
- Select encrypted backup file
- Enter passphrase
- **Session restored with all history**
- Show: "Hardware verified ✅ Same machine detected"

**1:45-2:00** - The lock
- "Try to restore on different hardware"
- Show signature verification failure
- "Won't work. Cryptographically bound to THIS machine."

**End card:**
> "NeuralShell. Your AI, your hardware, your logs."
> Download | GitHub | Beta signup

## Landing Page Copy

### Hero Section
```
NeuralShell
The AI operator shell for paranoid developers

✓ Hardware-bound sessions (survives OS reinstalls)
✓ 100% offline capable (air-gapped mode)
✓ Audit-ready logs (compliance exports)
✓ Local-first (your data never leaves)

[Download for Windows] [macOS] [Linux]
```

### Problem/Solution
```
Problem: Cloud AI sees everything
- Your codebase
- Your conversations  
- Your intellectual property
- Stored on someone else's server

Solution: NeuralShell
- Runs locally (Ollama, not OpenAI)
- Hardware-bound (survives reinstalls, locks to machine)
- Audit trails (compliance-ready logs)
- You control everything
```

### Who It's For
```
Built for:
• Crypto/fintech founders (audit requirements)
• Security researchers (provable claims)
• Air-gapped environments (classified work)
• Solo operators (privacy-focused)

Not for:
• Non-technical users (requires Ollama setup)
• People who want "magic" (this is an operator shell)
• Teams needing cloud sync (single-device only)
```

### Social Proof (Collect These)
```
"As a security researcher, I can verify every cryptographic claim
through the source code. This is rare." - [Person], [Role]

"We use this in our air-gapped lab. Only offline AI tool that passed
our compliance review." - [Person], [Defense contractor]

"Hardware-bound sessions solved our 'laptop lost, keys exposed' problem."
- [Person], [Crypto founder]
```

## Launch Checklist

- [ ] Record 2-min demo video (OBS, 1080p)
- [ ] Create HN account (if new, warm up with comments first)
- [ ] Post at optimal time: Tuesday 9am PST
- [ ] Monitor first 2 hours (respond to all comments)
- [ ] Have download link ready (GitHub releases)
- [ ] Prepare for traffic spike (verify CDN/limits)

## Response Templates

**"Why not just use Ollama directly?"**
> Ollama is the engine. NeuralShell is the operator shell - session management, hardware binding, audit trails, and agent workflows. Think "Docker vs Kubernetes"

**"Why Electron? It's heavy."**
> 305MB includes hardened security layer, 182 automated assertions, and cryptographic libraries. It's a tradeoff for provable security properties.

**"What's the business model?"**
> Currently free during beta. Planning: free for personal use, paid for enterprise features (fleet management, advanced audit)

**"Can I verify the hardware binding claims?"**
> Yes - the source is open. Check `src/core/identityKernel.js` and `src/core/hardwareBinding.js`. All tests pass.

## Success Metrics

| Metric | Target |
|--------|--------|
| HN Upvotes | 500+ |
| Comments | 100+ |
| Downloads (48h) | 1000+ |
| GitHub stars (48h) | 200+ |
| Beta signups | 100+ |

## Follow-Up Content (Schedule)

**+1 Day:** "Building hardware-bound identity in Electron" (technical deep-dive)
**+3 Days:** "SOC2 prep for solo devs" (compliance journey)
**+1 Week:** "Show HN: Agent marketplace for NeuralShell" (monetization angle)
