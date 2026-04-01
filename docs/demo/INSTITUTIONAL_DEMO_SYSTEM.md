# INSTITUTIONAL_DEMO_SYSTEM

## Objective

Deliver a stable, repeatable demo mode with seeded institutional data and a deterministic presenter route.

## Included Assets

- `demo/demoProfiles.json` profile catalog and seeded state definitions
- `scripts/gen_demo_bundle.cjs` reproducible demo bundle generator
- `scripts/reset_demo_state.cjs` baseline reset plan generator
- `DemoModeBadge` runtime state indicator
- `DemoFlowConsole` presenter flow controls and autoplay

## Demo Safety Controls

- Demo mode flag is explicit (`neuralshell_demo_mode_v1`)
- Presenter state is isolated from normal operator workflows
- Seed application and reset are deterministic and reversible
- No customer evidence data is generated automatically

## Operating Steps

1. Generate demo bundle: `npm run demo:bundle`
2. Open Demo Flow Console and select profile.
3. Apply seeded baseline.
4. Run guided flow manually or autoplay.
5. Reset baseline at handoff with `npm run demo:reset` plan.

## Capture Guidance

- Use demo mode badge as screenshot/video proof of safe mode.
- Capture Mission, Fleet, Recovery, AirGap, PKI, Procurement, and Institutional panels in that order.
