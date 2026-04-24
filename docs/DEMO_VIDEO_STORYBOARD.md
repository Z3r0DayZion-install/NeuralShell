# NeuralShell Demo Video Storyboard

**Target Length:** 2 minutes  
**Resolution:** 1920x1080 (1080p)  
**Framerate:** 60fps  
**Audio:** Voiceover + subtle electronic music  

---

## Scene 1: The Hook (0:00 - 0:15)

### Visual
- Black screen → NeuralShell logo fades in with glitch effect
- Quick cuts of scary headlines about AI data leaks
- Cut to presenter (you) looking serious

### Voiceover
> "Your AI sees everything. Your code. Your secrets. Your intellectual property. Stored on someone else's server. What if I told you there's another way?"

### On-Screen Text
```
"What if your AI sessions survived OS reinstalls...
but ONLY on your machine?"
```

---

## Scene 2: The Setup (0:15 - 0:45)

### Visual
- Screen recording: Clean desktop
- Double-click "NeuralShell Setup 2.1.29.exe"
- NSIS installer wizard appears
- Click through EULA, select install location
- Progress bar fills
- "Completed" screen → Click Finish

### Voiceover
> "This is NeuralShell. Local-first AI operator shell. Watch what happens when I create a session."

### On-Screen Actions
```bash
# (Show in terminal/demo window)
$ neuralshell
🔐 NeuralShell v2.1.29
🖥️  Hardware-bound mode: ACTIVE
🔑 Identity: a3f7...e2d9 (verified)
```

---

## Scene 3: The Session (0:45 - 1:15)

### Visual
- NeuralShell UI opens
- Hardware binding indicator (🔒) glows green in status bar
- Create new thread: "Secret Architecture Plan"
- Type: "Design a secure messaging system"
- AI responds with architecture diagram
- Show 3-4 back-and-forth messages
- Export button clicked → "backup.enc" created

### Voiceover
> "This session is now cryptographically bound to my hardware—CPU serial, BIOS UUID, baseboard ID. Even if I encrypt the backup and email it to myself, it won't work on any other machine."

### On-Screen Text Overlay
```
Session encrypted with:
- AES-256-GCM
- Hardware-derived key
- Signed with machine identity
```

---

## Scene 4: The Wipe (1:15 - 1:35)

### Visual
- Close NeuralShell completely
- Open File Explorer
- Navigate to `%APPDATA%/NeuralShell`
- DRAG FOLDER TO RECYCLE BIN with dramatic effect
- Show recycle bin with folder inside
- **Right-click → Delete Permanently**
- Confirm dialog: "Are you sure?" → YES
- Open NeuralShell again → shows empty state

### Voiceover
> "Now watch. I'm going to delete all application data. This simulates an OS reinstall, corrupted drive, whatever. The app data is gone."

### Dramatic Pause
- 2 seconds of silence
- Sound effect: Trash emptying

---

## Scene 5: The Impossible Restore (1:35 - 1:55)

### Visual
- NeuralShell empty state
- Click: "Import from Backup"
- Select "backup.enc" file
- Enter passphrase (password dots appear)
- Click: "Restore & Verify"
- **LOADING SPINNER** (2 seconds)
- Success screen appears:
  ```
  ✅ Backup decrypted
  ✅ Hardware signature verified: MATCH
  ✅ Session restored successfully
  ```
- Thread "Secret Architecture Plan" appears with ALL previous messages intact

### Voiceover
> "But because the backup is signed with my hardware identity, I can restore it—only on this machine. The session survived."

### Zoom Effect
- Slow zoom into the restored conversation
- Highlight: "This shouldn't be possible... but it is."

---

## Scene 6: The Lock (1:55 - 2:10)

### Visual
- Try to copy "backup.enc" to USB drive
- Insert USB into different laptop
- Try to restore on second laptop
- Error message:
  ```
  ❌ Hardware signature verification failed
  Expected: a3f7...e2d9
  Found:    8b2c...f1a4
  This backup is locked to the original machine.
  ```

### Voiceover
> "Try to restore it on different hardware? Won't work. The cryptographic signature doesn't match. Your sessions are yours alone."

---

## Scene 7: The Reveal (2:10 - 2:25)

### Visual
- Quick montage of other features:
  - Air-gap mode (wifi icon crossed out, AI still responding)
  - Audit export (PDF generation)
  - Agent marketplace
- Back to presenter smiling

### Voiceover
> "That's NeuralShell. Hardware-bound sessions. Air-gapped mode. Audit-ready logs. Your AI, your hardware, your privacy."

---

## Scene 8: CTA (2:25 - 2:30)

### Visual
- Screen fades to NeuralShell branding
- Download button pulses
- GitHub stars count (if impressive)
- End card with logo

### On-Screen Text
```
NeuralShell
The AI operator shell for paranoid developers

🖥️  Windows 10/11
📦 305 MB • Checksum-verified • 0 vulnerabilities
⬇️  Download free at neuralshell.app

🔒 Hardware-bound • 📴 Offline capable • 📋 Audit-ready
```

### Voiceover
> "Download it. Verify it. See for yourself."

---

## Technical Production Notes

### Recording Setup
- **Screen:** Use OBS Studio (free)
- **Settings:** Output 1920x1080, 60fps, CQP 20 quality
- **Audio:** USB microphone (Blue Yeti or similar)
- **Hosting:** Clean Windows 11 VM for consistent look

### Recording Order
1. Record scenes 2, 3, 4, 5, 6 in one take (continuous screen recording)
2. Record presenter shots (scenes 1, 7)
3. Record voiceover separately for audio quality
4. Assemble in DaVinci Resolve (free) or Premiere

### Transitions
- Scene 1→2: Glitch effect
- Scene 4→5: Dramatic pause with heartbeat sound
- Scene 5→6: Quick cut with "locked" sound effect
- Scene 7→8: Fade to black → Fade up on end card

### Music
- **Genre:** Ambient electronic / cyberpunk
- **Source:** Artlist.io or Epidemic Sound
- **Volume:** -20dB under voiceover
- **Key moments:** Accent on "impossible restore" and final CTA

### Export Settings
- **Format:** MP4 (H.264)
- **Bitrate:** 10 Mbps
- **Audio:** AAC, 320kbps
- **File size target:** Under 100MB for easy sharing

---

## Alternative: 30-Second Teaser

For Twitter/X, cut to:

1. **0:00-0:05** - Hook: "I deleted my AI app. Then restored the session."
2. **0:05-0:15** - Show wipe + restore process (fast cuts)
3. **0:15-0:25** - Show restored conversation
4. **0:25-0:30** - CTA: "NeuralShell. AI that survives."

Export: Vertical 1080x1920 for mobile viewing.
