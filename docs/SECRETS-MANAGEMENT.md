# Secrets Management Guide

## Overview

This guide covers best practices for managing secrets, API keys, and sensitive configuration in NeuralShell.

## Environment Variables

### Required Secrets

#### Production (CRITICAL)
```bash
API_KEY_SECRET=<strong-random-secret-min-32-chars>
JWT_SECRET=<strong-random-secret-min-32-chars>
SESSION_SECRET=<strong-random-secret-min-32-chars>
REDIS_PASSWORD=<strong-redis-password>
```

#### Optional (based on features)
```bash
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
COHERE_API_KEY=<your-cohere-key>
DATABASE_URL=<database-connection-string>
```

### Generating Strong Secrets

#### Using OpenSSL
```bash
# Generate 32-byte random secret (base64 encoded)
openssl rand -base64 32

# Generate 64-byte random secret
openssl rand -base64 64
```

#### Using Node.js
```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('base64'));
```

#### Using Python
```python
import secrets
print(secrets.token_urlsafe(32))
```

## Secret Storage Options

### 1. Environment Variables (Development)

**Pros:**
- Simple to use
- Good for local development
- No additional infrastructure

**Cons:**
- Not suitable for production
- Can be exposed in logs
- No rotation mechanism

**Setup:**
```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env

# Never commit .env to git!
```

### 2. Docker Secrets (Docker Swarm)

**Pros:**
- Encrypted at rest
- Encrypted in transit
- Built into Docker

**Cons:**
- Requires Docker Swarm
- Limited to Docker environments

**Setup:**
```bash
# Create secret
echo "my-secret-value" | docker secret create api_key_secret -

# Use in docker-compose.yml
services:
  neuralshell:
    secrets:
      - api_key_secret
secrets:
  api_key_secret:
    external: true
```

### 3. Kubernetes Secrets

**Pros:**
- Native Kubernetes integration
- RBAC support
- Can be encrypted at rest

**Cons:**
- Base64 encoded (not encrypted by default)
- Requires Kubernetes

**Setup:**
```bash
# Create secret
kubectl create secret generic neuralshell-secrets \
  --from-literal=api-key-secret='your-secret' \
  --from-literal=jwt-secret='your-jwt-secret'

# Use in deployment
env:
  - name: API_KEY_SECRET
    valueFrom:
      secretKeyRef:
        name: neuralshell-secrets
        key: api-key-secret
```

### 4. HashiCorp Vault (Recommended for Production)

**Pros:**
- Enterprise-grade security
- Secret rotation
- Audit logging
- Dynamic secrets

**Cons:**
- Additional infrastructure
- More complex setup

**Setup:**
```bash
# Install Vault
# https://www.vaultproject.io/downloads

# Start Vault server
vault server -dev

# Store secret
vault kv put secret/neuralshell \
  api_key_secret="your-secret" \
  jwt_secret="your-jwt-secret"

# Retrieve in application
vault kv get -field=api_key_secret secret/neuralshell
```

### 5. AWS Secrets Manager

**Pros:**
- Managed service
- Automatic rotation
- IAM integration
- Audit logging

**Cons:**
- AWS-specific
- Additional cost

**Setup:**
```bash
# Create secret
aws secretsmanager create-secret \
  --name neuralshell/production \
  --secret-string '{"api_key":"xxx","jwt_secret":"yyy"}'

# Retrieve in application (using AWS SDK)
const secret = await secretsManager.getSecretValue({
  SecretId: 'neuralshell/production'
}).promise();
```

### 6. Azure Key Vault

**Pros:**
- Managed service
- HSM-backed
- Azure AD integration

**Cons:**
- Azure-specific
- Additional cost

**Setup:**
```bash
# Create secret
az keyvault secret set \
  --vault-name neuralshell-vault \
  --name api-key-secret \
  --value "your-secret"
```

### 7. Google Cloud Secret Manager

**Pros:**
- Managed service
- IAM integration
- Automatic replication

**Cons:**
- GCP-specific
- Additional cost

**Setup:**
```bash
# Create secret
echo -n "your-secret" | gcloud secrets create api-key-secret \
  --data-file=-
```

## Secret Rotation

### Rotation Schedule

- **API Keys**: Every 90 days
- **JWT Secrets**: Every 180 days
- **Database Passwords**: Every 90 days
- **Redis Passwords**: Every 90 days

