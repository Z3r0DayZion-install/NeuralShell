#!/bin/bash

# Setup script for Autonomous Intelligence Layer infrastructure
# This script helps set up Kafka, TimescaleDB, and Tempo for development

set -e

echo "🚀 Setting up Autonomous Intelligence Layer Infrastructure"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env.intelligence ]; then
    echo "📝 Creating .env.intelligence file..."
    cat > .env.intelligence << EOF
# Kafka Configuration
KAFKA_BROKERS=localhost:19092,localhost:19093,localhost:19094

# TimescaleDB Configuration
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=neuralshell_metrics
TIMESCALE_USER=neuralshell
TIMESCALE_PASSWORD=neuralshell_dev_password

# Tempo Configuration
TEMPO_ENDPOINT=localhost:4317

# Service Configuration
SERVICE_NAME=neuralshell
SERVICE_VERSION=1.0.0
NODE_ENV=development
EOF
    echo "✅ Created .env.intelligence file"
else
    echo "✅ .env.intelligence file already exists"
fi

echo ""
echo "🐳 Starting infrastructure containers..."
echo ""

# Start infrastructure
docker-compose -f docker-compose.intelligence.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for Kafka
echo "Waiting for Kafka cluster..."
sleep 10

# Check Kafka health
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec neuralshell-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list &> /dev/null; then
        echo "✅ Kafka cluster is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for Kafka... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Kafka cluster failed to start"
    exit 1
fi

# Wait for TimescaleDB
echo "Waiting for TimescaleDB..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec neuralshell-timescaledb pg_isready -U neuralshell &> /dev/null; then
        echo "✅ TimescaleDB is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for TimescaleDB... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ TimescaleDB failed to start"
    exit 1
fi

# Wait for Tempo
echo "Waiting for Tempo..."
sleep 5
if docker ps | grep neuralshell-tempo &> /dev/null; then
    echo "✅ Tempo is ready"
else
    echo "⚠️  Tempo may not be ready yet"
fi

echo ""
echo "🎉 Infrastructure setup complete!"
echo ""
echo "📊 Service Endpoints:"
echo "  - Kafka Brokers: localhost:19092, localhost:19093, localhost:19094"
echo "  - TimescaleDB: localhost:5432 (user: neuralshell, db: neuralshell_metrics)"
echo "  - Tempo HTTP: localhost:3200"
echo "  - Tempo OTLP gRPC: localhost:4317"
echo "  - Tempo OTLP HTTP: localhost:4318"
echo ""
echo "📝 Next steps:"
echo "  1. Install Node.js dependencies: npm install"
echo "  2. Run tests: npm test test/intelligence/"
echo "  3. Check service health: docker-compose -f docker-compose.intelligence.yml ps"
echo ""
echo "🛑 To stop infrastructure: docker-compose -f docker-compose.intelligence.yml down"
echo "🗑️  To remove all data: docker-compose -f docker-compose.intelligence.yml down -v"
echo ""
