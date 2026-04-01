# [SUPPORTING] State Architecture
> [!NOTE]
> This document defines the formal renderer state management architecture.

# State Architecture — NeuralShell V2.1.29+

> Documents all persisted data domains, their schema versions, migration paths,
> and corruption recovery behavior.

## State Version: 9

## Persisted Domains

| Domain | File | Format | Versioned | Migration Path |
|:---|:---|:---|:---|:---|
| User Settings | `state/state.omega` | AES-256-GCM JSON (hardware-locked) | ✅ `stateVersion: 9` | v1→v5, v3→v5, v4→v5 |
| Sessions | `sessions/<name>.session` | Encrypted envelope + checksum | ✅ Implicit | Quarantine on tamper |
| Identity | `identity.key` | Ed25519 PEM | ✅ Legacy→authenticated | Auto-migration |
| Trusted Peers | `peers.json` | JSON array | ✅ Implicit | Quarantine on tamper |
| XP State | Inside `state.omega` | JSON field (`nt_xp_state`) | ✅ Part of state | Migrated with state |

## Migration Matrix

| From | To | Migrator | Location | Test |
|:---|:---|:---|:---|:---|
| v1 (raw JSON) | v5 | `normalizeLoadedState` + re-encrypt | `stateManager.js:318-323` | `state-manager.test.js` |
| v2 (profiles) | v5 | Profile normalization | `stateManager.js:325-339` | `state-manager.test.js` |
| v3 (legacy encrypted) | v5 | `decryptLegacy` + re-encrypt | `stateManager.js:123-131` | `state-manager.test.js` |
| v4 (authenticated) | v5 | Hardware binding rewrite | `stateManager.js:325-339` | `state-manager.test.js` |
| v5–v8 | v9 | `normalizeLoadedState` | `stateManager.js:262-271` | `state-manager.test.js` |

## Corruption Recovery

| Scenario | Behavior | Evidence |
|:---|:---|:---|
| Invalid JSON | Quarantine → regenerate defaults | `quarantineStateFile("hardware-lock-failure")` |
| Tampered envelope | Quarantine → regenerate defaults | Checksum validation |
| Wrong hardware | Quarantine → regenerate defaults | Hardware fingerprint mismatch |
| Decryption failure | Quarantine → regenerate defaults | AES-256-GCM auth failure |
| Missing state file | Generate fresh defaults | `load()` existence check |

## Gaps Identified

| Gap | Severity | Status |
|:---|:---|:---|
| Layout state not persisted | 🟡 Low | Not critical — layout is fixed by `SHELL_CONTRACT.md` |
| Thread recovery data not persisted | 🟡 Low | Chat is session-bound, not yet persisted mid-session |
| v3 migration test flaky | 🟡 Medium | Pre-existing — key derivation timing issue |

## Rules

1. New persisted fields must be additive and backward-tolerant
2. Destructive schema changes must include a migrator and increment `STATE_VERSION`
3. Unsupported versions must quarantine safely and recover with defaults
4. All migrations must have corresponding tests in `state-manager.test.js`
