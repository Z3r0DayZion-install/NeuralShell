#!/usr/bin/env node

/**
 * Outcome Comparison Demo
 * 
 * Demonstrates the outcome comparison functionality of the Replay Engine.
 * This example shows how to compare replayed outcomes with original outcomes
 * to identify differences in action parameters, outcome status, performance
 * metrics, and impact measurements.
 * 
 * Requirements: 3.4
 */

import { ReplayEngine } from '../src/intelligence/replayEngine.js';
import { DecisionQueryAPI } from '../src/intelligence/queryAPI.js';

/**
 * Create sample decision events for demonstration
 */
function createSampleEvents() {
  const baseTime = Date.now() * 1000; // Convert to microseconds
  
  return [
    {
      event_id: 'demo-event-1',
      timestamp: baseTime,
      decision_type: 'scaling',
      system_component: 'auto-scaler',
      context: {
        trigger: 'cpu_threshold_exceeded',
        metrics: { cpu: 85, memory: 60 },
        state: { instances: 3 }
      },
      action_taken: {
        type: 'scale_up',
        parameters: { target: 5 }
      },
      outcome: {
        status: 'success',
        duration_ms: 100,
        impact: { instances_added: 2, cpu_reduction: 15 }
      },
      trace_id: '00000000000000000000000000000001',
      span_id: '0000000000000001'
    },
    {
      event_id: 'demo-event-2',
      timestamp: baseTime + 60000000, // 1 minute later
      decision_type: 'healing',
      system_component: 'self-healing',
      context: {
        trigger: 'health_check_failed',
        metrics: { error_rate: 0.05 },
        state: { healthy_instances: 4 }
      },
      action_taken: {
        type: 'restart_instance',
        parameters: { instance_id: 'i-12345' }
      },
      outcome: {
        status: 'success',
        duration_ms: 5000,
        impact: { instances_restarted: 1, error_rate_reduction: 0.04 }
      },
      trace_id: '00000000000000000000000000000002',
      span_id: '0000000000000002'
    },
    {
      event_id: 'demo-event-3',
      timestamp: baseTime + 120000000, // 2 minutes later
      decision_type: 'routing',
      system_component: 'auto-optimizer',
      context: {
        trigger: 'latency_spike',
        metrics: { p95_latency: 800 },
        state: { current_provider: 'aws' }
      },
      action_taken: {
        type: 'switch_provider',
        parameters: { target_provider: 'gcp' }
      },
      outcome: {
        status: 'success',
        duration_ms: 200,
        impact: { latency_reduction: 300 }
      },
      trace_id: '00000000000000000000000000000003',
      span_id: '0000000000000003'
    }
  ];
}

/**
 * Create modified events to simulate replay differences
 */
function createReplayedEvents(originalEvents) {
  return originalEvents.map((event, index) => {
    // Simulate different types of changes
    if (index === 0) {
      // Event 1: Different action parameters
      return {
        ...event,
        action_taken: {
          ...event.action_taken,
          parameters: { target: 6 } // Different target
        },
        outcome: {
          ...event.outcome,
          impact: { instances_added: 3, cpu_reduction: 20 } // Different impact
        }
      };
    } else if (index === 1) {
      // Event 2: Different outcome status and performance
      return {
        ...event,
        outcome: {
          status: 'failure', // Changed from success to failure
          duration_ms: 10000, // Took longer
          impact: { instances_restarted: 0, error_rate_reduction: 0 }
        }
      };
    } else {
      // Event 3: Identical (no changes)
      return { ...event };
    }
  });
}

/**
 * Format a difference for display
 */
function formatDifference(diff) {
  let output = `  - ${diff.description}\n`;
  output += `    Type: ${diff.type}\n`;
  output += `    Field: ${diff.field}\n`;
  output += `    Original: ${JSON.stringify(diff.originalValue)}\n`;
  output += `    Replayed: ${JSON.stringify(diff.replayedValue)}`;
  
  if (diff.percentageDiff !== undefined) {
    output += `\n    Change: ${diff.percentageDiff.toFixed(1)}%`;
  }
  
  return output;
}

