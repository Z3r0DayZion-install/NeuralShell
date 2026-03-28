# CONTINUITY_DRILLS

## Objective

Continuity Drill Center turns disaster recovery planning into repeatable, scored, evidence-backed exercises.

## Scenarios

- fleet restore drill
- appliance replacement drill
- regional policy rollback drill
- revoked trust relationship drill
- update-pack rollback drill
- vault recovery drill
- support/incident export drill

## Capabilities

- drill templates
- scheduling
- pass/fail simulation
- expected vs actual recovery deltas
- evidence bundle export
- readiness scorecard with remediation tasks

## Evidence Flow

Each run stores:

- run metadata (template, timestamps, outcome)
- state deltas
- evidence artifact ID
- attachment targets (`audit`, `support`, `board`)

## Readiness Score

Readiness score is based on pass ratio of recorded runs and includes:

- total runs
- passed runs
- failed runs
- remediation task backlog
