# Stage 12: Advanced Agency - Changelog (V2.0 Alpha)

## Core Agency & Chaining
- [NEW] `src/core/agencyPolicy.js`: Implemented action risk assessment and auto-run permission rules (SAFE, MEDIUM, HIGH).
- [NEW] `src/core/chainPlanner.js`: Added template-based multi-step action sequence assembly and proposal logic.
- [MODIFY] `src/core/executionEngine.js`: Refactored to support industrial-grade action chaining, including session tracking, step-state persistence, and interaction resuming.

## Adaptive Intelligence
- [NEW] `src/core/adaptiveIntelligence.js`: Introduced heuristics for failure anticipation and predictive friction analysis.
- [MODIFY] `src/core/projectIntelligence.js`: Integrated urgency-weighted ranking (0-100) and predictive blocker detection into the project analysis pipeline.
- [MODIFY] `src/core/chainPlanner.js`: Integrated failure prediction to gate chain steps and added urgency to proposals.
- [MODIFY] `src/main.js`: Updated IPC handlers to factor in real-time execution status for intelligence broadcasts.

## UI/UX (Advanced Agency Surface)
- [MODIFY] `src/style.css`: Added Stage 12 design tokens (`--chain`, `--attention`) and UI classes for chain progress and priority badges.
- [MODIFY] `src/renderer.js`:
    - Updated `TerminalOverlay` with real-time chain progress tracking.
    - Enhanced `renderIntelSurface` with "Proposed Autonomous Chains" section.
    - Refactored `WorkspaceSwitcher` with urgency-based sorting and "PRIORITY" attention badges.
    - Integrated predictive-failure warnings and strategic rationales on action cards.

## IPC Layer
- [MODIFY] `src/preload.js`: Exposed `action:run-chain`, `action:resume-chain`, and `workspace:get-chain-proposals` channels.
- [MODIFY] `src/main.js`: Implemented backend handlers for secure chain orchestration and intelligence enrichment.
