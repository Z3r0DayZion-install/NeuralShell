# Rollback Procedure

## Pre-Rollback Checklist
- [ ] Verify critical issue exists
- [ ] Confirm monitoring data
- [ ] Notify team
- [ ] Prepare rollback commands
- [ ] Document reason for rollback

## Immediate Rollback (< 5 minutes)

### Docker Compose
```bash
# 1. Stop new version
docker-compose stop neuralshell

# 2. Checkout previous version
git checkout HEAD~1
docker build -t neuralshell:previous .

# 3. Start old version
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:3000/health
```

### Kubernetes
```bash
# Rollback deployment
kubectl rollout undo deployment/neuralshell-router -n neuralshell

# Check status
kubectl rollout status deployment/neuralshell-router -n neuralshell

# Verify
kubectl exec -it deployment/neuralshell-router -n neuralshell -- curl localhost:3000/health
```

## Post-Rollback

1. Verify all endpoints responding
2. Check error rates (should be 0%)
3. Monitor for 10 minutes
4. Document what went wrong
5. Create incident report
6. Schedule post-mortem

## Root Cause Analysis

1. Collect all logs from deployment
2. Identify exact failure point
3. Determine what broke
4. Create fix in separate branch
5. Test thoroughly
6. Schedule redeploy

## Prevention

- Add more comprehensive tests
- Increase staging duration
- Add canary monitoring
- Review deployment procedures
- Update runbooks
