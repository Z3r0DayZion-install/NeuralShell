# NeuralShell Rust Workspace

This repo is primarily Node/Electron, but it includes optional Rust tooling:

- `crates/neuralshell-core`: router-core primitives (selection/scoring) for future use.
- `tools/rust/neuralshell-core-cli`: CLI wrapper around `neuralshell-core`.
- `tools/rust/neuralshell-release`: release/bundling automation.

## Requirements (Windows)

Rust itself is installed, but building native crates requires a linker toolchain:

- MSVC: Visual Studio Build Tools (recommended), or
- GNU: MinGW-w64 (gcc + dlltool).

If you don’t have either, `scripts/run-cargo.mjs` will fail with a clear message.

## Build

```powershell
node scripts/run-cargo.mjs build -p neuralshell-release
node scripts/run-cargo.mjs build -p neuralshell-core-cli
node scripts/run-cargo.mjs test -p neuralshell-core
```

## Run

```powershell
npm run rust:release
npm run support:bundle
```
