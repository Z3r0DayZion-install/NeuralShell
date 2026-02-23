# Self-Healing Procedures

Guide to NeuralShell's self-healing capabilities and procedures.

## Overview

NeuralShell's self-healing system automatically detects and recovers from failures without human intervention.

## Healing Strategies

### 1. Endpoint Restart

**Trigger**: Endpoint failure detected
**Action**: Restart failed endpoint
**Priority**: High (8)

```javascript
healer.registerStrategy('endpoint_restart', {
  handler: async (issue) => {
    await endpointManager.restartEndpoint(issue.endpoint);
    return { action: 'endpoint_restarted' };
  },
  condition: (issue) => issue.type === 'endpoint_failure',
  priority: 8,
  maxRetries: 3
});
```

### 2. Cooldown Clearing

**Trigger**: Endpoint in cooldown but recovered
**Action**: Clear cooldown to restore service
**Priority**: Medium (7)

```javascript
healer.registerStrategy('clear_cooldown', {
  handler: async (issue) => {
    endpointManager.clearCooldown(issue.endpoint);
    return { action: 'cooldown_cleared' };
  },
  condition: (issue) => issue.type === 'endpoint_cooldown',
  priority: 7
});
```

### 3. Memory Leak Restart

**Trigger**: Memory usage exceeds threshold
**Action**: Graceful process restart
**Priority**: Critical (10)

```javascript
healer.registerStrategy('memory_leak_restart', {
  handler: async (issue) => {
    await processManager.gracefulRestart('memory_leak_detected');
    return { action: 'process_restarted' };
  },
  condition: (issue) => issue.type === 'memory_leak',
  priority: 10,
  maxRetries: 1
});
```

### 4. Cache Clearing

**Trigger**: Cache corruption detected
**Action**: Clear and rebuild cache
**Priority**: Medium (6)

```javascript
healer.registerStrategy('clear_cache', {
  handler: async (issue) => {
    await cacheManager.clear();
    return { action: 'cache_cleared' };
  },
  condition: (issue) => issue.type === 'cache_corruption',
  priority: 6
});
```

### 5. Redis Reconnection

**Trigger**: Redis connection lost
**Action**: Disconnect and reconnect
**Priority**: High (9)

```javascript
healer.registerStrategy('reconnect_redis', {
  handler: async (issue) => {
    await redisClient.disconnect();
    await redisClient.connect();
    return { action: 'redis_reconnected' };
  },
  condition: (issue) => issue.type === 'redis_connection_lost',
  priority: 9
});
```

## Configuration

### Basic Setup

```javascript
import { SelfHealingOrchestrator } from './src/router/selfHealing.js';

const healer = new SelfHealingOrchestrator({
  enabled: true,
  cooldownMs: 5000, // 5 seconds between healing attempts
  maxHistorySize: 1000
});
```

### Environment Variables

```bash
SELF_HEALING_ENABLED=true
HEALING_COOLDOWN_MS=5000
HEALING_MAX_HISTORY=1000
```

## Triggering Healing

### Automatic Detection

```javascript
// System automatically detects issues and triggers healing
// No manual intervention required

// Example: Endpoint failure detected
// -> Self-healing orchestrator notified
// -> Appropriate strategy selected
// -> Healing executed
// -> Result logged
```

### Manual Trigger

```javascript
// Manually trigger healing for specific issue
await healer.heal({
  type: 'endpoint_failure',
  endpoint: 'openai',
  error: 'Connection timeout',
  timestamp: Date.now()
});
```

## Monitoring

### Healing Events

```javascript
// Listen for healing events
healer.on('healed', ({ issue, strategy, result }) => {
  console.log(`Successfully healed ${issue.type} using ${strategy}`);
  console.log(`Action taken: ${result.action}`);
});

healer.on('healing_error', ({ issue, strategy, error }) => {
  console.error(`Failed to heal ${issue.type} with ${strategy}: ${error}`);
});
```

### Healing Statistics

```javascript
const stats = healer.getStats();
console.log(`Total healing attempts: ${stats.metrics.totalHealingAttempts}`);
console.log(`Successful heals: ${stats.metrics.successfulHeals}`);
console.log(`Failed heals: ${stats.metrics.failedHeals}`);
console.log(`Success rate: ${stats.successRate}`);
```

### Healing History

```javascript
// Get recent healing attempts
const history = healer.getHistory(50);

history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.issue.type}`);
  console.log(`Strategy: ${entry.strategy}`);
  console.log(`Success: ${entry.success}`);
});
```

## Prometheus Metrics

```promql
# Total healing attempts
neuralshell_healing_attempts_total

# Successful heals
neuralshell_healing_successes_total

# Failed heals
neuralshell_healing_failures_total

# Healing success rate
rate(neuralshell_healing_successes_total[5m]) / 
rate(neuralshell_healing_attempts_total[5m])

