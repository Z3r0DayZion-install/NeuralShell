# Phase 9: MVP Execution Plan

Building a demoable, sellable product from the Phase 8 technical foundation.

## Wave 1: MVP Loop Hardening
- **Objective**: Zero-friction setup and a rock-solid core interaction loop.
- **Tasks**:
  - Audit `main.js` and `renderer.js` for startup blockers.
  - Implement automated bridge discovery if port is predictable.
  - Hardening of `llmService.js` for graceful recovery on LLM provider drop.

## Wave 2: Local Usability & Project Value
- **Objective**: Making the attached workspace the primary value driver.
- **Tasks**:
  - Optimize file scanning and context injection.
  - Ensure UI state (current file, active thread) is saved to the session.

## Wave 3: Alpha Readiness
- **Objective**: A repeatable demo flow for early stakeholders.
- **Tasks**:
  - Final "Golden Flow" verification.
  - Documentation of the installation/launch path for non-CLI users.
