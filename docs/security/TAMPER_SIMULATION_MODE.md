# TAMPER_SIMULATION_MODE

## Scope

Tamper Simulation Mode provides defensive training scenarios only.

## Safety Constraints

- sandboxed simulation of expected detection/recovery pathways
- no exploit automation
- no offensive tooling
- outputs explicitly marked `simulated`

## Scenario Coverage

- invalid signature injection
- tampered evidence envelope
- revoked cert presented
- policy bundle mismatch
- relay path failure burst
- node heartbeat dropout
- stale update pack presented
- break-glass misuse simulation

## Output

- scenario report with expected and triggered responses
- timestamped simulation records
- exportable report bundle for audit/training use
