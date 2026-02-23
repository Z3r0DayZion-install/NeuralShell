# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] All environment variables configured
- [ ] Strong secrets generated (32+ characters)
- [ ] `.env` files not committed to git
- [ ] Security headers enabled
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] Redis password set
- [ ] API keys rotated
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured

### Configuration
- [ ] `config.yaml` reviewed and validated
- [ ] All endpoints tested
- [ ] Logging level set to `info` or `warn`
- [ ] Monitoring enabled
- [ ] Health checks configured
- [ ] Circuit breakers tuned
- [ ] Timeouts configured appropriately
- [ ] Resource limits set

### Infrastructure
- [ ] Redis instance provisioned
- [ ] Database (if used) provisioned
- [ ] Load balancer configured
- [ ] DNS records updated
- [ ] CDN configured (if applicable)
- [ ] Backup strategy in place
- [ ] Disaster recovery plan ready

### Testing
- [ ] All tests passing
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Penetration testing done
- [ ] Chaos testing performed
- [ ] Failover tested
- [ ] Rollback procedure tested

### Monitoring
- [ ] Prometheus configured
- [ ] Grafana dashboards created
- [ ] Alerts configured
- [ ] Log aggregation setup
- [ ] Error tracking enabled
- [ ] Uptime monitoring active
- [ ] Performance monitoring enabled

### Documentation
- [ ] Deployment guide updated
- [ ] Runbook created
- [ ] Incident response plan ready
- [ ] Team trained
- [ ] Contact list updated
- [ ] Escalation procedures defined

## Deployment Steps

### 1. Prepare Environment

```bash
# Set environment
export NODE_ENV=production

# Verify Node.js version
node --version  # Should be 20.11.0 or higher

# Install dependencies
npm ci --production

# Run security audit
npm run security:audit

# Validate configuration
npm run verify
```

### 2. Configure Secrets

```bash
# Generate secrets
API_KEY_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Store in secret manager (example: AWS Secrets Manager)
aws secretsmanager create-secret \
  --name neuralshell/production \
  --secret-string "{
    \"api_key_secret\": \"$API_KEY_SECRET\",
    \"jwt_secret\": \"$JWT_SECRET\",
    \"session_secret\": \"$SESSION_SECRET\"
  }"
```

### 3. Deploy Application

#### Docker Deployment

```bash
# Build image
docker build -t neuralshell:latest .

# Tag for registry
docker tag neuralshell:latest registry.example.com/neuralshell:1.0.0

# Push to registry
docker push registry.example.com/neuralshell:1.0.0

# Deploy
docker run -d \
  --name neuralshell \
  -p 3000:3000 \
  --env-file .env.production \
  registry.example.com/neuralshell:1.0.0
```

#### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace neuralshell

# Create secrets
kubectl create secret generic neuralshell-secrets \
  --from-literal=api-key-secret="$API_KEY_SECRET" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --namespace=neuralshell

# Apply configuration
kubectl apply -f k8s/deployment.yaml

# Verify deployment
kubectl rollout status deployment/neuralshell -n neuralshell

# Check pods
kubectl get pods -n neuralshell
```

#### Docker Compose Deployment

```bash
# Deploy with compose
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Deployment

```bash
# Health check
curl https://api.example.com/health

# Readiness check
curl https://api.example.com/health/ready

# Liveness check
curl https://api.example.com/health/live

# Metrics
curl https://api.example.com/metrics

# Test endpoint
curl -X POST https://api.example.com/prompt \
  -H "Content-Type: application/json" \
  -H "X-Prompt-Token: your-api-key" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### 5. Configure Monitoring

```bash
# Verify Prometheus scraping
curl https://api.example.com/metrics/prometheus

# Check Grafana dashboards
# Navigate to https://grafana.example.com

# Test alerts
# Trigger test alert to verify notification channels
```

### 6. Enable Traffic

```bash
# Update load balancer
# Add new instances to load balancer pool

# Gradual rollout
# Start with 10% traffic
# Monitor for 15 minutes
# Increase to 50% traffic
# Monitor for 15 minutes
# Increase to 100% traffic

# Verify traffic distribution
# Check load balancer metrics
```

## Post-Deployment

### Immediate (0-1 hour)

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all endpoints responding
- [ ] Review logs for errors
- [ ] Confirm metrics collection
- [ ] Test critical user flows

### Short-term (1-24 hours)

- [ ] Monitor resource usage
- [ ] Check for memory leaks
- [ ] Review security logs
- [ ] Verify backup completion
- [ ] Test failover procedures
- [ ] Review performance metrics

### Long-term (1-7 days)

- [ ] Analyze usage patterns
- [ ] Review capacity planning
- [ ] Optimize configurations
- [ ] Update documentation
- [ ] Conduct retrospective
- [ ] Plan improvements

## Rollback Procedure

### Quick Rollback (< 5 minutes)

```bash
# Docker
docker stop neuralshell
docker run -d --name neuralshell registry.example.com/neuralshell:previous-version

