# PHASE 9 WAVE 3 VERIFICATION: GUIDED EXECUTION

This verification plan ensures that NeuralShell's Wave 3 "Guided Execution" features correctly infer project context, rank actions appropriately, and support multi-step recovery.

## Verification Scenarios

### Scenario 1: Deep Project Inference (Tech Stack)
**Goal**: Verify that the system detects specific frameworks and suggests relevant actions.

1. **Setup**:
    - Attach a workspace containing a `package.json` with `playwright` in `devDependencies`.
2. **Action**:
    - Open the Intel Briefing tray.
3. **Expected Result**:
    - "Playwright (E2E)" signal is detected.
    - An action for "Run Playwright Smoke Test" is listed.
    - Framework-specific actions are ranked higher than generic audits.

### Scenario 2: Situational Action Ranking (Failure Recovery)
**Goal**: Verify that previous session failures correctly prioritize "Repair" actions.

1. **Setup**:
    - Start a session and run a verification task that fails.
    - Save the session as `failure-recovery-test`.
2. **Action**:
    - Restore the `failure-recovery-test` session.
    - Open the Intel Briefing tray.
3. **Expected Result**:
    - The top-ranked "Recommended" action is "Investigate failed verification" or "Retry failed tests".
    - Generic workspace actions are ranked lower.

### Scenario 3: Workflow-Aware Ranking
**Goal**: Verify that switching workflows correctly re-ranks the suggested actions.

1. **Setup**:
    - Attach any workspace.
    - Start in `bridge_diagnostics` workflow.
2. **Action**:
    - Observe the Intel Briefing actions.
    - Switch to `shipping_audit` workflow.
3. **Expected Result**:
    - Initial ranking prioritizes bridge/LLM health probes.
    - Post-switch ranking prioritizes "Review CHANGELOG.md" or "Audit package.json" (shipping-specific).

### Scenario 4: Multi-step Handoff Awareness
**Goal**: Verify that session-based context guides the next step across restarts.

1. **Setup**:
    - Generate a "Draft Specification" artifact in a session.
    - Save and restart the application.
2. **Action**:
    - Restore the session.
3. **Expected Result**:
    - Intel Briefing suggests "Finalize Draft Specification" or "Add tests for Specification" as a high-priority action.

## Pass/Fail Criteria
- [ ] Deeper project inference correctly identifies tech stacks in at least 3 distinct project types.
- [ ] Action ranking correctly highlights a "Recommended" task in all scenarios.
- [ ] Session restoration correctly restores task-specific context/priorities.
- [ ] No regressions in connection messaging (Wave 1) or session status indicators (Wave 2).
