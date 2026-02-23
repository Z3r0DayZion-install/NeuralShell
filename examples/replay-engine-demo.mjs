/**
 * Replay Engine Demo
 * 
 * Demonstrates the replay engine's ability to replay historical decisions
 * in a sandbox environment with speed control.
 */

import { getReplayEngine } from '../src/intelligence/replayEngine.js';
import { getQueryAPI } from '../src/intelligence/queryAPI.js';
import { getDecisionEngine } from '../src/intelligence/decisionEngine.js';

/**
 * Demo 1: Basic Replay
 * 
 * Replays decisions from a time range at 10x speed
 */
async function demoBasicReplay() {
  console.log('\n=== Demo 1: Basic Replay ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  try {
    // Replay decisions from the last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const now = new Date();

    console.log(`Replaying decisions from ${oneHourAgo.toISOString()} to ${now.toISOString()}`);
    console.log('Speed: 10x');
    console.log('Sandbox: enabled\n');

    const result = await replayEngine.replayDecisions({
      timeRange: {
        startTime: oneHourAgo,
        endTime: now
      },
      sandbox: true,
      speed: 10
    });

    console.log('\nReplay Complete!');
    console.log(`Events replayed: ${result.eventsReplayed}`);
    console.log(`Real time: ${result.totalRealTime}ms`);
    console.log(`Simulated time: ${result.totalSimulatedTime}ms`);
    console.log(`Errors: ${result.errors.length}`);
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Demo 2: Replay with Event Callbacks
 * 
 * Replays decisions and processes each event
 */
async function demoReplayWithCallbacks() {
  console.log('\n=== Demo 2: Replay with Event Callbacks ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  try {
    const stats = {
      total: 0,
      byType: {},
      byOutcome: {
        success: 0,
        failure: 0,
        partial: 0
      }
    };

    const result = await replayEngine.replayDecisions({
      timeRange: {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date()
      },
      sandbox: true,
      speed: 100, // Fast replay

      onEvent: async (event, replayTime) => {
        stats.total++;
        
        // Count by type
        stats.byType[event.decision_type] = (stats.byType[event.decision_type] || 0) + 1;
        
        // Count by outcome
        if (event.outcome.status in stats.byOutcome) {
          stats.byOutcome[event.outcome.status]++;
        }
      },

      onProgress: (progress) => {
        if (progress.eventsReplayed % 10 === 0 || progress.percentComplete === 100) {
          console.log(`Progress: ${progress.percentComplete.toFixed(1)}% (${progress.eventsReplayed}/${progress.totalEvents} events)`);
        }
      }
    });

    console.log('\nReplay Statistics:');
    console.log(`Total events: ${stats.total}`);
    console.log('\nBy decision type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('\nBy outcome:');
    console.log(`  Success: ${stats.byOutcome.success}`);
    console.log(`  Failure: ${stats.byOutcome.failure}`);
    console.log(`  Partial: ${stats.byOutcome.partial}`);
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Demo 3: Filtered Replay
 * 
 * Replays only specific types of decisions
 */
async function demoFilteredReplay() {
  console.log('\n=== Demo 3: Filtered Replay ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  try {
    console.log('Replaying only scaling decisions from auto-scaler...\n');

    const result = await replayEngine.replayDecisions({
      timeRange: {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date()
      },
      sandbox: true,
      speed: 50,
      decisionTypes: ['scaling'],
      systemComponents: ['auto-scaler'],

      onEvent: async (event) => {
        console.log(`[${new Date(event.timestamp / 1000).toISOString()}] ${event.action_taken.type} - ${event.outcome.status}`);
      }
    });

    console.log(`\nReplayed ${result.eventsReplayed} scaling decisions`);
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Demo 4: Analyze Decision Quality
 * 
 * Replays decisions and analyzes quality scores
 */
async function demoQualityAnalysis() {
  console.log('\n=== Demo 4: Decision Quality Analysis ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  try {
    const qualityData = [];

    await replayEngine.replayDecisions({
      timeRange: {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date()
      },
      sandbox: true,
      speed: 100,

      onEvent: async (event) => {
        if (event.quality_score !== undefined) {
          qualityData.push({
            type: event.decision_type,
            score: event.quality_score,
            outcome: event.outcome.status
          });
        }
      }
    });

    if (qualityData.length > 0) {
      // Calculate average quality score
      const avgScore = qualityData.reduce((sum, d) => sum + d.score, 0) / qualityData.length;
      
      // Find min and max
      const minScore = Math.min(...qualityData.map(d => d.score));
      const maxScore = Math.max(...qualityData.map(d => d.score));
      
      // Count low quality decisions (< 60)
      const lowQuality = qualityData.filter(d => d.score < 60).length;

      console.log('Quality Score Analysis:');
      console.log(`  Total decisions with scores: ${qualityData.length}`);
      console.log(`  Average score: ${avgScore.toFixed(2)}`);
      console.log(`  Min score: ${minScore}`);
      console.log(`  Max score: ${maxScore}`);
      console.log(`  Low quality decisions (< 60): ${lowQuality}`);

      // Group by decision type
      const byType = {};
      qualityData.forEach(d => {
        if (!byType[d.type]) {
          byType[d.type] = [];
        }
        byType[d.type].push(d.score);
      });

      console.log('\nAverage score by decision type:');
      Object.entries(byType).forEach(([type, scores]) => {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        console.log(`  ${type}: ${avg.toFixed(2)}`);
      });
    } else {
      console.log('No decisions with quality scores found');
    }
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Demo 5: Stop Replay
 * 
 * Demonstrates stopping an ongoing replay
 */
async function demoStopReplay() {
  console.log('\n=== Demo 5: Stop Replay ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  try {
    console.log('Starting replay (will stop at 50%)...\n');

    const result = await replayEngine.replayDecisions({
      timeRange: {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date()
      },
      sandbox: true,
      speed: 1, // Slow speed to allow stopping

      onProgress: (progress) => {
        console.log(`Progress: ${progress.percentComplete.toFixed(1)}%`);
        
        // Stop at 50%
        if (progress.percentComplete >= 50 && replayEngine.isReplayInProgress()) {
          console.log('\nStopping replay...');
          replayEngine.stopReplay();
        }
      }
    });

    console.log(`\nReplay stopped after ${result.eventsReplayed} events`);
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Demo 6: Speed Comparison
 * 
 * Compares replay times at different speeds
 */
async function demoSpeedComparison() {
  console.log('\n=== Demo 6: Speed Comparison ===\n');

  const replayEngine = getReplayEngine();
  await replayEngine.connect();

  const timeRange = {
    startTime: new Date(Date.now() - 600000), // 10 minutes ago
    endTime: new Date()
  };

  const speeds = [1, 10, 100];

  try {
    for (const speed of speeds) {
      console.log(`\nReplaying at ${speed}x speed...`);
      
      const startTime = Date.now();
      const result = await replayEngine.replayDecisions({
        timeRange,
        sandbox: true,
        speed
      });
      const elapsed = Date.now() - startTime;

      console.log(`  Events: ${result.eventsReplayed}`);
      console.log(`  Real time: ${elapsed}ms`);
      console.log(`  Simulated time: ${result.totalSimulatedTime}ms`);
      console.log(`  Speedup: ${(result.totalSimulatedTime / elapsed).toFixed(2)}x`);
    }
  } catch (error) {
    console.error('Replay failed:', error.message);
  } finally {
    await replayEngine.disconnect();
  }
}

/**
 * Main demo runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Replay Engine Demo - Time-Travel Debugging        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Run all demos
    await demoBasicReplay();
    await demoReplayWithCallbacks();
    await demoFilteredReplay();
    await demoQualityAnalysis();
    await demoStopReplay();
    await demoSpeedComparison();

    console.log('\n✓ All demos completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Demo failed:', error);
    process.exit(1);
  }
}

// Run demos
main();
