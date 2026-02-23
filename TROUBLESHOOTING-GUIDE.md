# 🔧 TROUBLESHOOTING GUIDE

## Quick Diagnosis

### Is the container running?
```bash
docker ps | grep neuralshell
# Expected: Running container

# If not running:
docker-compose -f docker-compose.prod.yml up -d
```

### Is the health endpoint responding?
```bash
curl http://localhost:3000/health
# Expected: {"ok":true,"degraded":false,...}

# If 503:
curl http://localhost:3000/health?details=1 | jq '.checks'
```

### Are there any errors in logs?
```bash
docker logs neuralshell | grep -i error
# Check for critical errors
```

---

## Common Issues & Solutions

### 1. High Latency (P95 > 2000ms)

**Diagnosis:**
```bash
# Check endpoint latencies
curl -H "x-admin-token: admin" \
  http://localhost:3000/endpoints | \
  jq '.[] | {name, lastLatencyMs}'

# Check memory pressure
curl http://localhost:3000/health?details=1 | \
  jq '.checks.memory'

# Check connection pool
netstat -an | grep 3000 | wc -l
```

**Causes & Solutions:**

| Issue | Check | Fix |
|-------|-------|-----|
| Slow endpoint | Endpoint metrics | Restart endpoint or remove |
| Memory pressure | Memory check | Clear cache: `POST /admin/idempotency/reset` |
| Connection pool exhaustion | netstat | Increase maxSockets in connection-pool.js |
| High concurrency | Metrics endpoint | Reduce MAX_CONCURRENT_REQUESTS |

**Steps:**
```bash
# 1. Identify slow endpoint
curl -H "x-admin-token: admin" http://localhost:3000/endpoints

# 2. Check if memory pressure
curl http://localhost:3000/health?details=1

# 3. If memory > 85%:
curl -X POST -H "x-admin-token: admin" \
  http://localhost:3000/admin/idempotency/reset

# 4. If still slow, restart container
docker-compose restart neuralshell
```

---

### 2. High Memory Usage (>300MB)

**Diagnosis:**
```bash
# Get memory stats
docker stats neuralshell --no-stream

# Check cache sizes
curl -H "x-admin-token: admin" \
  http://localhost:3000/admin/idempotency/stats

curl -H "x-admin-token: admin" \
  http://localhost:3000/admin/rate-limit/stats

# Check for memory leaks
docker stats neuralshell --no-stream # Run multiple times
```

**Solutions:**

```bash
# 1. Clear idempotency cache
curl -X POST -H "x-admin-token: admin" \
  http://localhost:3000/admin/idempotency/reset

# 2. Clear rate limit state
curl -X POST -H "x-admin-token: admin" \
  http://localhost:3000/admin/rate-limit/reset

# 3. Check for memory leaks (run in loop)
for i in {1..10}; do
  echo "Check $i:"
  docker stats neuralshell --no-stream | grep -oP '\d+\.\d+MiB'
  sleep 10
done

# 4. If memory keeps growing: restart
docker-compose restart neuralshell
```

---

### 3. High Error Rate (>1%)

**Diagnosis:**
```bash
# Check metrics
curl http://localhost:3000/metrics | jq '{totalRequests, failedRequests, errorRate: (.failedRequests / .totalRequests)}'

# Check recent errors in logs
docker logs neuralshell | grep ERROR | tail -20

# Check endpoint health
curl -H "x-admin-token: admin" http://localhost:3000/endpoints

# Check dead letter queue
curl -H "x-admin-token: admin" \
  http://localhost:3000/admin/dlq/stats
```

**Common Causes:**

| Cause | Check | Fix |
|-------|-------|-----|
| Endpoint down | Endpoint health | Check endpoint server |
| Rate limiting | Metrics | Increase REQUESTS_PER_WINDOW |
| Invalid requests | Logs | Check request format |
| Timeout too short | Metrics | Increase REQUEST_TIMEOUT_MS |

**Steps:**
```bash
# 1. Check which endpoints are failing
curl -H "x-admin-token: admin" http://localhost:3000/endpoints | \
  jq '.[] | select(.cooldownUntil > now) | {name, lastError}'

# 2. If endpoint down, restart it or disable:
curl -X POST -H "x-admin-token: admin" \
  http://localhost:3000/endpoints/reload \
  -d '{"endpoints": [...]}'  # Exclude bad endpoint

# 3. Check rate limiting
curl http://localhost:3000/metrics | jq '.rateLimitedRequests'

# 4. If too many, increase limit:
# Edit docker-compose.yml: REQUESTS_PER_WINDOW=240
```

---

### 4. Request Loss/No Responses

**Diagnosis:**
```bash
# Test basic endpoint
curl -X POST http://localhost:3000/prompt \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "hello"}]}'

# Check if container running
docker ps | grep neuralshell

# Check logs for startup errors
docker logs neuralshell | head -50

# Check for port conflicts
lsof -i :3000  # or netstat -an | grep 3000
```

**Solutions:**

```bash
# 1. Verify container is running
docker-compose -f docker-compose.prod.yml ps

# 2. Check startup logs
docker logs neuralshell

# 3. If not running, start it
docker-compose -f docker-compose.prod.yml up -d

# 4. If port conflict
docker ps -a
lsof -i :3000
# Kill conflicting process or change PORT

# 5. If configuration error
docker-compose -f docker-compose.prod.yml logs neuralshell | tail -100
```

---

### 5. Idempotency Not Working

