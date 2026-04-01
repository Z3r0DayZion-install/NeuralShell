# Routine Evidence Review

## Weekly Evidence Set
- Current gate outputs (`test`, `verify:ui`, `build:wrapper`, `verify`, `audit:final`)
- Build/runtime warnings and regressions
- Operator-reported defects and reproducible friction
- Backlog movement and unresolved high-impact items

## Monthly Evidence Set
- Weekly trend rollup
- Patch-watch open/close history
- Compatibility drift notes
- LTS support horizon checks

## Signal Handling Rules
- One-off noise:
  - record once in health log
  - keep observation-only unless repeated or trust-impacting
- Repeated signal:
  - if seen in two cycles, move to backlog review
  - if severity increases, move to patch-watch review
- Trust-impact signal:
  - escalate immediately to patch-watch evaluation

## Escalation Triggers
- False or misleading status signal
- Reproducible export/report mismatch
- Verification instability across clean worktrees
- Accessibility regression affecting key workflows

## Output
Each cycle must produce:
- updated health signal entries
- review summary
- signoff record
