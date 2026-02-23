# Performance Tuning Guide

## Latency Optimization

### Connection Pooling Tuning
```javascript
// In connection-pool.js
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 200,      // Increase if you have many endpoints
  maxFreeSockets: 20,   // Increase for better reuse
  timeout: 60000
});
```

### Adaptive Timeout Tuning
```
// In .env
REQUEST_TIMEOUT_MS=5000  # Increase if endpoints slow
REQUEST_RETRY_BACKOFF_MS=50  # Decrease for faster retries
```

### Endpoint Selection Tuning
```javascript
// In weighter.js
const weight = computeWeight(
  latencySamples,
  successRate,
  consecutiveFailures  // Penalize failed endpoints
);
```

## Memory Optimization

### Cache Tuning
```
# In .env
MAX_IDEMPOTENCY_KEYS=2000    # Reduce if memory high
IDEMPOTENCY_TTL_MS=60000     # Reduce TTL for smaller cache
RATE_LIMIT_MAX_KEYS=10000    # Reduce if memory high
```

### Memory Pressure Detection
```
MEMORY_WARNING_THRESHOLD=70      # Alert at 70%
MEMORY_CRITICAL_THRESHOLD=85     # Throttle at 85%
MEMORY_EMERGENCY_THRESHOLD=95    # Emergency at 95%
```

## Throughput Optimization

### Concurrency Tuning
```
MAX_CONCURRENT_REQUESTS=32   # Increase for better throughput
HTTP_MAX_SOCKETS=100        # Increase for more connections
```

### Rate Limiting Tuning
```
REQUESTS_PER_WINDOW=120     # Increase limit
RATE_LIMIT_WINDOW_MS=60000  # Adjust window
```

## Cost Optimization

### Use Cost-Aware Routing
```javascript
const router = new CostAwareRouter();
router.selectCheapestEndpoint(endpoints, qualityMetrics);
// Prefers cheaper endpoints when quality acceptable
```

## Monitoring Performance

```bash
# Baseline metrics
npm run benchmark

# Real-time dashboard
watch -n 2 'curl -s http://localhost:3000/metrics | jq'

# Detailed analysis
node scripts/performance-test-suite.mjs
```

## Typical Tuning Parameters

| Scenario | Parameter | Recommendation |
|----------|-----------|-----------------|
| High latency | Increase maxSockets | 100 → 200 |
| High memory | Reduce MAX_IDEMPOTENCY_KEYS | 2000 → 1000 |
| Low throughput | Increase MAX_CONCURRENT_REQUESTS | 32 → 64 |
| High cost | Enable cost-aware routing | Set weights |
