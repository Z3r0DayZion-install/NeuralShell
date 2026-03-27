# NeuralShell VSCode Extension v0.1

Command: `NeuralShell: Run Proof`

Behavior:
- Opens a diff view (`HEAD` vs working file) for the active editor file.
- Connects to local daemon bridge `ws://127.0.0.1:55015` using JWT token env (`NS_DAEMON_WS_TOKEN` or `NS_DAEMON_JWT_SECRET`).
- Streams proof logs to the `NeuralShell` output channel.
- Prints final status as `✅/❌ + SHA` in output and side panel.

Panel:
- Activity bar icon: **NeuralShell**
- View: **Proof Status**
