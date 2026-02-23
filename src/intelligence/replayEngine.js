/**
 * Replay Engine for Decision Intelligence
 * 
 * Provides time-travel debugging capabilities by replaying historical decisions
 * in a sandbox environment. Supports replay speed control from 1x to 100x real-time.
 * 
 * Requirements: 3.1, 3.3, 3.5
 */

import { trace, SpanStatusCode } from '@opentelemetry/api';
import { DecisionQueryAPI, DecisionQuery } from './queryAPI.js';

const tracer = trace.getTracer('neuralshell-replay-engine');

/**
 * Replay Engine
 * 
 * Replays historical decisions in chronological order with configurable speed
 * and sandbox isolation. Supports state reconstruction for time-travel debugging.
 */
export class ReplayEngine {
  constructor(queryAPI) {
    this.queryAPI = queryAPI || new DecisionQueryAPI();
    this.isReplaying = false;
    this.shouldStop = false;
    this.stateSnapshotCache = new Map();
    this.DEFAULT_SNAPSHOT_INTERVAL = 60000; // 1 minute in milliseconds
  }

  /**
   * Connect to the query API
   */
  async connect() {
    await this.queryAPI.connect();
  }

  /**
   * Disconnect from the query API
   */
  async disconnect() {
    await this.queryAPI.disconnect();
  }

  /**
   * Replay decisions from a time range
   */
  async replayDecisions(config) {
    if (this.isReplaying) {
      throw new Error('Replay already in progress');
    }

    // Validate configuration
    this.validateConfig(config);

    const span = tracer.startSpan('replayEngine.replayDecisions', {
      attributes: {
        'replay.sandbox': config.sandbox,
        'replay.speed': config.speed || 1,
        'replay.start_time': new Date(config.timeRange.startTime).toISOString(),
        'replay.end_time': new Date(config.timeRange.endTime).toISOString()
      }
    });

    this.isReplaying = true;
    this.shouldStop = false;

    const startRealTime = Date.now();
    const errors = [];
    let eventsReplayed = 0;

    try {
      // Fetch all events in the time range
      const events = await this.fetchEventsInTimeRange(config);

      if (events.length === 0) {
        span.addEvent('no_events_found');
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();

        return {
          eventsReplayed: 0,
          timeRange: config.timeRange,
          speed: config.speed || 1,
          sandbox: config.sandbox,
          totalRealTime: Date.now() - startRealTime,
          totalSimulatedTime: 0,
          errors: []
        };
      }

      span.setAttribute('replay.total_events', events.length);

      // Sort events chronologically
      events.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate time range
      const firstEventTime = events[0].timestamp;
      const lastEventTime = events[events.length - 1].timestamp;
      const totalSimulatedTime = (lastEventTime - firstEventTime) / 1000;

      // Replay events
      let previousEventTime = firstEventTime;

      for (let i = 0; i < events.length; i++) {
        if (this.shouldStop) {
          span.addEvent('replay_stopped');
          break;
        }

        const event = events[i];
        const currentEventTime = event.timestamp;

        // Calculate delay based on replay speed
        const timeDelta = (currentEventTime - previousEventTime) / 1000;
        const replaySpeed = config.speed || 1;
        const delayMs = timeDelta / replaySpeed;

        // Wait for the appropriate delay
        if (delayMs > 1) {
          await this.sleep(delayMs);
        }

        // Replay the event
        try {
          await this.replayEvent(event, config);
          eventsReplayed++;

          // Call onEvent callback if provided
          if (config.onEvent) {
            await config.onEvent(event, Date.now() - startRealTime);
          }

          // Report progress
          if (config.onProgress) {
            const progress = {
              eventsReplayed: eventsReplayed,
              totalEvents: events.length,
              currentTimestamp: currentEventTime,
              percentComplete: (eventsReplayed / events.length) * 100,
              elapsedRealTime: Date.now() - startRealTime,
              elapsedSimulatedTime: (currentEventTime - firstEventTime) / 1000
            };
            config.onProgress(progress);
          }
        } catch (error) {
          const replayError = {
            eventId: event.event_id,
            message: error.message,
            timestamp: currentEventTime
          };
          errors.push(replayError);

          span.addEvent('replay_error', {
            'event_id': event.event_id,
            'error': error.message
          });
        }

        previousEventTime = currentEventTime;
      }

      const totalRealTime = Date.now() - startRealTime;

      span.setAttribute('replay.events_replayed', eventsReplayed);
      span.setAttribute('replay.total_real_time_ms', totalRealTime);
      span.setAttribute('replay.errors', errors.length);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return {
        eventsReplayed,
        timeRange: config.timeRange,
        speed: config.speed || 1,
        sandbox: config.sandbox,
        totalRealTime,
        totalSimulatedTime,
        errors
      };
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();

      throw new Error(`Replay failed: ${error.message}`);
    } finally {
      this.isReplaying = false;
    }
  }

