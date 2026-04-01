# PHASE 7 EXECUTION PLAN - NeuralShell

## 1. Baseline Reference
This phase originates from the frozen and archived baseline:
- **Tag**: `neuralshell-phases2-5-goldmaster`
- **Artifact**: `NeuralShell_Evidence_v1.0.zip`
- **Hash**: `c4b9cbfbe0154c30aa875dda8c15252c72cfc507c6c76f4fae94528ea22c7bce`

## 2. First Execution Wave: Scope
The initial focus is on environment hygiene and telemetry foundation:
- **Environment Isolation**: Formalize the separation of release-staged artifacts from the active workspace.
- **Telemetry Infrastructure**: Implement the base event-bus logging for UI interactions (Prompt Seeding, Command Palette).
- **Pre-push Hardening**: Refactor the pre-push gate to allow for intentional release folder persistence without manual bypasses.
- **Refactoring Guardrails**: Perform style module isolation to prevent future CSS collisions.
- **Bridge Resilience**: Enhance the heartbeat monitoring for local bridge connections.

## 3. Strict Non-Touch List (Preservation)
The following are strictly OUT OF SCOPE for the initial wave and must not be modified:
- Core LLM engine logic and IPC message protocols.
- The sealed `NeuralShell_Evidence_v1.0.zip` and its associated release documentation.
- Existing terminology mapping (System/Performance/Shipping).

## 4. Priority Order
1. **Gate Hygiene**: Resolve the pre-push blocker for release-locked environments.
2. **Telemetry Foundation**: Wire the UI event listeners to the core logger.
3. **Bridge Resilience**: Deepen the heartbeat/reconnection logic.
4. **Performance Profiling**: Analyze IPC latency in the "Golden Flow".
