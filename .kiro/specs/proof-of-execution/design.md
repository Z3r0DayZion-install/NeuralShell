# Design: Proof of Execution

## Runtime Integration
- Entrypoint: `production-server.js` (NeuralShellServer class)
- AutonomyController wired in `initializeAutonomy()` method (line 334)
- Start: Called during server initialization
- Stop: Called during graceful shutdown

## Endpoints
- GET /metrics/autonomy - Prometheus-formatted metrics
- Port: Same as main server (default 3000)

## Environment Flags
- AUTONOMY_KILL_SWITCH=1 - Disable all autonomy
- DRY_RUN=1 - Decision logic only, no side effects
- AUTO_HEALING=1, AUTO_SCALING=1, etc. - Module toggles

## Graceful Shutdown
- SIGINT/SIGTERM handlers call autonomyController.stop()
- uncaughtException/unhandledRejection handlers call stop() then exit(1)
- Clear all timers, intervals, listeners

## Demo Runner
- scripts/demo-autonomy.mjs
- Scenarios: healing, scaling, threats, costs, optimizations, canary, restarts
- Scrapes /metrics/autonomy after each scenario
- Exits non-zero on failure

## Safety Limits
- MAX_RESTARTS_PER_WINDOW, MAX_IP_BLOCKS_PER_WINDOW enforced in modules
- Backoff ceilings prevent infinite delays