  /**
   * Stop an ongoing replay
   */
  stopReplay() {
    if (!this.isReplaying) {
      throw new Error('No replay in progress');
    }
    this.shouldStop = true;
  }

  /**
   * Compare replayed outcomes with original outcomes
   */
  async compareOutcomes(config) {
    const span = tracer.startSpan('replayEngine.compareOutcomes', {
      attributes: {
        'comparison.start_time': new Date(config.timeRange.startTime).toISOString(),
        'comparison.end_time': new Date(config.timeRange.endTime).toISOString()
      }
    });

    try {
      // Fetch original events if not provided
      let originalEvents = config.originalEvents;
      if (!originalEvents) {
        originalEvents = await this.fetchEventsInTimeRange({
          timeRange: config.timeRange,
          sandbox: true,
          decisionTypes: config.decisionTypes,
          systemComponents: config.systemComponents
        });
      }

      // Fetch replayed events if not provided
      let replayedEvents = config.replayedEvents;
      if (!replayedEvents) {
        replayedEvents = originalEvents;
      }

      span.setAttribute('comparison.original_events', originalEvents.length);
      span.setAttribute('comparison.replayed_events', replayedEvents.length);

      const originalMap = new Map();
      for (const event of originalEvents) {
        originalMap.set(event.event_id, event);
      }

      const replayedMap = new Map();
      for (const event of replayedEvents) {
        replayedMap.set(event.event_id, event);
      }

      const comparisons = [];
      const differenceSummary = {
        action_parameters: 0,
        outcome_status: 0,
        performance_metrics: 0,
        impact_measurements: 0
      };

      const allDifferences = [];

      for (const [eventId, originalEvent] of originalMap) {
        const replayedEvent = replayedMap.get(eventId);
        
        const comparison = this.compareEvent(
          originalEvent,
          replayedEvent,
          config.numericTolerance || 0
        );

        comparisons.push(comparison);

        for (const diff of comparison.differences) {
          differenceSummary[diff.type]++;
          allDifferences.push(diff);
        }
      }

      const totalEvents = comparisons.length;
      const matchingEvents = comparisons.filter(c => c.matches).length;
      const differingEvents = totalEvents - matchingEvents;
      const matchPercentage = totalEvents > 0 ? (matchingEvents / totalEvents) * 100 : 100;

      const maxTopDifferences = config.maxTopDifferences || 10;
      const topDifferences = this.findTopDifferences(allDifferences, maxTopDifferences);

      const report = {
        timeRange: config.timeRange,
        totalEvents,
        matchingEvents,
        differingEvents,
        matchPercentage,
        comparisons,
        differenceSummary,
        topDifferences,
        comparisonTimestamp: Date.now() * 1000
      };

      span.setAttribute('comparison.matching_events', matchingEvents);
      span.setAttribute('comparison.differing_events', differingEvents);
      span.setAttribute('comparison.match_percentage', matchPercentage);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return report;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();

      throw new Error(`Outcome comparison failed: ${error.message}`);
    }
  }

