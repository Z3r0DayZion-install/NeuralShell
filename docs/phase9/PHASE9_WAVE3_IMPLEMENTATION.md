# PHASE 9 WAVE 3 IMPLEMENTATION: GUIDED EXECUTION

Wave 3 transforms NeuralShell's workspace awareness from passive status monitoring into active task guidance. By implementing deeper project inference and situational action ranking, the system will proactively suggest the most relevant engineering tasks based on the project's technical stack and session history.

## Objectives
- **Project Intelligence**: Implement deeper scanning of `package.json`, `README.md`, and configs to detect specific frameworks (e.g., Playwright, Electron, Vitest).
- **Situational Ranking**: Rank "Starter Actions" based on the current `workflowId` and session state (e.g., prioritizing "Fix failing tests" if a previous run failed).
- **Recovery Awareness**: Use session history to guide multi-step recovery flows.

## Core Component: Project Intelligence Broker

### [NEW] `src/core/projectIntelligence.js`
A dedicated broker for workspace-level inference and action prioritization.

- **`analyzeProject(rootPath)`**:
    - Scans for `devDependencies` and `scripts` in `package.json`.
    - Detects "documentation drift" or "unvouched dependencies".
    - Returns a `ProjectIntelligence` summary object.
- **`rankActions(signals, workflowId, sessionHistory)`**:
    - Applies weighting to available actions.
    - Highlights a "Recommended Next Action".

## UI Integration: Guided Actions

### `src/renderer.js` Enhancements
- **`buildIntelBriefModel`**: Integrate the `projectIntelligence` broker to sort actions.
- **`renderIntelSurface`**: Apply a "Primary" or "Recommended" styling to the top-ranked action.
- **`updateSessionStatusHeader`**: (Wave 2 carry-over) Ensure status updates are immediate upon ranking completion.

## Main Process Bridge

### `src/main.js`
- **`project:intelligence`**: New IPC handler to expose the `ProjectIntelligence` broker to the renderer.

## Verification Scenarios

### 1. Framework-Specific Inference
- **Action**: Attach a project with `playwright` in `package.json`.
- **Result**: Intel Briefing ranks "Run E2E Smoke Test" as the primary recommended action.

### 2. Failure-Aware Ranking
- **Action**: Simulate a failed verification run, save session, and restore.
- **Result**: Intel Briefing ranks "Investigate failed verification" above standard workspace audits.

### 3. Workflow Context Sensitivity
- **Action**: Switch workflow from `bridge_diagnostics` to `shipping_audit`.
- **Result**: Action ranking shifts from "Probe LLM" to "Analyze changelog" and "Verify build scripts".

## Success Criteria
- [ ] Deeper project inference includes at least 3 major framework/tooling detections.
- [ ] Action ranking correctly prioritizes repair/failure tasks over generic audits.
- [ ] No regressions in Wave 1/2 connection or session status visibility.
