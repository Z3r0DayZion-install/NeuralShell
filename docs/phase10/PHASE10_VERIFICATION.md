# PHASE 10 VERIFICATION: ACTION ORCHESTRATION

This verification plan ensures that NeuralShell's Phase 10 "Action Orchestration" features correctly manage pipelines, enforce guardrails, and learn from outcomes.

## Verification Scenarios

### Scenario 1: Action Pipeline Execution
**Goal**: Verify that a structured action completes across all steps.
1. **Action**: Run "Audit package.json" from the Intel Briefing.
2. **Expected Result**: 
    - Card shows `running` state with step progress.
    - Card transitions to `succeeded` with a completion summary.

### Scenario 2: Guardrail Blocking
**Goal**: Verify that actions are blocked when preflight checks fail.
1. **Setup**: Attach a folder that is NOT a git repository.
2. **Action**: View "Review uncommitted" action.
3. **Expected Result**: 
    - Card shows `blocked` status.
    - "Run" button is disabled.

### Scenario 3: Outcome Persistence & Ranking
**Goal**: Verify that previous execution history influences future ranking.
1. **Action**: Run "Audit package.json" successfully.
2. **Expected Result**: 
    - Future ranking for "Audit package.json" is slightly lowered unless new changes are detected.

### Scenario 4: Recovery Chain Generation
**Goal**: Verify that a failure triggers a recovery recommendation.
1. **Setup**: Run "Verify local build" and simulate a failure (missing script).
2. **Action**: Observe the updated rankings.
3. **Expected Result**: 
    - Failure is recorded.
    - Top-ranked action becomes "Investigate build script failure" or a related recovery task.

## Pass/Fail Criteria
- [ ] Pipeline step execution is visible and accurate.
- [ ] Preflight checks prevent invalid execution.
- [ ] Outcome history is persisted properly in the session state.
- [ ] Re-ranking correctly reflects recent success/failure history.
