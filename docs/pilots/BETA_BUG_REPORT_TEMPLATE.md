# NeuralShell Beta Bug Report Template

Use one report per issue. Keep steps exact and minimal.

## Quick Severity Scale
- `P0` Critical: install/launch blocked, data loss, security compromise, or unrecoverable crash.
- `P1` High: major feature broken, no practical workaround.
- `P2` Medium: feature partially broken, workaround exists.
- `P3` Low: cosmetic/docs/minor friction, no functional impact.

## Copy/Paste Report

```md
# Bug: <short title>

## Metadata
- Build: V2.0-RC-Final
- Date found: YYYY-MM-DD
- Time found: HH:MM (timezone)
- Tester: <name or alias>
- Environment: <Windows version, CPU/RAM, AV/EDR if relevant>
- Severity: P0 | P1 | P2 | P3
- Checklist step: <step number from beta checklist>

## Summary
<one-paragraph description of what failed and why it matters>

## Reproduction Steps
1. <step 1>
2. <step 2>
3. <step 3>

## Expected Result
<what should happen>

## Actual Result
<what actually happened>

## Frequency
- [ ] Every time
- [ ] Intermittent
- [ ] Happened once
- Repro rate: <e.g., 3/5 runs>

## Impact
- User impact: <blocked / degraded / minor>
- Scope: <all users / first-time users / specific environment>

## Evidence
- Screenshot/video: <path or link>
- Log file path: <path>
- Console output/error text: <paste exact error text>

## Workaround
<none / temporary workaround details>

## Regression Check
- [ ] Worked in previous version
- Previous version tested: <version or unknown>
```

## Triage Notes (Internal)
- Root cause hypothesis:
- Owner:
- Fix target version:
- Status: New | Confirmed | In Progress | Fixed | Verified | Closed
