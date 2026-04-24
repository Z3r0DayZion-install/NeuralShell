# NeuralShell — Founder Beta: Week 1 Execution Board

| Field | Value |
|---|---|
| **Window** | 2026-04-23 → 2026-04-30 |
| **Release** | v2.1.29 (sealed, signed, verified) |
| **Patch Target** | v2.1.30 — UI/UX polish only. Zero net-new feature scope. |
| **Launch Owner** | Founder / Operator |
| **Support Owner** | Operator Channel moderator |
| **Patch Owner** | Maintainer Lead |
| **Board Status** | 🟡 IN PROGRESS |

---

## Mission

Execute a tight, evidence-driven founder beta across 10 hand-picked users in 7 days. Capture install completion rate, time-to-first-action, friction points, and stability signal — then use that data to lock a scoped v2.1.30 patch and make an explicit GO/HOLD call before Day 8.

**Non-negotiable constraints:**
- No scope creep. v2.1.30 fixes only what beta evidence proves is broken.
- No crash = minimum bar. Stability is assumed, not celebrated.
- Every decision must have a referenced evidence item.

---

## Week 1 Success Gates

| Gate | Target | Evidence Required | Status |
|---|---|---|---|
| Installs completed | ≥ 10 users | Install confirmation per user in Evidence Log | ⬜ |
| First Action Checklist completed | ≥ 7 / 10 users (70%) | Checklist completion entry per user | ⬜ |
| Time to first action | Median ≤ 5 min | Per-user timing in Evidence Log | ⬜ |
| Zero crashes | 0 crash reports | No `beta:blocker:crash` issues open | ⬜ |
| Actionable feedback items | ≥ 15 labeled issues | GitHub issue count with `beta:` label | ⬜ |
| v2.1.30 scope draft | Locked by Day 6 | Scope doc committed to repo | ⬜ |
| GO/HOLD decision | Logged by Day 7 EOD | Decision note committed to launch docs | ⬜ |

---

## Daily Execution Plan

### Day 0 — 2026-04-23: Activation Setup
**Owner:** Launch Owner | **Deadline:** 23:59 today

- [ ] Confirm installer hash matches `SHA256SUMS.txt` (`.\VERIFY_RELEASE.ps1`)
- [ ] Generate private invite links via `node scripts/checkout_links.cjs --beta --count=10`
- [ ] Write invite message using the template below — keep it under 100 words
- [ ] Create feedback intake channel (Discord thread or GitHub Discussion)
- [ ] Add GitHub issue labels: `beta:blocker`, `beta:blocker:crash`, `beta:ux-confusion`, `beta:trust-lane`, `beta:onboarding`, `beta:docs`, `beta:deferred`
- [ ] Seed Evidence Log with all 10 user slots (IDs only, no PII in repo)
- [ ] Confirm this board is accessible to the full operator team

**Day 0 Exit check:** Installer verified ✓ | Invites staged ✓ | Labels created ✓ | Evidence Log seeded ✓

---

### Day 1 — 2026-04-24: First Wave Distribution (5 users)
**Owner:** Launch Owner | **Support window:** 09:00–18:00 local

- [ ] Send Wave 1 invites to 5 users (highest-trust, most technically capable first)
- [ ] Send follow-up ping at +4h if no install confirmation
- [ ] Log install confirmation, install duration, and first boot outcome per user
- [ ] Capture time-to-first-action (from "opened app" to "first command ran") per user
- [ ] Record any SmartScreen / Gatekeeper friction (expected — document resolution steps)
- [ ] Flag blockers as `beta:blocker` issues within 1 hour of report

**Day 1 Target:** ≥ 3 of 5 Wave 1 users installed and past first boot.

---

### Day 2 — 2026-04-25: Observation + Reactive Support
**Owner:** Support Owner | **Escalation to:** Launch Owner for any crash

- [ ] Run async 1:1 support for all stuck Wave 1 users (DM/thread within 2h of request)
- [ ] Convert all raw feedback into labeled GitHub issues before EOD
- [ ] Identify and group friction clusters:
  - Onboarding/install confusion
  - First command syntax confusion
  - Trust badge / verification UX
  - Docs gaps
- [ ] Update Evidence Log with Day 1 completions
- [ ] Escalate any crash immediately — do not wait for EOD triage

**Day 2 Target:** All Wave 1 issues labeled. No unresolved blockers older than 4h.

---

### Day 3 — 2026-04-26: Second Wave Distribution (5 users)
**Owner:** Launch Owner

- [ ] Confirm Wave 1 stability (no open `beta:blocker:crash`) before sending Wave 2
- [ ] Send Wave 2 invites to remaining 5 users
- [ ] Apply any confirmed UX workarounds from Wave 1 as inline docs or a "known issues" pinned note
- [ ] Repeat First Action Checklist capture for Wave 2
- [ ] Log install + time-to-first-action in Evidence Log

**Day 3 Gate:** Do NOT send Wave 2 if any open `beta:blocker:crash` from Wave 1 is unresolved.

---

### Day 4 — 2026-04-27: Full Signal Consolidation
**Owner:** Launch Owner + Patch Owner

- [ ] Close or defer all open `beta:` issues not meeting v2.1.30 scope criteria
- [ ] Build friction frequency × severity matrix from all issues:

| Issue | Frequency (users affected) | Severity (1=critical, 3=nice-to-have) | Decision |
|---|---|---|---|
| _(fill from issues)_ | | | |

- [ ] Rank by `frequency × (4 - severity)` — highest score = top candidate
- [ ] Apply the scope filter: fix must require < 1 day implementation + be fully testable
- [ ] Flag anything requiring architecture changes as `beta:deferred` (not v2.1.30)