### Rotation Process

1. **Generate new secret**
   ```bash
   NEW_SECRET=$(openssl rand -base64 32)
   ```

2. **Update secret in secret manager**
   - Add new secret with version
   - Keep old secret active

3. **Deploy application with both secrets**
   - Support both old and new
   - Gradual rollout

4. **Monitor for errors**
   - Check logs
   - Verify authentication

5. **Remove old secret**
   - After 24-48 hours
   - Confirm no usage

### Automated Rotation

```javascript
// Example rotation script
import { rotateSecret } from './secretRotation.js';

async function rotateApiKey() {
  const newSecret = generateSecret(32);
  
  // Update in secret manager
  await secretManager.updateSecret('api_key_secret', newSecret);
  
  // Trigger rolling restart
  await kubernetes.rolloutRestart('neuralshell');
  
  // Monitor health
  await waitForHealthy();
  
  console.log('Secret rotated successfully');
}
```

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.*
!.env.example
*.pem
*.key
```

### 2. Use Different Secrets Per Environment

```
Development: dev-secret-xxx
Staging: staging-secret-xxx
Production: prod-secret-xxx
```

### 3. Limit Secret Access

- Use RBAC/IAM
- Principle of least privilege
- Audit access logs

### 4. Encrypt Secrets at Rest

- Use encryption at rest
- Hardware security modules (HSM)
- Key management service (KMS)

### 5. Monitor Secret Usage

```javascript
// Log secret access (not the value!)
logger.logSecurityEvent('secret_accessed', {
  secretName: 'api_key_secret',
  user: 'service-account',
  timestamp: new Date()
});
```

### 6. Implement Secret Scanning

```bash
# Use git-secrets
git secrets --install
git secrets --register-aws

# Use TruffleHog
trufflehog git file://. --json

# Use Gitleaks
gitleaks detect --source . --verbose
```

## Emergency Procedures

### Secret Compromised

1. **Immediate Actions**
   - Revoke compromised secret
   - Generate new secret
   - Update all systems
   - Monitor for unauthorized access

2. **Investigation**
   - Review access logs
   - Identify exposure point
   - Assess impact

3. **Prevention**
   - Fix vulnerability
   - Update procedures
   - Train team

### Incident Response Template

```markdown
## Incident: Secret Exposure

**Date:** YYYY-MM-DD
**Severity:** Critical/High/Medium/Low
**Secret Type:** API Key / JWT Secret / Database Password

### Timeline
- HH:MM - Secret exposed
- HH:MM - Detected
- HH:MM - Revoked
- HH:MM - Rotated
- HH:MM - Resolved

### Impact
- Systems affected: [list]
- Data exposed: [description]
- Users affected: [count]

### Actions Taken
1. [action]
2. [action]

### Prevention
- [measure]
- [measure]
```

## Compliance

### GDPR
- Encrypt secrets at rest
- Audit access logs
- Data retention policies

### SOC 2
- Secret rotation policies
- Access controls
- Monitoring and alerting

### HIPAA
- Encryption requirements
- Access logging
- Secure transmission

## Tools and Resources

### Secret Scanning
- [git-secrets](https://github.com/awslabs/git-secrets)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Gitleaks](https://github.com/gitleaks/gitleaks)

### Secret Management
- [HashiCorp Vault](https://www.vaultproject.io/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [Google Secret Manager](https://cloud.google.com/secret-manager)

### Encryption
- [OpenSSL](https://www.openssl.org/)
- [Age](https://github.com/FiloSottile/age)
- [SOPS](https://github.com/mozilla/sops)

## Checklist

### Development
- [ ] .env file created from template
- [ ] .env added to .gitignore
- [ ] Secrets not committed to git
- [ ] Different secrets per developer

### Staging
- [ ] Separate secrets from production
- [ ] Secrets stored in secret manager
- [ ] Access restricted to staging team
- [ ] Rotation policy defined

### Production
- [ ] Strong secrets (32+ characters)
- [ ] Stored in secret manager
- [ ] Encrypted at rest
- [ ] Access audited
- [ ] Rotation schedule active
- [ ] Monitoring enabled
- [ ] Incident response plan ready

## Support

For questions about secrets management:
- Security team: security@yourdomain.com
- DevOps team: devops@yourdomain.com
- Documentation: https://docs.yourdomain.com/secrets