  /**
   * Compare a single event's original and replayed outcomes
   */
  compareEvent(originalEvent, replayedEvent, numericTolerance) {
    const differences = [];

    if (!replayedEvent) {
      return {
        eventId: originalEvent.event_id,
        decisionType: originalEvent.decision_type,
        systemComponent: originalEvent.system_component,
        timestamp: originalEvent.timestamp,
        matches: false,
        differences: [{
          type: 'outcome_status',
          field: 'event',
          originalValue: 'exists',
          replayedValue: 'missing',
          description: 'Replayed event not found'
        }],
        originalEvent
      };
    }

    this.compareActionParameters(
      originalEvent.action_taken,
      replayedEvent.action_taken,
      differences,
      numericTolerance
    );

    if (originalEvent.outcome.status !== replayedEvent.outcome.status) {
      differences.push({
        type: 'outcome_status',
        field: 'outcome.status',
        originalValue: originalEvent.outcome.status,
        replayedValue: replayedEvent.outcome.status,
        description: `Outcome status changed from ${originalEvent.outcome.status} to ${replayedEvent.outcome.status}`
      });
    }

    this.comparePerformanceMetrics(
      originalEvent.outcome,
      replayedEvent.outcome,
      differences,
      numericTolerance
    );

    this.compareImpactMeasurements(
      originalEvent.outcome.impact,
      replayedEvent.outcome.impact,
      differences,
      numericTolerance
    );

    return {
      eventId: originalEvent.event_id,
      decisionType: originalEvent.decision_type,
      systemComponent: originalEvent.system_component,
      timestamp: originalEvent.timestamp,
      matches: differences.length === 0,
      differences,
      originalEvent,
      replayedEvent
    };
  }

  compareActionParameters(original, replayed, differences, tolerance) {
    if (original.type !== replayed.type) {
      differences.push({
        type: 'action_parameters',
        field: 'action_taken.type',
        originalValue: original.type,
        replayedValue: replayed.type,
        description: `Action type changed from ${original.type} to ${replayed.type}`
      });
    }

    const allKeys = new Set([
      ...Object.keys(original.parameters || {}),
      ...Object.keys(replayed.parameters || {})
    ]);

    for (const key of allKeys) {
      const originalValue = original.parameters?.[key];
      const replayedValue = replayed.parameters?.[key];

      if (!this.valuesMatch(originalValue, replayedValue, tolerance)) {
        const diff = {
          type: 'action_parameters',
          field: `action_taken.parameters.${key}`,
          originalValue,
          replayedValue,
          description: `Parameter ${key} changed from ${originalValue} to ${replayedValue}`
        };

        if (typeof originalValue === 'number' && typeof replayedValue === 'number' && originalValue !== 0) {
          diff.percentageDiff = ((replayedValue - originalValue) / originalValue) * 100;
        }

        differences.push(diff);
      }
    }
  }

  comparePerformanceMetrics(original, replayed, differences, tolerance) {
    if (!this.valuesMatch(original.duration_ms, replayed.duration_ms, tolerance)) {
      const diff = {
        type: 'performance_metrics',
        field: 'outcome.duration_ms',
        originalValue: original.duration_ms,
        replayedValue: replayed.duration_ms,
        description: `Duration changed from ${original.duration_ms}ms to ${replayed.duration_ms}ms`
      };

      if (original.duration_ms !== 0) {
        diff.percentageDiff = ((replayed.duration_ms - original.duration_ms) / original.duration_ms) * 100;
      }

      differences.push(diff);
    }
  }

  compareImpactMeasurements(original, replayed, differences, tolerance) {
    const allKeys = new Set([
      ...Object.keys(original || {}),
      ...Object.keys(replayed || {})
    ]);

    for (const key of allKeys) {
      const originalValue = original?.[key];
      const replayedValue = replayed?.[key];

      if (!this.valuesMatch(originalValue, replayedValue, tolerance)) {
        const diff = {
          type: 'impact_measurements',
          field: `outcome.impact.${key}`,
          originalValue,
          replayedValue,
          description: `Impact metric ${key} changed from ${originalValue} to ${replayedValue}`
        };

        if (typeof originalValue === 'number' && typeof replayedValue === 'number' && originalValue !== 0) {
          diff.percentageDiff = ((replayedValue - originalValue) / originalValue) * 100;
        }

        differences.push(diff);
      }
    }
  }