**Diagnosis:**
```bash
# Test idempotency
KEY="test-key-$(date +%s)"

# First request
RESPONSE1=$(curl -s -X POST http://localhost:3000/prompt \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $KEY" \
  -d '{"messages": [{"role": "user", "content": "test"}]}' | jq -r '.requestId')

# Second request (should be cached)
RESPONSE2=$(curl -s -X POST http://localhost:3000/prompt \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $KEY" \
  -d '{"messages": [{"role": "user", "content": "test"}]}' | jq -r '.requestId')

if [ "$RESPONSE1" = "$RESPONSE2" ]; then
  echo "✅ Idempotency working"
else
  echo "❌ Idempotency not working"
fi
```

**Solutions:**

```bash
# 1. Check idempotency cache size
curl -H "x-admin-token: admin" \
  http://localhost:3000/admin/idempotency/stats

# 2. If cache at capacity, clear it
curl -X POST -H "x-admin-token: admin" \
  http://localhost:3000/admin/idempotency/reset

# 3. Verify idempotency TTL isn't expired
# Check: IDEMPOTENCY_TTL_MS in .env (default: 60000 = 1 minute)

# 4. Verify feature is enabled
# Check docker-compose.yml for PERSIST_VOLATILE_STATE
```

---

### 6. Docker Build Fails

**Diagnosis:**
```bash
# Try building with verbose output
docker build -t neuralshell:test --progress=plain .

# Check for specific errors
# Look for: npm install errors, missing files, syntax errors
```

**Solutions:**

```bash
# 1. Clean build (remove cache)
docker build --no-cache -t neuralshell:test .

# 2. If npm install fails:
docker build --progress=plain -t neuralshell:test . 2>&1 | grep -A5 "npm ERR!"

# 3. If package.json missing:
ls package.json  # Verify exists

# 4. If dependencies outdated:
npm install
git add package-lock.json
git commit -m "Update dependencies"

# 5. Try again
docker build -t neuralshell:latest .
```

---

### 7. Kubernetes Deployment Issues

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n neuralshell

# Check events
kubectl get events -n neuralshell

# Check pod logs
kubectl logs -n neuralshell deployment/neuralshell-router

# Check deployment
kubectl describe deployment neuralshell-router -n neuralshell
```

**Common Issues & Fixes:**

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| ImagePullBackOff | `kubectl describe pod` | Tag and push image to registry |
| CrashLoopBackOff | `kubectl logs` | Check startup errors |
| Not ready | `kubectl describe pod` | Check readiness probe |
| Out of memory | `kubectl top pod` | Increase memory limits |

**Steps:**
```bash
# 1. Check pod status
kubectl get pods -n neuralshell -w

# 2. If ImagePullBackOff:
docker tag neuralshell:latest myregistry/neuralshell:latest
docker push myregistry/neuralshell:latest
kubectl set image deployment/neuralshell-router neuralshell=myregistry/neuralshell:latest -n neuralshell

# 3. If CrashLoopBackOff:
kubectl logs -f deployment/neuralshell-router -n neuralshell
# Fix issue and redeploy

# 4. If memory issues:
kubectl set resources deployment neuralshell-router --limits=memory=1Gi -n neuralshell
```

---

## Emergency Procedures

### Immediate Rollback
```bash
# Option 1: Docker Compose
docker-compose -f docker-compose.prod.yml down
git checkout HEAD~1  # Go back to previous version
docker build -t neuralshell:previous .
docker-compose -f docker-compose.prod.yml up -d

# Option 2: Kubernetes
kubectl rollout undo deployment/neuralshell-router -n neuralshell

# Verify
curl http://localhost:3000/health
```

### Force Restart
```bash
# Docker
docker-compose -f docker-compose.prod.yml restart neuralshell

# Kubernetes
kubectl rollout restart deployment/neuralshell-router -n neuralshell
```

### Clear All State
```bash
# WARNING: This will lose all cached data!
docker-compose -f docker-compose.prod.yml down
rm -rf state/*
docker-compose -f docker-compose.prod.yml up -d
```

---

## Monitoring Commands

### Real-time Dashboard
```bash
# Watch metrics
watch -n 2 'curl -s http://localhost:3000/metrics | jq'

# Watch logs
docker logs -f neuralshell

# Watch container stats
docker stats neuralshell
```

### Performance Testing
```bash
# Quick test
node scripts/performance-test-suite.mjs

# Detailed test with output
node scripts/performance-test-suite.mjs | tee performance-report.txt
```

### Health Diagnostics
```bash
# Full health check
curl -s http://localhost:3000/health?details=1 | jq

# Memory details
curl -s http://localhost:3000/health?details=1 | jq '.checks.memory'

# Endpoints status
curl -s -H "x-admin-token: admin" \
  http://localhost:3000/endpoints | jq
```

---

## When to Contact Support

Contact support if:
- ❌ Error rate >5% for >10 minutes
- ❌ Latency P99 >15 seconds
- ❌ Memory usage >1GB
- ❌ Container won't start
- ❌ Data loss suspected
- ❌ Security incident detected
- ❌ Can't resolve issue with this guide

**Support Channels:**
- Email: support@example.com
- Slack: #neuralshell-incidents
- Phone: +1-XXX-XXX-XXXX (on-call)

---

## Glossary

| Term | Definition |
|------|-----------|
| P95 Latency | 95th percentile response time |
| P99 Latency | 99th percentile response time |
| Throughput | Requests per second |
| Idempotency | Duplicate requests return cached response |
| Rate Limiting | Requests limited per time window |
| Circuit Breaker | Automatic failover on endpoint failure |
| Graceful Shutdown | Finish in-flight requests before stopping |

---

**Last Updated:** February 19, 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
