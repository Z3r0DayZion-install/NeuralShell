# Autonomous Systems Guide

Complete guide to NeuralShell's autonomous, self-managing capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Self-Healing System](#self-healing-system)
3. [Auto-Scaling](#auto-scaling)
4. [Secret Rotation](#secret-rotation)
5. [Anomaly Detection](#anomaly-detection)
6. [Cost Management](#cost-management)
7. [Threat Detection](#threat-detection)
8. [Auto-Optimization](#auto-optimization)
9. [Canary Deployments](#canary-deployments)
10. [Process Management](#process-management)
11. [Configuration](#configuration)
12. [Monitoring](#monitoring)

## Overview

NeuralShell includes comprehensive autonomous systems that enable:

- **Self-Healing**: Automatic detection and recovery from failures
- **Auto-Scaling**: Dynamic scaling based on load and predictions
- **Secret Rotation**: Automatic secret rotation with zero downtime
- **Anomaly Detection**: ML-based detection of unusual patterns
- **Cost Management**: Automatic cost tracking and optimization
- **Threat Detection**: Real-time security threat detection and blocking
- **Auto-Optimization**: Performance optimization based on metrics
- **Canary Deployments**: Automatic canary testing and rollback
- **Process Management**: Auto-restart on crashes with exponential backoff

## Self-Healing System

### Features

- Automatic endpoint restart on failures
- Cooldown clearing for recovered endpoints
- Memory leak detection and restart
- Cache corruption recovery
- Redis reconnection
- Configurable healing strategies

### Configuration

```javascript
import { SelfHealingOrchestrator, StandardHealingStrategies } from './src/router/selfHealing.js';

const healer = new SelfHealingOrchestrator({
  enabled: true,
  cooldownMs: 5000,
  maxHistorySize: 1000
});

// Register healing strategies
healer.registerStrategy('endpoint_restart', 
  StandardHealingStrategies.endpointRestart(endpointManager)
);

healer.registerStrategy('clear_cooldown',
  StandardHealingStrategies.clearCooldown(endpointManager)
);

healer.registerStrategy('memory_leak_restart',
  StandardHealingStrategies.memoryLeakRestart(processManager)
);

// Listen for healing events
healer.on('healed', ({ issue, strategy, result }) => {
  console.log(`Healed ${issue.type} using ${strategy}`);
});

// Trigger healing
await healer.heal({
  type: 'endpoint_failure',
  endpoint: 'openai',
  error: 'Connection timeout'
});
```

### API

```javascript
// Get healing statistics
const stats = healer.getStats();

// Get healing history
const history = healer.getHistory(50);

// Register custom strategy
healer.registerStrategy('custom', {
  handler: async (issue) => {
    // Custom healing logic
    return { action: 'custom_action' };
  },
  condition: (issue) => issue.type === 'custom_issue',
  priority: 8,
  maxRetries: 3
});
```

## Auto-Scaling

### Features

- CPU and memory-based scaling
- Predictive scaling using historical data
- Configurable min/max instances
- Cooldown periods to prevent flapping
- Integration with Kubernetes HPA

### Configuration

```javascript
import { AutoScaler } from './src/router/autoScaler.js';

const scaler = new AutoScaler({
  enabled: true,
  minInstances: 2,
  maxInstances: 20,
  targetCPU: 70,
  targetMemory: 80,
  scaleUpThreshold: 80,
  scaleDownThreshold: 30,
  cooldownMs: 300000 // 5 minutes
});

// Start auto-scaling
scaler.start(async () => {
  return {
    cpu: getCurrentCPU(),
    memory: getCurrentMemory(),
    requestRate: getRequestRate(),
    avgLatency: getAvgLatency()
  };
});

// Listen for scaling events
scaler.on('scaled', ({ action, oldCount, newCount }) => {
  console.log(`Scaled ${action}: ${oldCount} -> ${newCount}`);
});
```

### Kubernetes Integration

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: neuralshell-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: neuralshell
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Secret Rotation

### Features

- Automatic rotation every 90 days (configurable)
- Zero-downtime updates with grace period
- Support for dual-key validation during rotation
- Integration with HashiCorp Vault and AWS Secrets Manager
- Automatic expiration detection

### Configuration

```javascript
import { SecretRotationManager } from './src/router/secretRotation.js';

const rotationManager = new SecretRotationManager({
  enabled: true,
  rotationIntervalDays: 90,
  warningDays: 7,
  gracePeriodDays: 1
});

// Register secrets
rotationManager.registerSecret('api_key', {
  current: process.env.API_KEY,
  rotationHandler: async ({ name, current, previous }) => {
    // Update external systems
    await updateVault(name, current);
  },
  validator: async (newSecret) => {
    // Validate new secret
    return newSecret.length >= 32;
  },
  autoRotate: true
});

// Start monitoring
rotationManager.start();

// Listen for rotation events
rotationManager.on('rotated', ({ secret, expiresAt }) => {
  console.log(`Secret ${secret} rotated, expires: ${expiresAt}`);
});

rotationManager.on('rotation_warning', ({ secret, daysRemaining }) => {
  console.log(`Secret ${secret} expires in ${daysRemaining} days`);
});
```

### Manual Rotation

```javascript
// Rotate a specific secret
await rotationManager.rotateSecret('api_key');

// Rotate all secrets
await rotationManager.rotateAll();

// Get rotation status
const status = rotationManager.getStatus();
```

## Anomaly Detection

### Features

- ML-based anomaly detection using Z-score and EMA methods
- Traffic pattern analysis
- Latency anomaly detection
- Error rate monitoring
- Memory usage tracking
- Automatic alerting

### Configuration

```javascript
import { AnomalyDetector, EMAnomalyDetector } from './src/router/anomalyDetector.js';

const detector = new AnomalyDetector({
  enabled: true,
  windowSize: 100,
  stdDevThreshold: 3,
  minSamples: 30
});

// Record metrics
detector.record('requests_per_minute', 1500);
detector.record('latency_openai', 250);
detector.record('error_rate', 0.02);

// Listen for anomalies
detector.on('anomaly', (anomaly) => {
  console.log(`Anomaly detected: ${anomaly.metric}`);
  console.log(`Value: ${anomaly.value}, Expected: ${anomaly.expected}`);
  console.log(`Z-score: ${anomaly.zScore}`);
});

// Get statistics
const stats = detector.getStats();
const recentAnomalies = detector.getRecentAnomalies(50);
```

### Advanced EMA Detection

```javascript
const emaDetector = new EMAnomalyDetector({
  enabled: true,
  alpha: 0.3, // Smoothing factor
  windowSize: 100
});

// Use same API as standard detector
emaDetector.record('metric_name', value);
```

## Cost Management

### Features

- Real-time cost tracking per endpoint
- Daily and monthly budget limits
- Cost-aware routing to cheapest providers
- Automatic budget alerts
- Cost optimization recommendations
- Token usage tracking

### Configuration

```javascript
import { CostManager } from './src/router/costManager.js';

const costManager = new CostManager({
  enabled: true,
  dailyBudget: 100, // $100/day
  monthlyBudget: 2000, // $2000/month
  warningThreshold: 0.8, // 80%
  criticalThreshold: 0.95, // 95%
  costAwareRouting: true
});

// Register endpoints with costs
costManager.registerEndpoint('gpt-4', {
  costPer1kInput: 0.03,
  costPer1kOutput: 0.06
});

// Track request costs
costManager.trackRequest('gpt-4', {
  inputTokens: 1000,
  outputTokens: 500
});

// Listen for budget alerts
costManager.on('budget_alert', ({ period, severity, current, budget }) => {
  console.log(`Budget alert: ${period} at ${severity} level`);
  console.log(`Current: $${current}, Budget: $${budget}`);
});

costManager.on('budget_exceeded', ({ period, cost, budget }) => {
  console.log(`Budget exceeded for ${period}: $${cost}/$${budget}`);
});
```

### Cost-Aware Routing

```javascript
// Get cheapest endpoint
const cheapest = costManager.getCheapestEndpoint(['gpt-4', 'gpt-3.5', 'claude']);

// Get cost-optimized ranking
const ranked = costManager.rankEndpointsByCost(['gpt-4', 'gpt-3.5', 'claude']);
```

### Cost Analysis

```javascript
// Get cost breakdown
const breakdown = costManager.getCostBreakdown();

// Get budget status
const budgetStatus = costManager.getBudgetStatus();

// Get cost trends
const trends = costManager.getCostTrends();
```

## Threat Detection

### Features

- SQL injection detection
- XSS attack prevention
- Path traversal detection
- Command injection blocking
- Rate abuse detection
- Automatic IP blocking
- Suspicious behavior analysis

### Configuration

```javascript
import { ThreatDetector } from './src/router/threatDetector.js';

const threatDetector = new ThreatDetector({
  enabled: true,
  autoBlock: true,
  blockDurationMs: 3600000, // 1 hour
  rateLimitThreshold: 100
});

// Analyze requests
const result = threatDetector.analyzeRequest(request);

if (result.threat) {
  console.log(`Threat detected: ${result.types.join(', ')}`);
  console.log(`Severity: ${result.severity}`);
  console.log(`Action: ${result.action}`);
}

// Listen for threats
threatDetector.on('threat_detected', (threat) => {
  console.log(`Threat from ${threat.ip}:`, threat.threats);
});

threatDetector.on('ip_blocked', ({ ip, reason }) => {
  console.log(`Blocked IP ${ip}: ${reason}`);
});
```

### Manual IP Management

```javascript
// Block IP manually
threatDetector.blockIP('192.168.1.100', 'manual_block');

// Unblock IP
threatDetector.unblockIP('192.168.1.100');

// Whitelist IP
threatDetector.whitelist('192.168.1.100');

// Get blocked IPs
const blocked = threatDetector.getBlockedIPs();

// Get recent threats
const threats = threatDetector.getRecentThreats(50);
```

## Auto-Optimization

### Features

- Cache TTL optimization
- Timeout adjustment based on latency
- Connection pool sizing
- Rate limit tuning
- Performance trend analysis
- Automatic recommendations

### Configuration

```javascript
import { AutoOptimizer } from './src/router/autoOptimizer.js';

const optimizer = new AutoOptimizer({
  enabled: true,
  optimizationInterval: 300000, // 5 minutes
  learningRate: 0.1
});

// Start optimization
optimizer.start(async () => {
  return {
    cache_hit_rate: 0.75,
    avg_latency: 250,
    connection_wait_time: 15,
    rate_limit_hits: 0.03
  };
});

// Listen for optimizations
optimizer.on('optimize', ({ name, action, value }) => {
  console.log(`Optimization: ${name} - ${action} (${value})`);
  
  // Apply optimization
  switch (action) {
    case 'increase_ttl':
      cache.setTTL(cache.getTTL() * value);
      break;
    case 'increase_timeout':
      config.timeout *= value;
      break;
    // ... handle other actions
  }
});
```

### Get Recommendations

```javascript
const recommendations = optimizer.getRecommendations(currentMetrics);

recommendations.forEach(rec => {
  console.log(`${rec.type}: ${rec.recommendation}`);
  console.log(`Reason: ${rec.reason}`);
  console.log(`Expected gain: ${rec.expectedGain}`);
});
```

## Canary Deployments

### Features

- Automatic canary testing
- Configurable traffic percentage
- Success rate monitoring
- Latency comparison
- Automatic rollback on failures
- Deployment history

### Configuration

```javascript
import { CanaryDeployment } from './src/router/canaryDeployment.js';

const canary = new CanaryDeployment({
  enabled: true,
  canaryPercent: 10,
  successThreshold: 0.99,
  errorThreshold: 0.05,
  latencyThreshold: 2000,
  minRequests: 100,
  evaluationPeriodMs: 300000 // 5 minutes
});

// Start canary deployment
canary.startCanary('v2.0.0', 'v1.9.0');

// Route requests
const { version, isCanary } = canary.routeRequest();

// Record results
canary.recordRequest(version, success, latencyMs);

// Listen for events
canary.on('canary_promoted', (deployment) => {
  console.log(`Canary ${deployment.canaryVersion} promoted!`);
});

canary.on('canary_rolled_back', (deployment) => {
  console.log(`Canary rolled back: ${deployment.reason}`);
});
```

### Manual Control

```javascript
// Manual promote
canary.manualPromote();

// Manual rollback
canary.manualRollback('performance_issues');

// Get status
const status = canary.getStatus();

// Get history
const history = canary.getHistory(20);
```

## Process Management

### Features

- Auto-restart on crashes
- Exponential backoff
- Graceful shutdown
- Health monitoring
- Memory leak detection
- Signal handling

### Configuration

```javascript
import { ProcessManager } from './src/router/processManager.js';

const processManager = new ProcessManager({
  enabled: true,
  maxRestarts: 5,
  restartWindowMs: 60000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
  minBackoffMs: 1000
});

// Start health monitoring
processManager.startHealthMonitoring(async () => {
  return await healthCheck.isAlive();
}, 30000);

// Start memory monitoring
processManager.startMemoryMonitoring(1024, 60000);

// Listen for events
processManager.on('crash', ({ error }) => {
  console.error('Process crashed:', error);
});

processManager.on('restart', ({ reason }) => {
  console.log(`Process restarting: ${reason}`);
});

processManager.on('shutdown_start', ({ signal }) => {
  console.log(`Graceful shutdown initiated: ${signal}`);
});
```

## Configuration

### Environment Variables

```bash
# Auto-Scaling
AUTO_SCALING_ENABLED=true
MIN_INSTANCES=2
MAX_INSTANCES=20
TARGET_CPU=70
TARGET_MEMORY=80

# Secret Rotation
SECRET_ROTATION_ENABLED=true
ROTATION_INTERVAL_DAYS=90
ROTATION_WARNING_DAYS=7

# Anomaly Detection
ANOMALY_DETECTION_ENABLED=true
ANOMALY_STD_DEV_THRESHOLD=3
ANOMALY_WINDOW_SIZE=100

# Cost Management
COST_MANAGEMENT_ENABLED=true
DAILY_BUDGET=100
MONTHLY_BUDGET=2000
COST_AWARE_ROUTING=true

# Threat Detection
THREAT_DETECTION_ENABLED=true
AUTO_BLOCK_THREATS=true
BLOCK_DURATION_MS=3600000

# Auto-Optimization
AUTO_OPTIMIZATION_ENABLED=true
OPTIMIZATION_INTERVAL_MS=300000

# Canary Deployments
CANARY_ENABLED=true
CANARY_PERCENT=10
CANARY_SUCCESS_THRESHOLD=0.99

# Process Management
AUTO_RESTART_ENABLED=true
MAX_RESTARTS=5
RESTART_WINDOW_MS=60000
```

### Configuration File

```yaml
# config.yaml
autonomous:
  selfHealing:
    enabled: true
    cooldownMs: 5000
    
  autoScaling:
    enabled: true
    minInstances: 2
    maxInstances: 20
    targetCPU: 70
    
  secretRotation:
    enabled: true
    rotationIntervalDays: 90
    warningDays: 7
    
  anomalyDetection:
    enabled: true
    stdDevThreshold: 3
    windowSize: 100
    
  costManagement:
    enabled: true
    dailyBudget: 100
    monthlyBudget: 2000
    
  threatDetection:
    enabled: true
    autoBlock: true
    blockDurationMs: 3600000
    
  autoOptimization:
    enabled: true
    optimizationInterval: 300000
    
  canaryDeployment:
    enabled: true
    canaryPercent: 10
    successThreshold: 0.99
    
  processManagement:
    enabled: true
    maxRestarts: 5
    restartWindowMs: 60000
```

## Monitoring

### Prometheus Metrics

```
# Self-Healing
neuralshell_healing_attempts_total
neuralshell_healing_successes_total
neuralshell_healing_failures_total

# Auto-Scaling
neuralshell_scaling_events_total
neuralshell_current_instances
neuralshell_scaling_recommendations

# Secret Rotation
neuralshell_secret_rotations_total
neuralshell_secrets_expiring_soon

# Anomaly Detection
neuralshell_anomalies_detected_total
neuralshell_anomaly_rate

# Cost Management
neuralshell_cost_total
neuralshell_budget_status
neuralshell_cost_savings_total

# Threat Detection
neuralshell_threats_detected_total
neuralshell_ips_blocked_total
neuralshell_suspicious_activity

# Auto-Optimization
neuralshell_optimizations_applied_total
neuralshell_performance_gain_percent

# Canary Deployments
neuralshell_canary_deployments_total
neuralshell_canary_rollbacks_total
neuralshell_canary_success_rate

# Process Management
neuralshell_process_restarts_total
neuralshell_process_uptime_seconds
neuralshell_memory_usage_bytes
```

### Grafana Dashboards

Import the pre-configured dashboard:

```bash
kubectl apply -f k8s/service-monitor.yaml
```

### Alerts

Configure alerts in Prometheus:

```yaml
# monitoring/prometheus-rules.yaml
groups:
  - name: autonomous-systems
    rules:
      - alert: HighHealingRate
        expr: rate(neuralshell_healing_attempts_total[5m]) > 0.1
        
      - alert: BudgetExceeded
        expr: neuralshell_budget_status > 1
        
      - alert: HighThreatRate
        expr: rate(neuralshell_threats_detected_total[5m]) > 1
```

## Best Practices

1. **Start Conservative**: Begin with conservative thresholds and adjust based on observed behavior

2. **Monitor Closely**: Watch autonomous actions closely in the first weeks

3. **Test in Staging**: Test all autonomous features in staging before production

4. **Set Budgets**: Always set cost budgets to prevent runaway expenses

5. **Review Logs**: Regularly review healing, scaling, and optimization logs

6. **Tune Thresholds**: Adjust thresholds based on your specific workload

7. **Enable Alerts**: Configure alerts for all autonomous actions

8. **Document Changes**: Keep track of autonomous system changes

9. **Regular Audits**: Audit autonomous decisions weekly

10. **Gradual Rollout**: Enable features one at a time

## Troubleshooting

### Self-Healing Not Working

```bash
# Check healing status
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  http://localhost:3000/admin/autonomous/self-healing/status

# Check healing history
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  http://localhost:3000/admin/autonomous/self-healing/history
```

### Auto-Scaling Issues

```bash
# Check scaling status
kubectl get hpa neuralshell-hpa

# Check pod metrics
kubectl top pods -l app=neuralshell

# View scaling events
kubectl describe hpa neuralshell-hpa
```

### Cost Overruns

```bash
# Check cost status
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  http://localhost:3000/admin/autonomous/cost/status

# Get cost breakdown
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  http://localhost:3000/admin/autonomous/cost/breakdown
```

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-org/neuralshell/issues
- Documentation: https://docs.neuralshell.io
- Slack: #neuralshell-autonomous

## License

MIT License - see LICENSE file for details
