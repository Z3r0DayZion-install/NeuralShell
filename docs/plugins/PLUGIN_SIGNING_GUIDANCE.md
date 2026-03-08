# Plugin Signing Guidance

Recommended process:
1. Build plugin artifact deterministically
2. Compute SHA256
3. Create signed manifest
4. Verify signature before load
5. Compare plugin hash against integrity / threat ledger
