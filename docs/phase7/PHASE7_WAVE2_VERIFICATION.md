# Phase 7 Wave 2 Verification: Bridge Resilience

Verification of bridge lifecycle hardening, heartbeat stability, and race condition prevention.

## Verification Scenarios

### 1. Cold Start Resilience
- **Condition**: Start application with local Ollama service stopped.
- **Expected**: UI shows `booting` -> `bridge_reconnecting` (if `connectOnStartup: true`).
- **Result**: **PASS**
- **Log**: Main process correctly triggers `applyBridgeSettings` once, sends `bridge_reconnecting`. 12s loop continues without redundant config calls.

### 2. Bridge Loss Detection
- **Condition**: Start with healthy bridge, then stop local service.
- **Expected**: Within 12s, UI transitions to `bridge_reconnecting` with enriched detail text.
- **Result**: **PASS**
- **Log**: `_lastBridgeStatusSent` prevents redundant "offline" signals. Detail text correctly explains reconnection logic.

### 3. Graceful Recovery
- **Condition**: Restart local service while UI shows `bridge_reconnecting`.
- **Expected**: Within 12s, UI transitions to `bridge_online`.
- **Result**: **PASS**
- **Log**: `llmService.getHealth()` succeeds, `main.js` sends `bridge_online`, renderer updates status epoch.

### 4. Manual vs. Heartbeat (Race Condition)
- **Condition**: Manually trigger "Detect Local Bridge" while a background heartbeat is pending failure.
- **Expected**: Successful manual detection results are NOT overwritten by the failing background heartbeat.
- **Result**: **PASS**
- **Log**: Manual detect increments `llmStatusEpoch`. `applyLlmStatus` correctly ignores heartbeat IPC with matching/lower sequence during reconciliation.

### 5. Request Sequencing (Internal)
- **Condition**: Trigger multiple chat requests in rapid succession (e.g., via CLI or fast clicking).
- **Expected**: Status transitions (`reconnecting` -> `online`) only reflect the *final* request's state.
- **Result**: **PASS**
- **Log**: `llmService._lastRequestSeq` correctly filters out stale status emissions from early retries.

## Final Status
| Gate | Status |
| :--- | :--- |
| Main Process Damping | **PASS** |
| Renderer Epoch Guards | **PASS** |
| Service Request Sequencing | **PASS** |
| Enriched Messaging | **PASS** |

**Verification Date**: 2026-03-17
**Handoff Readiness**: **GOLD**

## Appendix: Raw Verification Logs (Excerpts)

### Scenario 1 & 2 (Cold Start & Loss)
```text
[Main] [BridgeLoop] Health check failed: fetch failed
[Main] [BridgeLoop] connectOnStartup is true, triggering applyBridgeSettings
[Main] [BridgeLoop] Sending status change: bridge_reconnecting
[Renderer] Received llm-status-change: bridge_reconnecting (Epoch: 0)
[Renderer] describeLlmStatus: "Reconnecting to bridge..."
```

### Scenario 4 (Manual Race Condition)
```text
[Renderer] runBridgeAutoDetect: manual=true, incrementing epoch to 1
[Renderer] applyLlmStatus: bridge_online (Epoch: 1)
[Main] [BridgeLoop] Sending status change: bridge_offline (Late heartbeat)
[Renderer] applyLlmStatus: Ignored stale update (Epoch 0 < Current 1)
```

### Scenario 5 (Request Sequencing)
```text
[Service] Request #4: fetch initiated
[Service] Request #5: fetch initiated
[Service] Request #4: error caught, _lastRequestSeq is 5, suppressing status emission
[Service] Request #5: success, emitting "online"
```
