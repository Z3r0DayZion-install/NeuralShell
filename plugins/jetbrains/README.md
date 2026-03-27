# NeuralShell JetBrains Plugin v0.1

This directory now includes a minimal IntelliJ plugin scaffold:

- Action: `NeuralShell: Run Proof`
- Tool window: `NeuralShell Proof` (shows proof output and summary)
- Workflow: runs `npm run proof:bundle` in the current project root

## Build ZIP Artifact

```bash
cd plugins/jetbrains
./gradlew buildPlugin
```

The plugin ZIP is emitted under `plugins/jetbrains/build/distributions/` and can be attached to GitHub Releases.

## Legacy External Tool Adapter

`runInNeuralShell.cjs` remains for users who prefer external tool integration.
