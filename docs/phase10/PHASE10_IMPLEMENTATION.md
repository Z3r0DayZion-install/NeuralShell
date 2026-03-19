# PHASE 10 IMPLEMENTATION: ACTION ORCHESTRATION

Phase 10 transforms NeuralShell's Intel Briefing from a recommendation surface into a guided execution engine. It introduces structured pipelines, safety guardrails, execution history, and recovery chains.

## Objectives
- **Action Pipeline Engine**: Orchestrate complex, multi-step engineering workflows.
- **Execution Guardrails**: Prevent risky or blocked actions with preflight checks and status models.
- **Outcome Memory**: Learn from execution results to improve future contextual ranking.
- **Recovery Chains**: Derive and recommend corrective actions following a failure.

## Core Component: Action Registry & Orchestration

### [NEW] `src/core/actionRegistry.js`
Canonical definitions for orchestration-capable actions.
- `id`: unique action identifier
- `label`: display name
- `risk`: `safe`, `medium`, `high`
- `preflight`: list of required checks

### [NEW] `src/core/actionPipelines.js`
Implementation of structured steps for each action.
- `Audit package.json`: (Scan -> Parse -> Detail -> Rank)
- `Review uncommitted`: (Git check -> Diff -> Summary -> Rank)
- `Verify local build`: (Script check -> Execute -> Analyze)
- `Debug recent failure`: (Session check -> Log parse -> Rank recovery)

### [NEW] `src/core/executionEngine.js`
Status manager for active pipelines.
- Supports: `ready`, `warning`, `blocked`, `running`, `succeeded`, `failed`.

### [NEW] `src/core/actionOutcomeStore.js`
Persistent structured history for session-based learning.

## UI Integration: Guided Actions

### `src/renderer.js` Enhancements
- **Action Cards**: Update with "Run" buttons and status indicators.
- **Ranking Support**: `buildIntelBriefModel` now weights actions based on `actionOutcomeStore`.

## Success Criteria
- [ ] At least four major actions execute through structured pipelines.
- [ ] Preflight checks correctly block or warn the operator.
- [ ] Execution history persists and influences future ranking.
- [ ] Failures correctly trigger a recovery chain recommendation.
