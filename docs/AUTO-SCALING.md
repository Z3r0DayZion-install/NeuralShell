# Auto-Scaling Configuration Guide

Quick reference for configuring NeuralShell's auto-scaling capabilities.

## Kubernetes HPA (Horizontal Pod Autoscaler)

### Basic Configuration

```yaml
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

### Apply Configuration

```bash
kubectl apply -f k8s/hpa.yaml
```

### Monitor Scaling

```bash
# Watch HPA status
kubectl get hpa neuralshell-hpa --watch

# View scaling events
kubectl describe hpa neuralshell-hpa

# Check current pods
kubectl get pods -l app=neuralshell
```

## Application-Level Auto-Scaling

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

// Start with metrics provider
scaler.start(async () => {
  return {
    cpu: getCurrentCPU(),
    memory: getCurrentMemory(),
    requestRate: getRequestRate(),
    avgLatency: getAvgLatency()
  };
});
```

### Environment Variables

```bash
AUTO_SCALING_ENABLED=true
MIN_INSTANCES=2
MAX_INSTANCES=20
TARGET_CPU=70
TARGET_MEMORY=80
SCALE_UP_THRESHOLD=80
SCALE_DOWN_THRESHOLD=30
COOLDOWN_MS=300000
```

## Scaling Policies

### Aggressive Scaling

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 30
    policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
```

### Conservative Scaling

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 120
    policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
```

## Custom Metrics

### Setup Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Configure Custom Metrics

```yaml
metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

## Monitoring

### Check Metrics

```bash
# CPU and memory
kubectl top pods -l app=neuralshell

# HPA metrics
kubectl get hpa neuralshell-hpa -o yaml
```

### Prometheus Queries

```promql
# Current replicas
kube_deployment_status_replicas{deployment="neuralshell"}

# Desired replicas
kube_horizontalpodautoscaler_spec_max_replicas{horizontalpodautoscaler="neuralshell-hpa"}

# CPU utilization
rate(container_cpu_usage_seconds_total{pod=~"neuralshell-.*"}[5m])
```

## Troubleshooting

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa neuralshell-hpa

# Check metrics server
kubectl get apiservice v1beta1.metrics.k8s.io -o yaml

# Check pod resources
kubectl describe pod <pod-name>
```

### Scaling Too Aggressively

```yaml
# Increase stabilization window
behavior:
  scaleUp:
    stabilizationWindowSeconds: 300 # 5 minutes
```

### Scaling Too Slowly

```yaml
# Decrease stabilization window
behavior:
  scaleUp:
    stabilizationWindowSeconds: 30 # 30 seconds
```

## Best Practices

1. **Set Resource Requests**: Always set CPU/memory requests
2. **Use Stabilization Windows**: Prevent flapping
3. **Monitor Closely**: Watch scaling behavior initially
4. **Test Load**: Use load testing to validate
5. **Set Reasonable Limits**: Don't scale too high
6. **Use PDB**: Prevent all pods from being evicted
7. **Multiple Metrics**: Use CPU, memory, and custom metrics
8. **Gradual Rollout**: Start conservative, tune over time

## Examples

### High Traffic Application

```yaml
minReplicas: 5
maxReplicas: 50
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 60
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        averageValue: "2000"
```

### Low Traffic Application

```yaml
minReplicas: 1
maxReplicas: 5
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 80
```

### Cost-Optimized

```yaml
minReplicas: 2
maxReplicas: 10
behavior:
  scaleDown:
    stabilizationWindowSeconds: 600 # 10 minutes
    policies:
      - type: Pods
        value: 1
        periodSeconds: 120
```

## Integration with Cost Management

```javascript
// Scale based on cost
scaler.on('before_scale', ({ action, target }) => {
  const projectedCost = costManager.projectCost(target);
  
  if (projectedCost > dailyBudget) {
    console.log('Scaling would exceed budget, limiting');
    return false; // Prevent scaling
  }
});
```

## Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run --vus 100 --duration 5m load-test.js

# Watch scaling
kubectl get hpa neuralshell-hpa --watch
```

## References

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [Custom Metrics](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/#autoscaling-on-multiple-metrics-and-custom-metrics)
