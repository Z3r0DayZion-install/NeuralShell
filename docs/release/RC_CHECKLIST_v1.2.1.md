# NeuralShell RC Checklist  v1.2.1

## Validation
- [x] `npm run lint`
- [x] `npm run test:e2e`
- [x] `npm run channel:store:screenshots`

## Async gating sanity
- [x] stale async payloads ignored correctly
- [x] hidden surfaces do not rerender stale content
- [x] active surfaces render latest valid payload
- [x] session switch invalidates stale updates
- [x] patch preview while hidden applies only when surface becomes active again

## Workbench / right rail sanity
- [x] only active right-rail surface visible
- [x] workbench summary cards remain coherent
- [x] session load / workspace edits do not desync surface selection
- [x] inbox ranking still reads as triage

## Release cockpit sanity
- [x] release history populates after session load
- [x] release controls remain visible/actionable
- [x] history cards render consistently

## Docs
- [x] `docs/ui/workbench-visibility-model.md` current
- [x] `docs/release/RC_FOUNDER_REVIEW_GUIDE_v1.2.1.md` current
- [x] `docs/release/RC_DELTA_SUMMARY_v1.2.1.md` current

## Assets
- [x] screenshot set refreshed
- [x] assets path confirmed: `release/store-assets/microsoft-store/v1.2.1-OMEGA/`

## Go / no-go
- [x] all required validation green
- [x] no unresolved high-severity UI race issue
- [x] no failing founder-flow spec
- [x] release checkpoint ready
