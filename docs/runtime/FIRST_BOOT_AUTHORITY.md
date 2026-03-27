# First-Boot Authority

Δ11 introduces a structured first-boot authority funnel to move users into a secure operational state quickly.

## Step Order
1. Welcome / mode intro
2. Provider sweep
3. Vault setup
4. Policy profile selection
5. Update ring selection
6. Run 90-second proof
7. Import tier/license (optional)
8. Share badge (optional)
9. Open Mission Control

## Design Rules
- Non-critical steps can be skipped.
- Critical steps are labeled explicitly.
- Progress is stored locally.
- Funnel can be reopened/reset from the progress rail or Mission Control.
- Completion flow lands in Mission Control.

## State Keys
- Step definitions: `src/renderer/src/config/first_boot_steps.json`
- Progress: `neuralshell_first_boot_progress_v1`
- Event log: `neuralshell_first_boot_events_v1`
- Dismissal: `neuralshell_first_boot_dismissed_v1`

## Runtime Events
First-boot emits runtime events for:
- step started
- step completed
- step skipped
- step failed
- reset/dismiss/reopen actions

These events appear in Mission Control event feed.