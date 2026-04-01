# Phase 9: MVP Scope Definition

This document defines the product boundaries for the NeuralShell MVP (Alpha).

## IN SCOPE
- **One Usable End-to-End Workflow**: A stable, offline-first loop (Start -> Attach -> Interact -> Save).
- **Stable Bridge Connection**: Reliable detection and heartbeat logic for the workspace bridge.
- **Session Persistence**: Context and message history must survive application restarts.
- **Project/Workspace Usefulness**: Attached workspace files must be performantly indexed/queried.
- **Simple Alpha Launch Path**: Reduction of "developer-only" setup steps (e.g., config file manual edits).

## OUT OF SCOPE
- **Major New Empire Modules**: No significant architectural additions beyond the V2 baseline.
- **Advanced Monetization**: No licensing, payment, or subscription logic in this phase.
- **Deep Telemetry Expansion**: Basic loop telemetry only; no advanced analytics.
- **Broad UI Redesign**: Focus on usability fixes, not a total visual overhaul.
- **New Release-Proof Packaging**: No complex ZIP/Manifest/Verifier cycles beyond standard dev-builds.