**Day 4 Target:** Ranked issue list finalized. v2.1.30 candidate pool defined.

---

### Day 5–6 — 2026-04-28/29: Patch Scope Lock + Implementation Prep
**Owner:** Patch Owner

- [ ] Write v2.1.30 scope document at `docs/launch_execution/V2130_SCOPE.md`:
  - In-scope: _(reference issue numbers)_
  - Explicitly deferred: _(reference issue numbers + reason)_
  - Scope rule: any addition requires removing something else
- [ ] For each in-scope item: write acceptance criteria + test plan before writing code
- [ ] Draft `CHANGELOG.md` entry for v2.1.30 from issue list
- [ ] Confirm all in-scope items have linked evidence from Evidence Log (no speculation)

**Day 6 Hard Deadline:** Scope document committed before 23:59.

---

### Day 7 — 2026-04-30: GO / HOLD Decision
**Owner:** Launch Owner (final call)

- [ ] Score every Success Gate in the table above — mark ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
- [ ] Require explicit pass/fail reasoning for each gate, not just a checkbox
- [ ] **GO criteria:** All 7 gates at PASS or acceptable PARTIAL with documented rationale
- [ ] **HOLD criteria:** Any gate at FAIL, or any open `beta:blocker` issue unresolved
- [ ] Write `docs/launch_execution/DECISION_WEEK1.md`:
  - Decision: GO / HOLD
  - Gate scorecard
  - Rationale (2–5 sentences)
  - If HOLD: specific conditions required before re-evaluation
- [ ] Commit decision doc + update this board's `Board Status` field

---

## First Action Checklist (Per User)

Send this to users. Every step must be completable in under 10 minutes on a fresh install.

```
NeuralShell First Action Checklist — v2.1.29

1. Launch NeuralShell from the Desktop shortcut
2. Open the Command Palette (Ctrl+Shift+P)
3. Run: /sys:health  — confirm green status
4. Create a New Thread (Ctrl+N)
5. Drop 2–3 local .md or .txt files into the Workbench panel
6. Run: /workbench:scan
7. Ask the AI one question about your files
8. Reply to this message: "Done" + how long it took
```

**Completion = steps 1–8 done + timing reported back.**

---

## Invite Message Template

> Hey [name] — I'm running a small private beta of NeuralShell, a local-first AI operator shell (no cloud, runs offline). You'd be one of 10 people I'm testing this with before a wider release.
>
> Install takes ~2 min. I'll share a private link and a short 8-step checklist. Should take you under 10 minutes total.
>
> Interested? I'll send the link now.

Keep it under 100 words. Do not include the download link in the first message — wait for a yes.

---

## Evidence Log

One row per user. Update in real time. No PII — use handle or ID only.

| User ID | Wave | Invite Sent | Installed | Install Duration | Checklist Done | Time to First Action | Crash/Error | Friction Point | Follow-up Needed |
|---|---|---|---|---|---|---|---|---|---|
| U01 | 1 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U02 | 1 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U03 | 1 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U04 | 1 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U05 | 1 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U06 | 2 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U07 | 2 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U08 | 2 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U09 | 2 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |
| U10 | 2 | ⬜ | ⬜ | — | ⬜ | — | ⬜ | — | — |

---

## Issue Triage Labels

| Label | Use When |
|---|---|
| `beta:blocker` | Prevents any user from completing the checklist |
| `beta:blocker:crash` | App crash or unrecoverable error — **escalate immediately** |
| `beta:ux-confusion` | User couldn't figure out UI without help |
| `beta:trust-lane` | Trust indicator, verification badge, or security posture confusion |
| `beta:onboarding` | First-boot or setup friction |
| `beta:docs` | Missing, wrong, or unclear documentation |
| `beta:deferred` | Valid issue but outside v2.1.30 scope — tagged for future milestone |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Low invite response rate | Medium | High — sample too small | Prepare 2× invite pool (20 candidates); Wave 1 uses top 5 by trust score | Launch Owner |
| Command syntax confusion blocks activation | Medium | High — kills time-to-first-action metric | Include `/sys:health` as step 1; provide the 8-step checklist pre-written | Support Owner |
| SmartScreen / Gatekeeper blocks installer | High (Windows) | Medium — solvable in 30s | Add "More info → Run anyway" note to invite; include `VERIFY_RELEASE.ps1` link | Support Owner |
| Crash on first boot | Low | Critical — HOLD trigger | Dev environment already verified; packaged smoke gate passed before distribution | Patch Owner |
| Low checklist completion (< 5 users) | Medium | High — insufficient signal | Offer async 15-min walkthrough call for stuck users | Launch Owner |
| Scope creep into v2.1.30 | Medium | Medium — delays patch | Hard rule: every in-scope item must reference a labeled issue; no speculation | Patch Owner |

---

## Exit Artifacts Checklist

By 23:59 on Day 7, the following must exist and be committed:

- [ ] `docs/launch_execution/EVIDENCE_LOG_WEEK1.md` — fully populated Evidence Log
- [ ] GitHub issue list filtered by `beta:` label — all issues labeled, assigned, and triaged
- [ ] `docs/launch_execution/V2130_SCOPE.md` — in-scope items, explicitly deferred items, scope rationale
- [ ] `CHANGELOG.md` — v2.1.30 entry drafted (not published until patch ships)
- [ ] `docs/launch_execution/DECISION_WEEK1.md` — GO/HOLD with gate scorecard and rationale
- [ ] This board updated with final gate statuses and `Board Status: ✅ COMPLETE`
