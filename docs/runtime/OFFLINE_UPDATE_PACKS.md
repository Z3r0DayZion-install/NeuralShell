# Offline Update Packs

Offline update packs allow operators to stage and promote updates without hidden cloud dependency.

## Workflow

1. Generate signed pack (`node scripts/gen_offline_update_pack.cjs`).
2. Import pack in Offline Update Console.
3. Verify signature before assignment.
4. Assign pack to node set and target ring.
5. Promote ring deliberately with runtime/audit visibility.

## Guardrails

- Unverified packs are rejected.
- Ring assignment and promotions are logged.
- Locked ring remains available for freeze posture.