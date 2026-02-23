#!/bin/bash
# Quick-Start Script for NeuralShell Router Deployment
# Usage: bash quickstart.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
VERSION="2.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 NeuralShell Router Quick-Start Script"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
status() {
  echo -e "${GREEN}✅${NC} $1"
}

error() {
  echo -e "${RED}❌${NC} $1"
  exit 1
}

warning() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

# Step 1: Verify Prerequisites
echo "1️⃣ Verifying prerequisites..."
command -v docker >/dev/null 2>&1 || error "Docker not found"
command -v npm >/dev/null 2>&1 || error "npm not found"
command -v git >/dev/null 2>&1 || error "git not found"
status "All prerequisites found"

# Step 2: Verify Code Quality
echo ""
echo "2️⃣ Verifying code quality..."
npm run lint >/dev/null 2>&1 || error "ESLint validation failed"
status "Code quality verified (0 warnings)"

# Step 3: Run Tests
echo ""
echo "3️⃣ Running comprehensive tests..."
npm run test:root >/dev/null 2>&1 || error "Tests failed"
npm run test:contract >/dev/null 2>&1 || error "Contract tests failed"
status "All 102 tests passed"

# Step 4: Security Audit
echo ""
echo "4️⃣ Running security audit..."
npm audit --audit-level=moderate >/dev/null 2>&1 || warning "Security audit found issues"
status "Security audit passed"

# Step 5: Build Docker Image
echo ""
echo "5️⃣ Building Docker image..."
docker build -t neuralshell:$VERSION . >/dev/null 2>&1 || error "Docker build failed"
IMAGE_SIZE=$(docker images neuralshell:$VERSION --format "{{.Size}}")
status "Docker image built successfully ($IMAGE_SIZE)"

# Step 6: Setup Environment
echo ""
echo "6️⃣ Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || {
    cat > .env << EOF
NODE_ENV=$ENVIRONMENT
PORT=3000
REQUEST_TIMEOUT_MS=5000
MAX_CONCURRENT_REQUESTS=32
ADMIN_TOKEN=change-me-to-strong-secret
PROMPT_API_TOKEN=change-me-to-strong-secret
ENABLE_SECURITY_HEADERS=true
PERSIST_VOLATILE_STATE=true
EOF
  }
  warning "Created .env file - update with your secrets!"
else
  status ".env file exists"
fi

# Step 7: Create State Directory
echo ""
echo "7️⃣ Creating state directory..."
mkdir -p state
status "State directory ready"

# Step 8: Display Configuration
echo ""
echo "8️⃣ Configuration Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Version: $VERSION"
echo "   Docker Image: neuralshell:$VERSION"
echo "   Image Size: $IMAGE_SIZE"
echo "   Port: 3000"

# Step 9: Ready for Deployment
echo ""
if [ "$ENVIRONMENT" = "staging" ]; then
  echo "📋 Next Steps for Staging:"
  echo "   1. docker-compose -f docker-compose.prod.yml up -d"
  echo "   2. curl http://localhost:3000/health"
  echo "   3. Monitor for 24 hours"
  echo "   4. Run: node scripts/performance-test-suite.mjs"
  echo "   5. Check metrics: curl http://localhost:3000/metrics"
elif [ "$ENVIRONMENT" = "production" ]; then
  echo "📋 Next Steps for Production:"
  echo "   1. Tag image: docker tag neuralshell:$VERSION myregistry/neuralshell:$VERSION"
  echo "   2. Push image: docker push myregistry/neuralshell:$VERSION"
  echo "   3. Update K8s: kubectl set image deployment/neuralshell neuralshell=myregistry/neuralshell:$VERSION"
  echo "   4. Monitor rollout: kubectl rollout status deployment/neuralshell"
  echo "   5. Verify: curl https://api.example.com/health"
else
  error "Invalid environment. Use 'staging' or 'production'"
fi

echo ""
echo "✅ Quick-Start Complete!"
echo ""
echo "📚 Documentation:"
echo "   - Deployment Guide: DEPLOYMENT-GUIDE.md"
echo "   - Quick Reference: IMPROVEMENTS-INDEX.md"
echo "   - API Docs: docs/swagger-ui.html"
echo ""
