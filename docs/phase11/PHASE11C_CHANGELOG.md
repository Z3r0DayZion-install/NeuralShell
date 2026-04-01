# Phase 11C Changelog: Cross-Workflow Memory

## [NEW] Features
- **Workflow Memory Engine**: A persistent durable store for operator decisions and action outcomes.
- **Similarity Matching**: Intelligent profile-based matching that bridges behavioral patterns across similar workspaces (e.g., matching a new Electron project based on history from a previous one).
- **Interactive Suggestions**: In-terminal highlighting of "Historically Preferred" choices with grounded rationales.
- **Outcome-Driven Ranking**: Automatic score boosts for actions that have high success rates or have served as successful recovery paths in the past.

## [CHANGED] Improvements
- **Execution Lifecycle**: Instrumented the `ExecutionEngine` to capture structured telemetry from every action run and operator response.
- **Intelligence Surface**: Refined the action ranking to display history badges and context-aware rationales ("📜 Recommended from history").
- **Terminal Design**: Added rationale text and "SUGGESTED" badges to interaction prompts.

## [FIXED]
- **Cold Boot Ranking**: Ensured that memory only influences rankings when sufficient confidence exists, preventing improper defaults in low-signal environments.
- **Persistence Integrity**: Verified memory survives application restarts and session reloads.
