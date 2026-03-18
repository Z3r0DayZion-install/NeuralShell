# Phase 7 Wave 2 Implementation: Bridge Resilience & Heartbeat Hardening

This wave improves the reliability of NeuralShell's bridge connection handling by hardening the state management, stabilizing heartbeat/reconnection logic, and ensuring deterministic UI transitions.

## Key Changes

### [Component] Core LLM Service
Refined status emissions and health check precision.

#### [MODIFY] [llmService.js](src/core/llmService.js)
- **Request Sequencing**: Added `_lastRequestSeq` to `LLMService` to track the most recent request.
- **Damped Emissions**: Updated `_withRetry` to only emit `online`, `reconnecting`, or `error` if the request sequence matches the most recent request, preventing stale status leaks from concurrent or delayed retries.
- **Redundancy Cleanup**: Removed manual `_emitStatus` calls within the `chat` method, delegating status management entirely to the sequence-aware `_withRetry` wrapper.

### [Component] Main Process
Hardened the background bridge health loop and reconnection logic.

#### [MODIFY] [main.js](src/main.js)
- **Status Damping**: Introduced `_lastBridgeStatusSent` to prevent redundant IPC messages if the bridge state hasn't changed.
- **Checking Guard**: Added `_isBridgeHealthCheckInProgress` to prevent overlapping health checks if a previous check hangs or exceeds the 12s interval.
- **Reconnection Damping**: Ensured `applyBridgeSettings` is only triggered if the bridge is not already in a `bridge_reconnecting` state, preventing redundant re-configurations during reconnection attempts.

### [Component] Renderer Process
Improved UI resilience and feedback for bridge states.

#### [MODIFY] [renderer.js](src/renderer.js)
- **Epoch-Based Guards**: Introduced `llmStatusEpoch` in `appState`. Manual diagnostic actions (Detect, Health Check, Model Refresh) now increment this epoch.
- **Stale Protection**: Updated `applyLlmStatus` to ignore background heartbeat updates if a newer manual epoch is active. This prevents background heartbeat failures from overwriting a successful manual detection result.
- **Enriched Messaging**: Enhanced `describeLlmStatus` to provide clearer details for `bridge_reconnecting` and `error` states, improving user feedback during connection drops.

## Summary of Hardened States

| State | Logic Source | UI Feedback (Short) | Tone |
| :--- | :--- | :--- | :--- |
| `bridge_online` | Heartbeat / Manual | Bridge healthy. | `ok` |
| `bridge_reconnecting` | Heartbeat / Manual | Reconnecting to bridge... | `warn` |
| `bridge_offline` | Heartbeat / Manual | Bridge offline. | `warn` |
| `error` | Heartbeat / Catch | Bridge error detected. | `bad` |
| `booting` | Initial State | Probing bridge... | `ok` |
