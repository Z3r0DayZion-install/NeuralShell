#!/usr/bin/env node

/**
 * Decision Query API Demo
 * 
 * Demonstrates querying decision events with various filters and pagination.
 */

import { getDecisionEngine } from '../src/intelligence/decisionEngine.js';
import { getQueryAPI, DecisionQuery } from '../src/intelligence/queryAPI.js';
import { getEventIndexer } from '../src/intelligence/eventIndexer.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Decision Query API Demo ===\n');

  // Initialize components
  console.log('1. Connecting to Decision Engine...');
  const engine = getDecisionEngine();
  await engine.connect();

  console.log('2. Starting Event Indexer...');
  const indexer = getEventIndexer();
  await indexer.connect();
  await indexer.start();

  console.log('3. Connecting to Query API...');
  const queryAPI = getQueryAPI();
  await queryAPI.connect();

  // Record some test decisions
  console.log('\n4. Recording test decisions...');
  
  const testDecisions = [
    {
      decision_type: 'scaling',
      system_component: 'auto-scaler',
      context: {
        trigger: 'cpu_threshold_exceeded',
        metrics: { cpu_usage: 85, memory_usage: 60 },
        state: { current_instances: 3 }
      },
      action_taken: {
        type: 'scale_up',
        parameters: { target_instances: 5 }
      },
      outcome: {
        status: 'success',
        duration_ms: 120,
        impact: { instances_added: 2 }
      }
    },
    {
      decision_type: 'healing',
      system_component: 'self-healing',
      context: {
        trigger: 'service_health_check_failed',
        metrics: { error_rate: 0.15, latency_p95: 2000 },
        state: { unhealthy_instances: 1 }
      },
      action_taken: {
        type: 'restart_service',
        parameters: { instance_id: 'i-abc123' }
      },
      outcome: {
        status: 'success',
        duration_ms: 5000,
        impact: { services_restarted: 1 }
      }
    },
    {
      decision_type: 'scaling',
      system_component: 'auto-scaler',
      context: {
        trigger: 'cpu_threshold_exceeded',
        metrics: { cpu_usage: 90, memory_usage: 75 },
        state: { current_instances: 5 }
      },
      action_taken: {
        type: 'scale_up',
        parameters: { target_instances: 8 }
      },
      outcome: {
        status: 'failure',
        duration_ms: 50,
        impact: { error: 'capacity_limit_reached' }
      }
    },
    {
      decision_type: 'routing',
      system_component: 'auto-optimizer',
      context: {
        trigger: 'latency_spike_detected',
        metrics: { latency_p99: 1500, error_rate: 0.02 },
        state: { current_provider: 'aws' }
      },
      action_taken: {
        type: 'switch_provider',
        parameters: { target_provider: 'gcp' }
      },
      outcome: {
        status: 'success',
        duration_ms: 200,
        impact: { latency_improvement: 500 }
      }
    }
  ];

  for (const decision of testDecisions) {
    await engine.recordDecision(decision);
    console.log(`  ✓ Recorded ${decision.decision_type} decision`);
  }

  // Wait for indexing
  console.log('\n5. Waiting for events to be indexed...');
  await sleep(3000);

  // Query examples
  console.log('\n6. Running query examples...\n');

  // Example 1: Query all decisions
  console.log('Example 1: Query all decisions');
  const query1 = new DecisionQuery({ limit: 100 });
  const result1 = await queryAPI.queryDecisions(query1);
  console.log(`  Found ${result1.count} total decisions`);
  console.log(`  Has more: ${result1.hasMore}`);

  // Example 2: Filter by decision type
  console.log('\nExample 2: Filter by decision type (scaling)');
  const query2 = new DecisionQuery({
    decisionTypes: ['scaling'],
    limit: 100
  });
  const result2 = await queryAPI.queryDecisions(query2);
  console.log(`  Found ${result2.count} scaling decisions`);
  result2.events.forEach(event => {
    console.log(`    - ${event.event_id}: ${event.outcome.status}`);
  });

  // Example 3: Filter by outcome status
  console.log('\nExample 3: Filter by outcome status (success)');
  const query3 = new DecisionQuery({
    outcomeStatuses: ['success'],
    limit: 100
  });
  const result3 = await queryAPI.queryDecisions(query3);
  console.log(`  Found ${result3.count} successful decisions`);

  // Example 4: Filter by system component
  console.log('\nExample 4: Filter by system component (self-healing)');
  const query4 = new DecisionQuery({
    systemComponents: ['self-healing'],
    limit: 100
  });
  const result4 = await queryAPI.queryDecisions(query4);
  console.log(`  Found ${result4.count} self-healing decisions`);
  result4.events.forEach(event => {
    console.log(`    - Action: ${event.action_taken.type}`);
    console.log(`    - Duration: ${event.outcome.duration_ms}ms`);
  });

  // Example 5: Combine multiple filters
  console.log('\nExample 5: Combine filters (scaling + success)');
  const query5 = new DecisionQuery({
    decisionTypes: ['scaling'],
    outcomeStatuses: ['success'],
    limit: 100
  });
  const result5 = await queryAPI.queryDecisions(query5);
  console.log(`  Found ${result5.count} successful scaling decisions`);

  // Example 6: Time range query
  console.log('\nExample 6: Time range query (last hour)');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const query6 = new DecisionQuery({
    startTime: oneHourAgo,
    limit: 100
  });
  const result6 = await queryAPI.queryDecisions(query6);
  console.log(`  Found ${result6.count} decisions in the last hour`);

  // Example 7: Pagination
  console.log('\nExample 7: Pagination (2 events per page)');
  const query7 = new DecisionQuery({ limit: 2 });
  const page1 = await queryAPI.queryDecisions(query7);
  console.log(`  Page 1: ${page1.count} events, hasMore: ${page1.hasMore}`);
  
  if (page1.hasMore) {
    const query8 = new DecisionQuery({
      limit: 2,
      cursor: page1.nextCursor
    });
    const page2 = await queryAPI.queryDecisions(query8);
    console.log(`  Page 2: ${page2.count} events, hasMore: ${page2.hasMore}`);
  }

  // Example 8: Sort order
  console.log('\nExample 8: Sort order (ascending)');
  const query9 = new DecisionQuery({
    limit: 100,
    sortOrder: 'asc'
  });
  const result9 = await queryAPI.queryDecisions(query9);
  console.log(`  First event: ${result9.events[0].event_id}`);
  console.log(`  Last event: ${result9.events[result9.events.length - 1].event_id}`);

  // Display metrics
  console.log('\n7. Query API Metrics:');
  const metrics = queryAPI.getMetrics();
  console.log(`  Queries executed: ${metrics.queriesExecuted}`);
  console.log(`  Average latency: ${metrics.avgLatency.toFixed(2)}ms`);
  console.log(`  Max latency: ${metrics.maxLatency.toFixed(2)}ms`);
  console.log(`  Query errors: ${metrics.queryErrors}`);

  // Health check
  console.log('\n8. Health Check:');
  const health = await queryAPI.healthCheck();
  console.log(`  Status: ${health.healthy ? '✓ Healthy' : '✗ Unhealthy'}`);
  if (!health.healthy) {
    console.log(`  Reason: ${health.reason}`);
  }

  // Cleanup
  console.log('\n9. Cleaning up...');
  await indexer.stop();
  await indexer.disconnect();
  await engine.disconnect();
  await queryAPI.disconnect();

  console.log('\n=== Demo Complete ===');
}

main().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
