#!/usr/bin/env node

/**
 * Event Indexer Runner
 * 
 * Starts the Kafka consumer that indexes decision events in PostgreSQL.
 * 
 * Usage:
 *   node scripts/run-event-indexer.mjs
 *   
 * Environment Variables:
 *   KAFKA_BROKERS - Comma-separated list of Kafka brokers
 *   POSTGRES_HOST - PostgreSQL host
 *   POSTGRES_PORT - PostgreSQL port
 *   POSTGRES_DB - PostgreSQL database name
 *   POSTGRES_USER - PostgreSQL user
 *   POSTGRES_PASSWORD - PostgreSQL password
 */

import { EventIndexer } from '../src/intelligence/eventIndexer.js';

// Configuration from environment
const config = {
  kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:19092', 'localhost:19093', 'localhost:19094'],
  kafkaTopic: process.env.KAFKA_TOPIC || 'decision-events',
  kafkaGroupId: process.env.KAFKA_GROUP_ID || 'event-indexer-group',
  pgHost: process.env.POSTGRES_HOST || 'localhost',
  pgPort: parseInt(process.env.POSTGRES_PORT || '5432'),
  pgDatabase: process.env.POSTGRES_DB || 'neuralshell_metrics',
  pgUser: process.env.POSTGRES_USER || 'neuralshell',
  pgPassword: process.env.POSTGRES_PASSWORD || 'neuralshell_dev_password',
  batchSize: parseInt(process.env.BATCH_SIZE || '100'),
  batchTimeoutMs: parseInt(process.env.BATCH_TIMEOUT_MS || '5000')
};

console.log('Starting Event Indexer...');
console.log('Configuration:', {
  kafkaBrokers: config.kafkaBrokers,
  kafkaTopic: config.kafkaTopic,
  kafkaGroupId: config.kafkaGroupId,
  pgHost: config.pgHost,
  pgPort: config.pgPort,
  pgDatabase: config.pgDatabase,
  batchSize: config.batchSize,
  batchTimeoutMs: config.batchTimeoutMs
});

// Create indexer
const indexer = new EventIndexer(config);

// Graceful shutdown handler
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  
  shuttingDown = true;
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  try {
    await indexer.stop();
    await indexer.disconnect();
    console.log('Event Indexer stopped successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

// Start indexer
async function start() {
  try {
    await indexer.connect();
    console.log('Connected to Kafka and PostgreSQL');
    
    await indexer.start();
    console.log('Event Indexer is running');
    
    // Print metrics every 30 seconds
    setInterval(() => {
      const metrics = indexer.getMetrics();
      console.log('Metrics:', {
        eventsConsumed: metrics.eventsConsumed,
        eventsIndexed: metrics.eventsIndexed,
        batchesProcessed: metrics.batchesProcessed,
        avgLatency: `${metrics.avgLatency.toFixed(2)}ms`,
        maxLatency: `${metrics.maxLatency.toFixed(2)}ms`,
        indexErrors: metrics.indexErrors,
        batchSize: metrics.batchSize
      });
    }, 30000);
    
    // Health check every 60 seconds
    setInterval(async () => {
      const health = await indexer.healthCheck();
      if (!health.healthy) {
        console.error('Health check failed:', health.reason);
      }
    }, 60000);
    
  } catch (error) {
    console.error('Failed to start Event Indexer:', error);
    process.exit(1);
  }
}

start();
