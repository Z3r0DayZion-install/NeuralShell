# NeuralShell Operator UX Baseline (V2.1.26)

> This document defines the canonical operator UX contract (wizard, resume, trust states). For current release status, see `docs/release/V2_1_27_GOVERNANCE_SNAPSHOT.md`.

This document defines the hardened operator experience for the V2.1.26 baseline. It focuses on guided onboarding convergence, profile materialization governance, and trust semantics.

## 1. Canonical Wizard-to-State Mapping

The onboarding wizard is a strict 6-step gated gateway. The Splash screen is the pre-wizard entry state, not a numbered step.

| Wizard Step | Internal State | Purpose | Persist Draft? | Materialize Profile? | Trust Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Splash** | `unconfigured` | Pre-wizard entry screen | No | No | N/A |
| **Step 1: Provider** | `setup_provider` | Choose backend | Yes | No | N/A |
| **Step 2: Endpoint** | `setup_endpoint` | URL & secret entry | Yes | No | N/A |
| **Step 3: Verify** | `endpoint_verified` | Connectivity proof | Yes | No | N/A |
| **Step 4: Model** | `model_selection` | Active model pick | Yes | No | N/A |
| **Step 5: Summary** | `summary_review` | Final review & reconnect toggle | Yes | No | N/A |
| **Step 6: Seal** | `ready` | Profile materialization | Yes | **On Seal** | `VERIFIED` |
| **Skip Path** | `offline_locked` | Air-gapped isolation | No | **On Seal** | `OFFLINE_LOCKED` |
| **Repair** | `repair_mode` | Configuration drift | No | No | `DRIFTED` |

### Shorthand Reference

Documentation and walkthroughs may use abbreviated step labels. The canonical mapping is:

| Shorthand | Canonical State |
| :--- | :--- |
| provider / select | `setup_provider` |
| endpoint / config | `setup_endpoint` |
| verify | `endpoint_verified` |
| model | `model_selection` |
| summary | `summary_review` |
| seal / finalize | `ready` |

## 2. Profile Materialization Rules

To prevent profile storage pollution and ghost-connections, the following rules apply:

- **Rule A (No Early Creation)**: No saved profile is created before Step 6. Intermediate progress is stored only in the `setupDraft`.
- **Rule B (Step 6 Seal Only)**: Profiles are materialized into `connectionProfiles` only when the operator explicitly confirms at Step 6.
- **Rule C (Offline Isolation)**: The "Use Without Model" path seals the shell as `OFFLINE_LOCKED`. It cannot accidentally resume remote draft settings.
- **Rule D (Abort Hygiene)**: Closing or abandoning the wizard preserves the `setupDraft` for resume but does not create a governed profile.
- **Rule E (Resume Correctness)**: Reloading the application while in an incomplete setup state restores the operator to the draft state, not the active shell.

## 3. Trust States

Profiles transition through governed trust states based on cryptographic proof-of-state:
- **`VERIFIED`**: Successful Step 3 verification followed by Step 6 seal.
- **`OFFLINE_LOCKED`**: Intentional air-gap seal; remote capabilities disabled.
- **`DRIFTED`**: Configuration changed since last seal; re-verification forced.
- **`MISSING_SECRET`**: Secret custody lost; operator routed to Recovery Flow.
- **`SIGNATURE_TAMPERED`**: Signature mismatch; resume strictly blocked.

## 4. Forensic Auditing

Operators have access to forensic data for every profile:
- **Trust Report UI**: Full lifecycle history including verification, drift, and recovery events.
- **Forensic Export**: JSON or Markdown reports for external audit or compliance.

## 5. Reconnect Discipline

Auto-reconnect (`connectOnStartup`) is strictly opt-in via the Step 5 Summary toggle. The system maintains a "Private by Default" boot sequence.

## 6. Runtime Resume Policy (Phase 20)

After onboarding completes, runtime entry is governed by the active profile's trust state:

| Trust State | `connectOnStartup` ON | `connectOnStartup` OFF |
| :--- | :--- | :--- |
| `VERIFIED` | Auto-resume allowed | Calm entry, manual connect |
| `DRIFTED` | Blocked → Repair | Blocked → Repair |
| `MISSING_SECRET` | Blocked → Recovery | Blocked → Recovery |
| `SIGNATURE_TAMPERED` | Hard block | Hard block |
| `OFFLINE_LOCKED` | Offline entry only | Offline entry only |
| `INVALID` | Blocked | Blocked |

### Active Profile Governance Surface
The runtime displays a compact profile bar showing: profile name, provider, model, trust badge, reconnect policy, last verified timestamp, and action buttons (Verify, Repair, Switch, Offline, Disconnect).

### Repair Entry
Drifted or secret-missing profiles route to Repair Mode directly from the profile bar. `SIGNATURE_TAMPERED` profiles are hard-blocked with no repair path.

---
**Baseline**: V2.1.26 — Phase 27 Canonical Ledger & Governance Snapshot
**Integrity**: 6-Step Wizard + Late Materialization + Governed Resume + Active Profile Bar