# Kubernetes
kubectl rollout undo deployment/neuralshell -n neuralshell

# Docker Compose
docker-compose -f docker-compose.prod.yml down
# Update image tag to previous version
docker-compose -f docker-compose.prod.yml up -d
```

### Full Rollback

1. **Stop new deployment**
   ```bash
   kubectl scale deployment/neuralshell --replicas=0 -n neuralshell
   ```

2. **Restore previous version**
   ```bash
   kubectl rollout undo deployment/neuralshell -n neuralshell
   ```

3. **Verify rollback**
   ```bash
   kubectl rollout status deployment/neuralshell -n neuralshell
   ```

4. **Restore configuration**
   - Revert config changes
   - Restore secrets if changed
   - Update DNS if needed

5. **Verify functionality**
   - Run health checks
   - Test critical endpoints
   - Monitor error rates

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker logs neuralshell
kubectl logs -l app=neuralshell -n neuralshell

# Common issues:
# - Missing environment variables
# - Invalid configuration
# - Port already in use
# - Insufficient permissions
```

### High Error Rates

```bash
# Check endpoint health
curl https://api.example.com/endpoints

# Review error logs
kubectl logs -l app=neuralshell -n neuralshell | grep ERROR

# Check circuit breaker status
curl https://api.example.com/metrics | grep circuit_breaker
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n neuralshell

# Review metrics
curl https://api.example.com/metrics

# Check for bottlenecks:
# - Database connections
# - Redis connections
# - External API calls
# - Memory usage
```

### Redis Connection Issues

```bash
# Test Redis connectivity
redis-cli -h redis-host -p 6379 ping

# Check Redis logs
kubectl logs redis-pod -n neuralshell

# Verify credentials
# Check REDIS_URL and REDIS_PASSWORD
```

## Scaling

### Horizontal Scaling

```bash
# Kubernetes
kubectl scale deployment/neuralshell --replicas=5 -n neuralshell

# Docker Compose
docker-compose -f docker-compose.prod.yml up -d --scale neuralshell=5
```

### Vertical Scaling

```yaml
# Update resource limits in k8s/deployment.yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Auto-scaling

```yaml
# Create HPA (Horizontal Pod Autoscaler)
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
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Maintenance

### Regular Tasks

**Daily:**
- Review error logs
- Check resource usage
- Verify backups

**Weekly:**
- Review performance metrics
- Update dependencies
- Security scan
- Capacity planning review

**Monthly:**
- Rotate secrets
- Update documentation
- Disaster recovery drill
- Performance optimization

### Updates

```bash
# Update dependencies
npm run deps:check
npm run deps:update

# Test updates
npm run test:all

# Deploy update
# Follow deployment steps above
```

## Support

### Contacts

- **On-call Engineer**: oncall@example.com
- **DevOps Team**: devops@example.com
- **Security Team**: security@example.com

### Resources

- **Documentation**: https://docs.example.com
- **Runbook**: https://runbook.example.com
- **Status Page**: https://status.example.com
- **Monitoring**: https://grafana.example.com

## Compliance

### Audit Requirements

- [ ] All changes logged
- [ ] Access reviewed quarterly
- [ ] Security scans monthly
- [ ] Penetration testing annually
- [ ] Compliance certifications current

### Data Protection

- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled
- [ ] Data retention policies enforced
- [ ] Backup encryption enabled
- [ ] Access logs retained

## Emergency Procedures

### Service Outage

1. **Assess impact**
   - Check monitoring dashboards
   - Review error logs
   - Identify affected services

2. **Communicate**
   - Update status page
   - Notify stakeholders
   - Escalate if needed

3. **Mitigate**
   - Rollback if recent deployment
   - Scale up if capacity issue
   - Failover if infrastructure issue

4. **Resolve**
   - Fix root cause
   - Deploy fix
   - Verify resolution

5. **Post-mortem**
   - Document incident
   - Identify improvements
   - Update procedures

### Security Incident

1. **Contain**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious traffic

2. **Investigate**
   - Review security logs
   - Identify attack vector
   - Assess damage

3. **Remediate**
   - Patch vulnerabilities
   - Update security controls
   - Rotate all secrets

4. **Report**
   - Document incident
   - Notify affected parties
   - Report to authorities if required

## Success Criteria

- [ ] Zero downtime deployment
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms (p95)
- [ ] Availability > 99.9%
- [ ] All health checks passing
- [ ] Monitoring operational
- [ ] Team trained and ready
