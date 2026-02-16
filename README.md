# NeuralShell Desktop

## Run
```bash
npm install
npm start
```

## Run Headless (No Window)
```bash
npm run start:headless
```

On first auth login, the app requires PIN setup. Enter a PIN in the auth field and use Login to initialize it.
If you forget the PIN, enter a new PIN, type `RESET PIN`, and use `Recover PIN` to rotate credentials locally.

## What is Included
- Local Electron shell for NeuralShell
- LLM bridge to local Ollama-style endpoint (`127.0.0.1:11434`)
- Timestamped chat UI with persistent session history
- Built-in diagnostics (self-test + button audit)

## Utility Scripts
```bash
npm run lint:js
```
