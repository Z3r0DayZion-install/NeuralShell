# NeuralShell V2.1.8 — Deprecation Policy

## 1. Deprecation Strategy
In an LTS maintenance line, deprecations are minimized to maintain baseline stability.

## 2. Triggers for Deprecation
- **Security**: A component is identified as a persistent security risk.
- **Redundancy**: A legacy component is entirely superseded by OMEGA-hardened logic.
- **Incompatibility**: A component is no longer supportable in modern LTS environments.

## 3. Execution Flow
1. **Mark**: Component marked `[DEPRECATED]` in documentation.
2. **Warn**: Stewardship health reports note the deprecation status.
3. **Remove**: Removal occurs ONLY in a major release re-baseline (e.g., V2.2).

## 4. Continuity Guarantee
Core Signal Bus and OMEGA verification logic will not be deprecated within the V2.1.x lifecycle.

---
**Standard**: Policy-Deprest-1.0
