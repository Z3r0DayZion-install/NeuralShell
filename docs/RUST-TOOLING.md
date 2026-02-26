# Rust Tooling

This repo includes optional Rust tooling.

## Commands

- `npm run rust:release` produces a bundle under `out/releases/` (desktop + docker + git metadata).
- `npm run rust:core:test` runs unit tests for the Rust router-core.
- `npm run support:bundle` produces a redacted support bundle under `out/support/`.

## Windows build prerequisites

Rust crates need a linker toolchain.

- Install Visual Studio Build Tools (MSVC) for the smoothest experience, or
- Install MinGW-w64 (GNU).

The wrapper `scripts/run-cargo.mjs` auto-selects an available toolchain, or you can override with:

- `NEURALSHELL_CARGO_TOOLCHAIN=stable-x86_64-pc-windows-msvc`

See `RUST.md`.
