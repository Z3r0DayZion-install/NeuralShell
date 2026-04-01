# Strategic Expansion Roadmap

This roadmap uses weighted scoring from the Expansion Planner to prioritize ecosystem bets.

## Active Bet Set
1. Team Edition
2. Enterprise Support Plans
3. Mobile Companion Upsell
4. Secure Relay Appliance

## Scoring Inputs
- Effort
- Revenue potential
- Sales friction
- Deployment complexity
- Ecosystem fit

## Source Files
- Bet definitions: `src/renderer/src/config/strategy_bets.json`
- Default weights: `strategy/default_weights.json`
- Planner UI: `src/renderer/src/components/ExpansionPlanner.jsx`

## Operating Rule
Use weighted score as default priority, then apply manual override only when a concrete customer or regulatory driver justifies reprioritization.
