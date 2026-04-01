# NeuralShell V2.1 UI Handoff (Stealth Tactical)

## Intelligence Surface
The landing surface is designed to be a "Mission Readiness" dashboard for the operator.

### Starter Actions Grid
- **Audit System**: Triggers `/autodetect` for environment verification.
- **Scan Network**: Triggers `/health` for bridge node discovery.
- **Launch Tunnel**: Triggers `bridge:reconnect` for secure LLM routing.
- **State**: Hovering over a card triggers a pulsing amber visual (`.visual-pulse`).

### Recovery Banner
- **Trigger**: Activates automatically during bridge outages, connection stalls, or coordination conflicts.
- **Visual**: Amber background with pulsing alert animation.
- **Behavior**: Persistent until the state is resolved (e.g., bridge reconnected).

## Workspace Switcher (Fleet Board)
- **Urgency Signals**: Urgency scores translate to border-left colors (Green, Amber, Red).
- **Signal Badges**: Real-time indicators for "Git" status, "Node" environment, and "Risk" tiers.
- **State Persistence**: Urgency and attention markers are synced across the Electron runtime.

## Terminal Overlay
- **Log Density**: Compact monospace layout designed for high-volume telemetry.
- **Risk Tier Badge**: Displays "Low", "Med", or "High" risk based on the active chain template.
- **Interaction**: Gate states are prominently highlighted with border-left accent colors.
