# Mission Control

Mission Control is NeuralShell's runtime authority cockpit introduced in Δ11.

## Purpose
- Give one-glance visibility into core runtime posture.
- Surface operational trust signals without requiring command-line triage.
- Provide direct launch points to NodeChain, Watchdog, First-Boot Funnel, and Split Workspace.

## Panels
- Provider Health: provider, model, latency, sweep status.
- Vault State (VaultPanel+): lock status, active profile, policy binding.
- Proof Engine: status, stage, bundle hash, parity.
- Relay State: enabled state, channel, last send, relay error.
- Collab / Voice: peers, room, RTT, session health.
- Policy / Enforcement: profile, ring, offline-only, approved providers.
- Update Lane: version, check time, signature, staged update signal.
- SEAL / Identity: seal fingerprint, trust state, branding profile.
- Watchdog: supervisor state, pid, ws bridge, last refresh.
- Runtime Event Feed: chronological local event stream.

## Entry Points
- Top bar `Mission` button.
- `/mission` command.
- Ecosystem Launcher `Mission Control` module.

## Accessibility / UX
- Reduced motion compatible (no required animation for state understanding).
- High-contrast card tones map to severity semantics.
- Event feed and cards are keyboard reachable.

## Security
- Data is local runtime state only.
- Secrets are redacted by runtime event sanitization before feed persistence.