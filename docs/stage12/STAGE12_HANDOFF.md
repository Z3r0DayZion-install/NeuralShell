# Stage 12: Advanced Agency - Handoff Guide

## Overall Objective
Stage 12 establishes the **V2.0 Alpha** baseline for NeuralShell. The primary goal is transitioning from manual action execution to bounded autonomous chaining, enabling the agent to orchestrate sequences of tasks while keeping the operator in control of high-risk operations.

## Key Boundaries
- **Approval Gating**: Risky steps (e.g., file writes, destructive commands) require manual operator approval.
- **Safe Auto-Run**: Reconnaissance actions (e.g., file reading, audit analysis) are permitted to auto-execute for speed.
- **Urgency Focus**: Attention is arbitrated based on environmental friction (e.g., missing dependencies, locked files, failed actions).

## Implementation Baseline
- `agencyPolicy.js`: Implements the core risk assessment and permission logic.
- `chainPlanner.js`: Handles template-based sequence assembly and context-aware rationales.
- `executionEngine.js`: Manages the state of active chains and ensures persistence throughout the execution session.

## Next Stage Targets (V2.0 Beta: Strategic Sovereignty)
The following capabilities are deferred to the V2.0 Beta milestone:
1. **Multi-Chain Coordination**: Shared signaling between concurrent sequences across different workspaces.
2. **Contextual Action Evolution**: Dynamic tuning of action parameters based on workspace-specific conventions.
3. **Cross-Workflow Strategy**: A strategic layer for selecting chains based on long-term project goals.

## Maintenance Notes
- **Extending Chains**: New chain templates should be added to `CHAIN_TEMPLATES` in `chainPlanner.js`.
- **Policy Tuning**: Adjust risk thresholds in `agencyPolicy.js` as new actions are added to the system registry.
