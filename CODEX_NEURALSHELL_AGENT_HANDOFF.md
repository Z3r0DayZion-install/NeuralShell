# NeuralShell Coding Agent Handoff (2026-04-14)

## Context
- Repo: `C:\Users\KickA\Documents\GitHub\NeuralShell`
- Branch: `synced/master-2026-04-03`
- Base commit: `e2f76fe`
- Stage: landing page and buyer conversion surface are live in `docs/` + `docs/sales/`.

## What Was Completed
- Implemented and hardened the full reliability-positioned landing page in:
  - `docs/sales/pricing-page.html`
  - published target: `docs/index.html`
- Added buyer-facing collateral pages:
  - `docs/sales/NEURALSHELL_RELIABILITY_5_SLIDE_DECK.html`
  - `docs/sales/NEURALSHELL_14_DAY_PILOT_SCOPE.html`
  - `docs/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html`
- Wired proof demo video:
  - `docs/assets/proof_walkthrough.webm`
  - `docs/sales/assets/proof_walkthrough.webm`
- Unified CTA flow:
  - walkthrough CTA -> booking page
  - pilot CTA -> booking page with `?intent=pilot`
- Booking page now supports:
  - intent-aware copy (`walkthrough` vs `pilot`)
  - scheduler URL override via query param (`?scheduler=...`)
  - default scheduler fallback
  - prefilled scheduler details for Google Calendar event-edit endpoints
  - mail fallback if needed

## Key Wiring (Current Truth)
- Landing config in both source and published page includes:
  - `liveSchedulerUrl = "https://calendar.google.com/calendar/u/0/r/eventedit?add=founder@getneuralshell.com"`
  - `bookingLink` with scheduler query param
  - `pilotStartLink` with `intent=pilot` + scheduler query param
  - hero screenshot now points to `./assets/ui_sales_quickstart_packaged.png`
- Booking page default scheduler:
  - `DEFAULT_SCHEDULER_URL = "https://calendar.google.com/calendar/u/0/r/eventedit?add=founder@getneuralshell.com"`

## Most Important Files
- `docs/sales/pricing-page.html`
- `docs/index.html`
- `docs/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html`
- `docs/sales/NEURALSHELL_RELIABILITY_5_SLIDE_DECK.html`
- `docs/sales/NEURALSHELL_14_DAY_PILOT_SCOPE.html`
- `docs/sales/build-sales-site.ps1`
- `docs/sales/publish-pages-docs.ps1`

## Validation Already Run (All Passing)
- `powershell -ExecutionPolicy Bypass -File docs/sales/build-sales-site.ps1`
- `powershell -ExecutionPolicy Bypass -File docs/sales/publish-pages-docs.ps1`
- `npm run lint`
- `npm run test`
- link/path integrity check across deployed landing + collateral
- Playwright desktop/mobile sanity via local HTTP server, including:
  - `/index.html`
  - `/sales/pricing-page.html`
  - `/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html`
  - `/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html?intent=pilot`
  - `/sales/NEURALSHELL_RELIABILITY_5_SLIDE_DECK.html`
  - `/sales/NEURALSHELL_14_DAY_PILOT_SCOPE.html`

## Current Git Status (Expected)
- Modified:
  - `docs/index.html`
  - `docs/sales/pricing-page.html`
- Untracked (new assets/pages):
  - `docs/assets/proof_walkthrough.webm`
  - `docs/sales/assets/proof_walkthrough.webm`
  - `docs/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html`
  - `docs/sales/NEURALSHELL_RELIABILITY_5_SLIDE_DECK.html`
  - `docs/sales/NEURALSHELL_RELIABILITY_5_SLIDE_DECK.md`
  - `docs/sales/NEURALSHELL_14_DAY_PILOT_SCOPE.html`
  - `docs/sales/NEURALSHELL_14_DAY_PILOT_SCOPE.md`

## Next Actions For Incoming Agent
1. Confirm if product owner wants Google Calendar endpoint to remain, or swap to final scheduler (Calendly/TidyCal/etc).
2. If swapping scheduler, update in two places:
   - `docs/sales/pricing-page.html` (`liveSchedulerUrl`)
   - `docs/sales/NEURALSHELL_BOOK_RELIABILITY_WALKTHROUGH.html` (`DEFAULT_SCHEDULER_URL`)
3. Re-run:
   - build + publish scripts
   - lint + test
   - local HTTP desktop/mobile sanity
4. Stage and commit all landing/collateral/video artifacts together as one cohesive change.

## Guardrails
- Keep reliability positioning intact (do not revert to generic AI productivity copy).
- Do not remove proof-oriented sections or collateral links.
- Do not re-open tooling architecture work; stay in execution/polish mode.