/**
 * Display comparison report
 */
function displayReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('OUTCOME COMPARISON REPORT');
  console.log('='.repeat(80));
  
  console.log('\nTime Range:');
  console.log(`  Start: ${new Date(report.timeRange.startTime).toISOString()}`);
  console.log(`  End:   ${new Date(report.timeRange.endTime).toISOString()}`);
  
  console.log('\nSummary Statistics:');
  console.log(`  Total Events:     ${report.totalEvents}`);
  console.log(`  Matching Events:  ${report.matchingEvents}`);
  console.log(`  Differing Events: ${report.differingEvents}`);
  console.log(`  Match Percentage: ${report.matchPercentage.toFixed(1)}%`);
  
  console.log('\nDifferences by Type:');
  console.log(`  Action Parameters:    ${report.differenceSummary.action_parameters}`);
  console.log(`  Outcome Status:       ${report.differenceSummary.outcome_status}`);
  console.log(`  Performance Metrics:  ${report.differenceSummary.performance_metrics}`);
  console.log(`  Impact Measurements:  ${report.differenceSummary.impact_measurements}`);
  
  if (report.topDifferences.length > 0) {
    console.log('\nTop Differences:');
    report.topDifferences.forEach((diff, index) => {
      console.log(`\n${index + 1}. ${diff.description}`);
      console.log(`   Type: ${diff.type}, Field: ${diff.field}`);
      if (diff.percentageDiff !== undefined) {
        console.log(`   Change: ${diff.percentageDiff.toFixed(1)}%`);
      }
    });
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED EVENT COMPARISONS');
  console.log('-'.repeat(80));
  
  report.comparisons.forEach((comparison, index) => {
    console.log(`\nEvent ${index + 1}: ${comparison.eventId}`);
    console.log(`  Decision Type: ${comparison.decisionType}`);
    console.log(`  Component: ${comparison.systemComponent}`);
    console.log(`  Timestamp: ${new Date(comparison.timestamp / 1000).toISOString()}`);
    console.log(`  Matches: ${comparison.matches ? '✓ YES' : '✗ NO'}`);
    
    if (comparison.differences.length > 0) {
      console.log(`  Differences (${comparison.differences.length}):`);
      comparison.differences.forEach(diff => {
        console.log(formatDifference(diff));
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main demo function
 */
async function main() {
  console.log('Outcome Comparison Demo');
  console.log('=======================\n');
  
  console.log('This demo shows how to compare replayed outcomes with original outcomes.');
  console.log('We\'ll create sample events and simulate replay differences.\n');
  
  try {
    // Create sample events
    console.log('Creating sample events...');
    const originalEvents = createSampleEvents();
    const replayedEvents = createReplayedEvents(originalEvents);
    
    console.log(`Created ${originalEvents.length} original events`);
    console.log(`Created ${replayedEvents.length} replayed events with simulated differences\n`);
    
    // Initialize replay engine
    console.log('Initializing Replay Engine...');
    const replayEngine = new ReplayEngine();
    
    // Define time range
    const timeRange = {
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date()
    };
    
    // Example 1: Basic comparison
    console.log('\n' + '='.repeat(80));
    console.log('EXAMPLE 1: Basic Outcome Comparison');
    console.log('='.repeat(80));
    
    const report1 = await replayEngine.compareOutcomes({
      timeRange,
      originalEvents,
      replayedEvents
    });
    
    displayReport(report1);
    
    // Example 2: Comparison with numeric tolerance
    console.log('\n\n' + '='.repeat(80));
    console.log('EXAMPLE 2: Comparison with 10% Numeric Tolerance');
    console.log('='.repeat(80));
    console.log('\nThis allows small variations in numeric values (e.g., timing differences)');
    
    const report2 = await replayEngine.compareOutcomes({
      timeRange,
      originalEvents,
      replayedEvents,
      numericTolerance: 10 // 10% tolerance
    });
    
    console.log('\nSummary with Tolerance:');
    console.log(`  Total Events:     ${report2.totalEvents}`);
    console.log(`  Matching Events:  ${report2.matchingEvents}`);
    console.log(`  Differing Events: ${report2.differingEvents}`);
    console.log(`  Match Percentage: ${report2.matchPercentage.toFixed(1)}%`);
    
    // Example 3: Filtering by decision type
    console.log('\n\n' + '='.repeat(80));
    console.log('EXAMPLE 3: Filtered Comparison (Scaling Decisions Only)');
    console.log('='.repeat(80));
    
    const report3 = await replayEngine.compareOutcomes({
      timeRange,
      originalEvents: originalEvents.filter(e => e.decision_type === 'scaling'),
      replayedEvents: replayedEvents.filter(e => e.decision_type === 'scaling'),
      decisionTypes: ['scaling']
    });
    
    console.log('\nFiltered Results:');
    console.log(`  Total Events:     ${report3.totalEvents}`);
    console.log(`  Matching Events:  ${report3.matchingEvents}`);
    console.log(`  Differing Events: ${report3.differingEvents}`);
    
    if (report3.comparisons.length > 0) {
      console.log('\nScaling Decision Differences:');
      report3.comparisons[0].differences.forEach(diff => {
        console.log(formatDifference(diff));
      });
    }
    
    // Example 4: Analyzing specific difference types
    console.log('\n\n' + '='.repeat(80));
    console.log('EXAMPLE 4: Analyzing Specific Difference Types');
    console.log('='.repeat(80));
    
    console.log('\nOutcome Status Changes:');
    const statusChanges = report1.comparisons.filter(c =>
      c.differences.some(d => d.type === 'outcome_status')
    );
    
    if (statusChanges.length > 0) {
      statusChanges.forEach(change => {
        const statusDiff = change.differences.find(d => d.type === 'outcome_status');
        console.log(`  Event ${change.eventId}:`);
        console.log(`    ${statusDiff.originalValue} → ${statusDiff.replayedValue}`);
      });
    } else {
      console.log('  No outcome status changes detected');
    }
    
    console.log('\nPerformance Regressions (>20% slower):');
    const regressions = report1.comparisons.filter(c =>
      c.differences.some(d =>
        d.field === 'outcome.duration_ms' &&
        d.percentageDiff &&
        d.percentageDiff > 20
      )
    );
    
    if (regressions.length > 0) {
      regressions.forEach(regression => {
        const perfDiff = regression.differences.find(d => d.field === 'outcome.duration_ms');
        console.log(`  Event ${regression.eventId}:`);
        console.log(`    ${perfDiff.originalValue}ms → ${perfDiff.replayedValue}ms`);
        console.log(`    Slowdown: ${perfDiff.percentageDiff.toFixed(1)}%`);
      });
    } else {
      console.log('  No significant performance regressions detected');
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(80));
    console.log('\nKey Takeaways:');
    console.log('  1. Outcome comparison identifies differences in replayed decisions');
    console.log('  2. Supports four types of differences: action parameters, outcome status,');
    console.log('     performance metrics, and impact measurements');
    console.log('  3. Numeric tolerance allows for acceptable variations');
    console.log('  4. Filtering enables focused analysis of specific decision types');
    console.log('  5. Detailed reports help identify patterns and regressions');
    
    console.log('\nUse Cases:');
    console.log('  - Testing system changes before deployment');
    console.log('  - Debugging incidents by comparing before/after outcomes');
    console.log('  - Performance analysis and regression detection');
    console.log('  - A/B testing validation for autonomous strategies');
    
    console.log('\nFor more information, see docs/OUTCOME-COMPARISON.md\n');
    
  } catch (error) {
    console.error('Error during demo:', error);
    process.exit(1);
  }
}

// Run the demo
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
