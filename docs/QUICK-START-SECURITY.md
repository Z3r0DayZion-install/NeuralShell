# Quick Start: Security Setup

## 5-Minute Security Setup

### 1. Generate Secrets (2 minutes)

```bash
# Generate strong secrets
openssl rand -base64 32  # Copy for API_KEY_SECRET
openssl rand -base64 32  # Copy for JWT_SECRET
openssl rand -base64 32  # Copy for SESSION_SECRET
```

### 2. Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your secrets
nano .env
```

Required variables:
```bash
NODE_ENV=development
API_KEY_SECRET=<paste-first-secret>
JWT_SECRET=<paste-second-secret>
SESSION_SECRET=<paste-third-secret>
```

### 3. Verify Setup (1 minute)

```bash
# Install dependencies
npm install

# Run security check
npm run security:check

# Start server
npm start
```

### 4. Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live
```

## Production Setup

### 1. Use Production Template

```bash
cp .env.production .env
```

### 2. Update All Values

⚠️ **CRITICAL**: Change ALL placeholder values:
- API_KEY_SECRET
- JWT_SECRET
- SESSION_SECRET
- REDIS_PASSWORD
- REDIS_URL
- CORS_ALLOWED_ORIGINS

### 3. Enable Security Features

```bash
NODE_ENV=production
RATE_LIMIT_ENABLED=true
REDIS_ENABLED=true
CHAOS_ENABLED=false  # MUST be false in production
```

### 4. Validate Configuration

```bash
# Run full verification
npm run verify

# Check security
npm run security:audit

# Test deployment
npm start
```

## Security Checklist

### Before First Run
- [ ] Secrets generated (32+ characters)
- [ ] .env file created
- [ ] .env added to .gitignore
- [ ] Dependencies installed
- [ ] Security audit passed

### Before Production
- [ ] All secrets changed from defaults
- [ ] CORS restricted to your domains
- [ ] Rate limiting enabled
- [ ] Redis password set
- [ ] HTTPS/TLS configured
- [ ] Monitoring enabled
- [ ] Backups configured

## Common Issues

### "Invalid environment configuration"
- Check all required variables are set
- Verify secrets are at least 32 characters
- Ensure no default values in production

### "Configuration validation failed"
- Review error messages
- Check config.yaml syntax
- Verify endpoint URLs are valid

### "Redis connection failed"
- Verify REDIS_URL is correct
- Check Redis is running
- Verify REDIS_PASSWORD if set

## Next Steps

1. **Read Full Documentation**
   - `SECURITY.md` - Security policy
   - `docs/SECRETS-MANAGEMENT.md` - Secrets guide
   - `docs/PRODUCTION-DEPLOYMENT.md` - Deployment guide

2. **Set Up Monitoring**
   - Configure Prometheus
   - Set up Grafana dashboards
   - Configure alerts

3. **Test Security**
   - Run security audit
   - Test rate limiting
   - Verify CORS settings
   - Test health checks

## Quick Commands

```bash
# Security
npm run security:audit          # Run security audit
npm run security:check          # Full security check

# Dependencies
npm run deps:check              # Check for updates
npm run deps:update             # Update dependencies

# Cleanup
npm run clean:logs              # Remove log files
npm run clean:test              # Remove test artifacts

# Testing
npm run test:all                # Run all tests
npm run test:contract           # Contract tests
npm run test:chaos              # Chaos tests

# Development
npm start                       # Start server
npm run lint                    # Lint code
npm run lint:fix                # Fix linting issues
```

## Support

- **Security Issues**: See `SECURITY.md`
- **Deployment Help**: See `docs/PRODUCTION-DEPLOYMENT.md`
- **Secrets Management**: See `docs/SECRETS-MANAGEMENT.md`

## Emergency Contacts

Update these with your team's contacts:
- Security Team: security@example.com
- DevOps Team: devops@example.com
- On-Call: oncall@example.com
