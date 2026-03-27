# NeuralShell Market Readiness: Front 2 — First-Run Experience

## 2.1 First-Launch State Audit
- **Current Issue:** Empty shell syndrome. New users see a command palette but no immediate guidance.
- **Risk:** High bounce rate for users who don't know the specific `/` or `!` command syntax.

## 2.2 Fastest Path to Value: "The 30-Second Win"
**Objective:** The user should run their first "Operator Action" within 30 seconds of launch.

### First-Run Sequence:
1. **Welcome Overlay:** A clean modal (not a wall of text) with 3 clear buttons:
   - "Analyze Local Files" (Opens workbench and suggests a `/scan` command).
   - "Load Model Context" (Guides user to connect their first local model).
   - "View Audit Proof" (Shows off the trust-badge and security status).
2. **Interactive Command Ghosting:** The command palette should "ghost" or suggest a sample command like `/sys:demo` on first open.

## 2.3 Terminology Simplification in UI
- **Top Bar:** Rename "OMEGA-CORE-v2.1" to "Trust Status: VERIFIED".
- **Left Rail:** Label icons (Command, Workbench, Memory, Audit) on hover or with simple text labels for first 3 sessions.
- **Center Lane:** Default empty thread should contain a "Quick Action" card with real buttons that execute commands.

## 2.4 Action Plan
- [ ] Implement `WelcomeOverlay.js` component for v5.
- [ ] Add "Quick Action" cards to the default thread state in `ThreadSurface.js`.
- [ ] Update `CommandPalette.js` to show placeholder suggestions for first-run users.
