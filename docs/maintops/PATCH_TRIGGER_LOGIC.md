# Patch Trigger Logic

## Trigger Matrix

| Condition | Watch State | Action |
|---|---|---|
| One-off low impact | Observation | Log only |
| Repeated medium impact (2 cycles) | Patch Watch | Open watch |
| High impact reproducible defect | Patch Watch | Open and escalate same cycle |
| Verification instability in clean worktree | Patch Watch | Open watch and assign investigation |
| Confirmed workaround with stable behavior | Candidate Close | Re-evaluate in next cycle |
| Recurrence after workaround | Patch Planning | Escalate to hardening branch |

## Decision Rules
- No escalation without evidence.
- No patch planning without reproducible symptom and impact statement.
- No closure without a recorded rationale.
