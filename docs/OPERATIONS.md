# Operations Runbook

## Health Checks
- `GET /health`
- `GET /health?details=1`
- `GET /ready`
- `GET /version`

## Metrics and Diagnostics
- `GET /metrics`
- `GET /errors/catalog`
- `GET /openapi.json`
- `GET /config` (admin token if configured)
- `GET /endpoints` (admin token if configured)
- `GET /admin/audit/recent?limit=50` (admin token if configured)
- `GET /admin/audit/stats` (admin token if configured)
- `GET /admin/audit/verify` (admin token if configured)
- `GET /admin/state/verify` (admin token if configured)
- `GET /admin/auth/status` (admin token if configured)
- `GET /admin/idempotency/stats` (admin token if configured)
- `GET /admin/rate-limit/stats` (admin token if configured)
- `GET /metrics/prometheus` (Prometheus scrape endpoint)
- `npm run doctor`
- `npm run canary:router`

## Administrative Actions
- Reset endpoint state: `POST /endpoints/reset`
- Reload endpoint config: `POST /endpoints/reload`
- Endpoint reload validates unique names and `MAX_ENDPOINTS` cap
- Reset idempotency cache: `POST /admin/idempotency/reset`
- Reset in-memory rate-limit map: `POST /admin/rate-limit/reset`
- Persist runtime state now: `POST /admin/runtime/persist`
- Flush state snapshots now: `POST /admin/state/flush`
- Reload volatile state from disk: `POST /admin/state/reload`
- Repair corrupt volatile snapshots from memory: `POST /admin/state/repair`
- Audit chain verify: `GET /admin/audit/verify`
- Runtime snapshot dump: `GET /admin/runtime/snapshot`
- Reset metrics: `POST /metrics/reset` with `x-reset-token`

## Failure Modes
- `429 RATE_LIMITED`: increase `REQUESTS_PER_WINDOW` or scale horizontally
- `429 OVERLOADED`: tune `MAX_CONCURRENT_REQUESTS`, `MAX_QUEUE_SIZE`, `REQUEST_QUEUE_TIMEOUT_MS`
- `400 BLOCKED_CONTENT`: adjust `BLOCKED_TERMS`
- `409 IDEMPOTENCY_PAYLOAD_MISMATCH`: ensure callers do not reuse keys across different payloads
- `400 INVALID_PAYLOAD_FIELDS`: remove unknown top-level fields or disable strict field mode
- `502 ALL_ENDPOINTS_FAILED`: inspect `/endpoints` and upstream health
- `503 NO_ACTIVE_ENDPOINTS`: reload endpoints or remove `DISABLED_ENDPOINTS` block

## Test/Bench Gates
- `npm run verify`
- `npm run bench:router`
- Optional local integration: `RUN_OLLAMA_INTEGRATION=1 npm run test:integration`
