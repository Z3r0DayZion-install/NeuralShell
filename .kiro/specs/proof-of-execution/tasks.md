# Implementation Plan

**STOP CONDITION: Do not touch other specs until all tasks pass**

- [x] 1. Wire AutonomyController.start() in production-server.js
  - Add await autonomyController.start() in NeuralShellServer.start() method
  - Verify: `grep -n "autonomyController.start()" production-server.js`
  - Proof: Line number and surrounding context

- [x] 2. Wire AutonomyController.stop() in graceful shutdown
  - Add await autonomyController.stop() in NeuralShellServer.shutdown() method
  - Verify: `grep -n "autonomyController.stop()" production-server.js`
  - Proof: Line number and surrounding context

- [x] 3. Add SIGINT handler for graceful shutdown
  - Add process.on('SIGINT') handler that calls server.shutdown()
  - Verify: `grep -n "process.on('SIGINT'" production-server.js`
  - Proof: Raw grep output

- [x] 4. Add SIGTERM handler for graceful shutdown
  - Add process.on('SIGTERM') handler that calls server.shutdown()
  - Verify: `grep -n "process.on('SIGTERM'" production-server.js`
  - Proof: Raw grep output

- [x] 5. Add uncaughtException handler
  - Add process.on('uncaughtException') that logs, stops autonomy, exits 1
  - Verify: `grep -n "process.on('uncaughtException'" production-server.js`
  - Proof: Raw grep output

- [x] 6. Add unhandledRejection handler
  - Add process.on('unhandledRejection') that logs, stops autonomy, exits 1
  - Verify: `grep -n "process.on('unhandledRejection'" production-server.js`
  - Proof: Raw grep output

- [x] 7. Create GET /metrics/autonomy endpoint
  - Add route in registerRoutes() that returns autonomyController.getPrometheusMetrics()
  - Verify: `grep -n "/metrics/autonomy" production-server.js`
  - Proof: Raw grep output

- [x] 8. Fix getPrometheusMetrics() in AutonomyController
  - Current implementation references nested structure, needs flat metrics
  - Use getMetrics() output directly
  - Verify: `node -e "import('./src/router/autonomyController.js').then(m => console.log('OK'))"`
  - Proof: Raw console output

- [x] 9. Create scripts/demo-autonomy.mjs runner
  - Start server, run 7 scenarios, scrape /metrics/autonomy
  - Scenarios: healing, scaling, threats, costs, optimizations, canary, restarts
  - Print PASS/FAIL table
  - Exit non-zero on failure
  - Verify: `node scripts/demo-autonomy.mjs`
  - Proof: Raw console output with PASS/FAIL table

- [x] 10. Add autonomy:demo script to package.json
  - Add "autonomy:demo": "node scripts/demo-autonomy.mjs"
  - Verify: `grep -n "autonomy:demo" package.json`
  - Proof: Raw grep output

- [x] 11. Add autonomy:verify script to package.json
  - Add "autonomy:verify": "node scripts/demo-autonomy.mjs && curl -s http://localhost:3000/metrics/autonomy"
  - Verify: `grep -n "autonomy:verify" package.json`
  - Proof: Raw grep output

- [x] 12. Test AUTONOMY_KILL_SWITCH=1
  - Start server with AUTONOMY_KILL_SWITCH=1
  - Verify autonomy does not start
  - Verify: `AUTONOMY_KILL_SWITCH=1 node production-server.js 2>&1 | grep -i "kill switch"`
  - Proof: Raw grep output showing kill switch message

- [x] 13. Test DRY_RUN=1
  - Start server with DRY_RUN=1
  - Trigger healing event
  - Verify "DRY RUN" log appears
  - Verify: `DRY_RUN=1 node production-server.js 2>&1 | grep -i "dry run"`
  - Proof: Raw grep output showing dry run messages

- [x] 14. Test /metrics/autonomy endpoint returns Prometheus format
  - Start server
  - curl http://localhost:3000/metrics/autonomy
  - Verify output contains "# HELP" and "# TYPE" lines
  - Verify: `curl -s http://localhost:3000/metrics/autonomy | head -20`
  - Proof: Raw curl output (first 20 lines)

- [x] 15. Test graceful shutdown clears timers
  - Start server
  - Send SIGINT
  - Verify "Stopping autonomous systems" log
  - Verify process exits cleanly
  - Verify: `timeout 5 node production-server.js & sleep 2 && kill -INT $! && wait`
  - Proof: Raw console output showing shutdown sequence

- [x] 16. Verify all autonomous modules report metrics
  - Start server with all modules enabled
  - Scrape /metrics/autonomy
  - Verify metrics for: healing, scaling, anomaly, process, secret, cost, threat, optimizer, canary
  - Verify: `curl -s http://localhost:3000/metrics/autonomy | grep -E "(healing|scaling|anomaly|process|secret|cost|threat|optimizer|canary)"`
  - Proof: Raw grep output showing all module metrics

- [x] 17. Test safety limits enforcement
  - Trigger MAX_RESTARTS_PER_WINDOW restarts
  - Verify backoff applied
  - Verify: Check ProcessManager logs for "safety limit" or "backoff"
  - Proof: Raw log output

- [x] 18. Create .kiro/specs/proof-of-execution/.config.kiro
  - Add config file with specId, workflowType, specType
  - Verify: `cat .kiro/specs/proof-of-execution/.config.kiro`
  - Proof: Raw file content

- [x] 19. Run full demo suite
  - Execute npm run autonomy:demo
  - Verify all 7 scenarios pass
  - Verify: `npm run autonomy:demo`
  - Proof: Complete console output with final PASS/FAIL table

- [x] 20. Final checkpoint - All tests pass
  - Run all verification commands
  - Confirm no errors
  - Confirm /metrics/autonomy accessible
  - Confirm graceful shutdown works
  - Proof: Summary table of all verification results