# Healing by strategy
neuralshell_healing_attempts_total{strategy="endpoint_restart"}
```

## Alerts

### Prometheus Alert Rules

```yaml
groups:
  - name: self-healing
    rules:
      - alert: HighHealingRate
        expr: rate(neuralshell_healing_attempts_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High self-healing rate detected"
          
      - alert: HealingFailures
        expr: rate(neuralshell_healing_failures_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Self-healing failures detected"
          
      - alert: RepeatedHealing
        expr: |
          count_over_time(neuralshell_healing_attempts_total{issue_type="endpoint_failure"}[10m]) > 5
        labels:
          severity: warning
        annotations:
          summary: "Repeated healing attempts for same issue"
```

## Custom Healing Strategies

### Creating Custom Strategy

```javascript
healer.registerStrategy('custom_database_recovery', {
  handler: async (issue, attempt) => {
    console.log(`Database recovery attempt ${attempt}`);
    
    // Custom recovery logic
    await database.disconnect();
    await sleep(1000 * attempt); // Exponential backoff
    await database.connect();
    await database.healthCheck();
    
    return {
      action: 'database_recovered',
      attempt,
      timestamp: Date.now()
    };
  },
  condition: (issue) => {
    return issue.type === 'database_failure' && 
           issue.severity === 'critical';
  },
  priority: 9,
  maxRetries: 5,
  enabled: true
});
```

### Strategy Priority

Strategies are executed in priority order (highest first):

1. **10 (Critical)**: Memory leak restart, system crashes
2. **9 (High)**: Redis reconnection, database recovery
3. **8 (High)**: Endpoint restart
4. **7 (Medium)**: Cooldown clearing
5. **6 (Medium)**: Cache clearing
6. **5 (Low)**: Configuration reload

## Best Practices

### 1. Set Appropriate Cooldowns

```javascript
// Prevent healing loops
const healer = new SelfHealingOrchestrator({
  cooldownMs: 5000 // Wait 5s between attempts
});
```

### 2. Limit Retry Attempts

```javascript
// Prevent infinite retries
healer.registerStrategy('strategy_name', {
  maxRetries: 3, // Try max 3 times
  // ...
});
```

### 3. Monitor Healing Patterns

```javascript
// Alert on repeated healing
if (healingAttemptsLast10Min > 10) {
  alertOps('Repeated healing attempts detected');
}
```

### 4. Test Healing Strategies

```javascript
// Test healing in staging
await healer.heal({
  type: 'test_failure',
  test: true
});
```

### 5. Log All Healing Actions

```javascript
healer.on('healed', (event) => {
  logger.info('Healing action', {
    issue: event.issue,
    strategy: event.strategy,
    result: event.result
  });
});
```

## Troubleshooting

### Healing Not Triggering

```javascript
// Check if healing is enabled
console.log(healer.enabled); // Should be true

// Check if strategy is registered
console.log(healer.healingStrategies.has('strategy_name'));

// Check cooldown status
const lastAttempt = healer.lastHealingAttempts.get(issueType);
const cooldownRemaining = healer.cooldownMs - (Date.now() - lastAttempt);
console.log(`Cooldown remaining: ${cooldownRemaining}ms`);
```

### Healing Failing

```javascript
// Check healing history for errors
const history = healer.getHistory(10);
const failures = history.filter(h => !h.success);

failures.forEach(failure => {
  console.error(`Failed healing: ${failure.issue.type}`);
  console.error(`Strategy: ${failure.strategy}`);
  console.error(`Error: ${failure.result.error}`);
});
```

### Healing Loop

```javascript
// Increase cooldown to prevent loops
healer.cooldownMs = 30000; // 30 seconds

// Or disable problematic strategy
const strategy = healer.healingStrategies.get('strategy_name');
strategy.enabled = false;
```

## Integration with Process Manager

```javascript
import { ProcessManager } from './src/router/processManager.js';

const processManager = new ProcessManager({
  enabled: true,
  maxRestarts: 5,
  restartWindowMs: 60000
});

// Process manager triggers healing on crashes
processManager.on('crash', async (error) => {
  await healer.heal({
    type: 'process_crash',
    error: error.message,
    stack: error.stack
  });
});

// Healing can trigger process restart
healer.registerStrategy('process_restart', {
  handler: async (issue) => {
    await processManager.gracefulRestart(issue.type);
    return { action: 'process_restarted' };
  },
  condition: (issue) => issue.type === 'process_crash',
  priority: 10
});
```

## Health Check Integration

```javascript
import { HealthCheck } from './src/router/healthCheck.js';

const healthCheck = new HealthCheck();

// Register health checks
healthCheck.register('endpoints', async () => {
  const healthy = await checkEndpoints();
  
  if (!healthy) {
    // Trigger healing
    await healer.heal({
      type: 'endpoint_failure',
      timestamp: Date.now()
    });
  }
  
  return { available: healthy };
});

// Run health checks periodically
setInterval(async () => {
  const health = await healthCheck.runAll();
  
  if (health.status === 'unhealthy') {
    // Trigger appropriate healing
    for (const check of health.checks) {
      if (check.status === 'unhealthy' && check.critical) {
        await healer.heal({
          type: `${check.name}_failure`,
          details: check
        });
      }
    }
  }
}, 30000); // Every 30 seconds
```

## Examples

### Example 1: Endpoint Failure Recovery

```javascript
// 1. Endpoint fails
// 2. Circuit breaker opens
// 3. Self-healing detects failure
// 4. Endpoint restart strategy triggered
// 5. Endpoint restarted successfully
// 6. Circuit breaker closes
// 7. Service restored
```

### Example 2: Memory Leak Recovery

```javascript
// 1. Memory usage exceeds 90%
// 2. Memory monitor detects leak
// 3. Self-healing triggered
// 4. Graceful restart initiated
// 5. In-flight requests completed
// 6. Process restarted
// 7. Memory usage normal
```

### Example 3: Redis Connection Recovery

```javascript
// 1. Redis connection lost
// 2. Cache operations fail
// 3. Self-healing detects Redis failure
// 4. Reconnection strategy triggered
// 5. Redis reconnected
// 6. Cache operations restored
```

## References

- [Self-Healing Orchestrator Source](../src/router/selfHealing.js)
- [Process Manager Source](../src/router/processManager.js)
- [Health Check Source](../src/router/healthCheck.js)
- [Autonomous Systems Guide](./AUTONOMOUS-SYSTEMS.md)