  valuesMatch(value1, value2, tolerance) {
    if (value1 === value2) return true;
    if (value1 == null || value2 == null) return value1 === value2;

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      if (tolerance === 0) return value1 === value2;
      if (value1 === 0) return value2 === 0;
      const percentDiff = Math.abs((value2 - value1) / value1) * 100;
      return percentDiff <= tolerance;
    }

    return value1 === value2;
  }

  findTopDifferences(allDifferences, maxCount) {
    const diffCounts = new Map();

    for (const diff of allDifferences) {
      const key = `${diff.type}:${diff.field}`;
      const existing = diffCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        diffCounts.set(key, { diff, count: 1 });
      }
    }

    const sorted = Array.from(diffCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCount);

    return sorted.map(item => item.diff);
  }

  async reconstructState(config) {
    this.validateStateReconstructionConfig(config);

    const span = tracer.startSpan('replayEngine.reconstructState', {
      attributes: {
        'reconstruction.target_timestamp': new Date(config.targetTimestamp).toISOString(),
        'reconstruction.caching_enabled': config.enableCaching !== false
      }
    });

    try {
      const targetTimestamp = new Date(config.targetTimestamp).getTime();
      const enableCaching = config.enableCaching !== false;
      const snapshotInterval = config.snapshotInterval || this.DEFAULT_SNAPSHOT_INTERVAL;

      let startState = null;
      let startTimestamp = config.startTime ? new Date(config.startTime).getTime() : 0;
      let eventsProcessed = 0;

      if (enableCaching) {
        const cachedSnapshot = this.findClosestSnapshot(targetTimestamp);
        if (cachedSnapshot && cachedSnapshot.timestamp <= targetTimestamp) {
          startState = cachedSnapshot.state;
          startTimestamp = cachedSnapshot.timestamp;
          eventsProcessed = cachedSnapshot.eventCount;
        }
      }

      if (!startState) {
        startState = this.createEmptyState(startTimestamp);
      }

      const events = await this.fetchEventsForStateReconstruction(
        startTimestamp,
        targetTimestamp,
        config
      );

      let currentState = this.cloneState(startState);
      let lastSnapshotTimestamp = startTimestamp;

      for (const event of events) {
        this.applyEventToState(currentState, event);
        eventsProcessed++;

        if (enableCaching && 
            event.timestamp - lastSnapshotTimestamp >= snapshotInterval * 1000) {
          this.cacheStateSnapshot(event.timestamp, currentState, eventsProcessed);
          lastSnapshotTimestamp = event.timestamp;
        }
      }

      currentState.timestamp = targetTimestamp;
      currentState.eventsProcessed = eventsProcessed;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return currentState;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();

      throw new Error(`State reconstruction failed: ${error.message}`);
    }
  }

  validateConfig(config) {
    if (!config.timeRange || !config.timeRange.startTime || !config.timeRange.endTime) {
      throw new Error('timeRange with startTime and endTime is required');
    }
    if (new Date(config.timeRange.startTime) >= new Date(config.timeRange.endTime)) {
      throw new Error('startTime must be before endTime');
    }
  }

  validateStateReconstructionConfig(config) {
    if (!config.targetTimestamp) {
      throw new Error('targetTimestamp is required');
    }
  }

  createEmptyState(timestamp) {
    return {
      timestamp,
      componentStates: new Map(),
      metrics: {},
      eventsProcessed: 0,
      fromCache: false
    };
  }

  cloneState(state) {
    const clonedComponentStates = new Map();
    for (const [component, componentState] of state.componentStates) {
      clonedComponentStates.set(component, {
        component: componentState.component,
        state: { ...componentState.state },
        lastDecision: componentState.lastDecision,
        lastUpdated: componentState.lastUpdated
      });
    }

    return {
      timestamp: state.timestamp,
      componentStates: clonedComponentStates,
      metrics: { ...state.metrics },
      eventsProcessed: state.eventsProcessed,
      fromCache: false
    };
  }

  applyEventToState(state, event) {
    const component = event.system_component;
    let componentState = state.componentStates.get(component);
    if (!componentState) {
      componentState = { component, state: {}, lastUpdated: event.timestamp };
      state.componentStates.set(component, componentState);
    }

    if (event.context.state) {
      componentState.state = { ...componentState.state, ...event.context.state };
    }
    if (event.action_taken.parameters) {
      componentState.state = { ...componentState.state, ...event.action_taken.parameters };
    }

    componentState.lastDecision = event;
    componentState.lastUpdated = event.timestamp;

    if (event.context.metrics) {
      for (const [metricName, metricValue] of Object.entries(event.context.metrics)) {
        state.metrics[metricName] = metricValue;
      }
    }
    state.timestamp = event.timestamp;
  }

  findClosestSnapshot(targetTimestamp) {
    let closestSnapshot = null;
    let closestDistance = Infinity;

    for (const [timestamp, snapshot] of this.stateSnapshotCache) {
      if (timestamp <= targetTimestamp) {
        const distance = targetTimestamp - timestamp;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnapshot = snapshot;
        }
      }
    }
    return closestSnapshot;
  }

  cacheStateSnapshot(timestamp, state, eventCount) {
    this.stateSnapshotCache.set(timestamp, {
      timestamp,
      state: this.cloneState(state),
      eventCount
    });
    if (this.stateSnapshotCache.size > 100) {
      const oldestTimestamp = Math.min(...this.stateSnapshotCache.keys());
      this.stateSnapshotCache.delete(oldestTimestamp);
    }
  }

  async fetchEventsForStateReconstruction(startTimestamp, endTimestamp, config) {
    return this.fetchEventsInTimeRange({
      timeRange: { startTime: startTimestamp, endTime: endTimestamp },
      decisionTypes: config.decisionTypes,
      systemComponents: config.systemComponents
    });
  }

  async fetchEventsInTimeRange(config) {
    const allEvents = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const query = new DecisionQuery({
        startTime: config.timeRange.startTime,
        endTime: config.timeRange.endTime,
        decisionTypes: config.decisionTypes,
        systemComponents: config.systemComponents,
        limit: 1000,
        cursor: cursor || undefined,
        sortOrder: 'asc'
      });

      const result = await this.queryAPI.queryDecisions(query);
      allEvents.push(...result.events);
      hasMore = result.hasMore;
      cursor = result.nextCursor;
    }
    return allEvents;
  }

  async replayEvent(event, config) {
    const span = tracer.startSpan('replayEngine.replayEvent', {
      attributes: {
        'event.id': event.event_id,
        'event.decision_type': event.decision_type,
        'event.component': event.system_component,
        'replay.sandbox': config.sandbox
      }
    });

    try {
      if (config.sandbox) {
        span.addEvent('sandbox_replay', {
          'event_id': event.event_id,
          'decision_type': event.decision_type,
          'action_type': event.action_taken.type,
          'outcome_status': event.outcome.status
        });
      } else {
        throw new Error('Production replay not implemented for safety reasons. Use sandbox mode.');
      }
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics() {
    return {
      isReplaying: this.isReplaying,
      queryAPIMetrics: this.queryAPI.getMetrics()
    };
  }

  async healthCheck() {
    const queryHealth = await this.queryAPI.healthCheck();
    return queryHealth.healthy;
  }
}

let replayEngineInstance = null;

export function getReplayEngine(queryAPI) {
  if (!replayEngineInstance) {
    replayEngineInstance = new ReplayEngine(queryAPI);
  }
  return replayEngineInstance;
}

export default ReplayEngine;
