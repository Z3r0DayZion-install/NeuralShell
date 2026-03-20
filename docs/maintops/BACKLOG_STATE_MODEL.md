# Backlog State Model

## States
- Observation: signal noted; insufficient evidence for work assignment
- Candidate: evidence present; pending board decision
- Support-Only: documentation/support action only; no code change needed
- Deferred-Maintenance: known issue deferred with explicit re-check date
- Patch-Watch: active watch due to potential patch need
- In-Progress: approved maintenance work in execution
- Verified: fix/disposition validated by evidence
- Closed: complete and archived

## State Change Thresholds
- Observation -> Candidate:
  - reproducible or repeated signal
- Candidate -> Patch-Watch:
  - trust-impacting or release-risk behavior
- Candidate -> Support-Only:
  - no code fix needed; process/docs action resolves issue
- In-Progress -> Verified:
  - evidence confirms expected behavior
- Verified -> Closed:
  - review board confirms no follow-up required

## Required Fields Per Item
- ID
- Symptom
- Repro steps
- Impact
- Evidence link
- Owner
- Due date
- Current state
