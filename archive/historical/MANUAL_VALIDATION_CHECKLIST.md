# [CANONICAL] MANUAL_VALIDATION_CHECKLIST

## 1. Post-Deployment Verification
After installing NeuralShell, perform the following steps:
1. **Boot Test**: Ensure the application launches without a "Recovery Mode" warning (requires `NEURAL_IGNORE_INTEGRITY=1`).
2. **IPC Handshake**: Open the Command Palette (`Ctrl+P`) and type `help`. Verify a response appears.
3. **LLM Connectivity**: Enter a message in the chat input. Ensure a completion is returned.
4. **Session Persistence**: Create a new session, type a message, switch sessions, and switch back. Verify the message is still there.

## 2. Integrity Verification
1. Run `npm run verify:ship` in the project root.
2. Confirm the result is "READY TO SHIP".

## 3. UI/UX Sanity
1. Verify the "Trust Indicator" on the top status bar is active.
2. Ensure no standard browser context menus are available (right-click should be blocked/custom).
