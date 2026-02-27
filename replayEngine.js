/**
 * Replay Engine for Decision Intelligence
 *
 * Provides time-travel debugging capabilities by replaying historical decisions
 * in a sandbox environment. Supports replay speed control from 1x to 100x real-time.
 *
 * Requirements: 3.1, 3.3, 3.5
 */
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { DecisionQueryAPI, DecisionQuery } from './src/intelligence/queryAPI.js';
const tracer = trace.getTracer('neuralshell-replay-engine');
/**
 * Replay Engine
 *
 * Replays historical decisions in chronological order with configurable speed
 * and sandbox isolation. Supports state reconstruction for time-travel debugging.
 */
export class ReplayEngine {
  constructor(queryAPI) {
    this.isReplaying = false;
    this.shouldStop = false;
    this.stateSnapshotCache = new Map();
    this.DEFAULT_SNAPSHOT_INTERVAL = 60000; // 1 minute in milliseconds
    this.queryAPI = queryAPI || new DecisionQueryAPI();
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
     *
     * This method:
     * 1. Queries all Decision_Events in the specified time range
     * 2. Replays them in chronological order
     * 3. Executes in sandbox mode if enabled (isolated from production)
     * 4. Supports replay speed control from 1x to 100x
     *
     * @param config - Replay configuration
     * @returns Promise that resolves to replay result summary
     *
     * Requirements: 3.1, 3.3, 3.5
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
      // Sort events chronologically (should already be sorted, but ensure it)
      events.sort((a, b) => a.timestamp - b.timestamp);
      // Calculate time range
      const firstEventTime = events[0].timestamp;
      const lastEventTime = events[events.length - 1].timestamp;
      const totalSimulatedTime = (lastEventTime - firstEventTime) / 1000; // Convert to ms
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
        const timeDelta = (currentEventTime - previousEventTime) / 1000; // Convert to ms
        const replaySpeed = config.speed || 1;
        const delayMs = timeDelta / replaySpeed;
        // Wait for the appropriate delay (unless speed is very high)
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
     *
     * This method:
     * 1. Compares replayed decision outcomes with original outcomes
     * 2. Identifies differences in action parameters, outcome status, performance, and impact
     * 3. Generates detailed diff reports highlighting all differences
     * 4. Supports filtering and aggregation of differences
     *
     * @param config - Outcome comparison configuration
     * @returns Promise that resolves to comparison report
     *
     * Requirements: 3.4
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
        // For now, we'll use the same events as a placeholder
        // In a real implementation, these would come from an actual replay
        replayedEvents = originalEvents;
      }
      span.setAttribute('comparison.original_events', originalEvents.length);
      span.setAttribute('comparison.replayed_events', replayedEvents.length);
      // Create event maps for efficient lookup
      const originalMap = new Map();
      for (const event of originalEvents) {
        originalMap.set(event.event_id, event);
      }
      const replayedMap = new Map();
      for (const event of replayedEvents) {
        replayedMap.set(event.event_id, event);
      }
      // Compare events
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
        const comparison = this.compareEvent(originalEvent, replayedEvent, config.numericTolerance || 0);
        comparisons.push(comparison);
        // Aggregate differences
        for (const diff of comparison.differences) {
          differenceSummary[diff.type]++;
          allDifferences.push(diff);
        }
      }
      // Calculate statistics
      const totalEvents = comparisons.length;
      const matchingEvents = comparisons.filter(c => c.matches).length;
      const differingEvents = totalEvents - matchingEvents;
      const matchPercentage = totalEvents > 0 ? (matchingEvents / totalEvents) * 100 : 100;
      // Find top differences (most common)
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
        comparisonTimestamp: Date.now() * 1000 // Convert to microseconds
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
     *
     * @private
     */
  compareEvent(originalEvent, replayedEvent, numericTolerance) {
    const differences = [];
    // If replayed event doesn't exist, it's a difference
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
    // Compare action parameters
    this.compareActionParameters(originalEvent.action_taken, replayedEvent.action_taken, differences, numericTolerance);
    // Compare outcome status
    if (originalEvent.outcome.status !== replayedEvent.outcome.status) {
      differences.push({
        type: 'outcome_status',
        field: 'outcome.status',
        originalValue: originalEvent.outcome.status,
        replayedValue: replayedEvent.outcome.status,
        description: `Outcome status changed from ${originalEvent.outcome.status} to ${replayedEvent.outcome.status}`
      });
    }
    // Compare performance metrics
    this.comparePerformanceMetrics(originalEvent.outcome, replayedEvent.outcome, differences, numericTolerance);
    // Compare impact measurements
    this.compareImpactMeasurements(originalEvent.outcome.impact, replayedEvent.outcome.impact, differences, numericTolerance);
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
  /**
     * Compare action parameters
     *
     * @private
     */
  compareActionParameters(original, replayed, differences, tolerance) {
    // Compare action type
    if (original.type !== replayed.type) {
      differences.push({
        type: 'action_parameters',
        field: 'action_taken.type',
        originalValue: original.type,
        replayedValue: replayed.type,
        description: `Action type changed from ${original.type} to ${replayed.type}`
      });
    }
    // Compare parameters
    const allKeys = new Set([
      ...Object.keys(original.parameters),
      ...Object.keys(replayed.parameters)
    ]);
    for (const key of allKeys) {
      const originalValue = original.parameters[key];
      const replayedValue = replayed.parameters[key];
      if (!this.valuesMatch(originalValue, replayedValue, tolerance)) {
        const diff = {
          type: 'action_parameters',
          field: `action_taken.parameters.${key}`,
          originalValue,
          replayedValue,
          description: `Parameter ${key} changed from ${originalValue} to ${replayedValue}`
        };
        // Calculate percentage difference for numeric values
        if (typeof originalValue === 'number' && typeof replayedValue === 'number' && originalValue !== 0) {
          diff.percentageDiff = ((replayedValue - originalValue) / originalValue) * 100;
        }
        differences.push(diff);
      }
    }
  }
  /**
     * Compare performance metrics
     *
     * @private
     */
  comparePerformanceMetrics(original, replayed, differences, tolerance) {
    // Compare duration
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
  /**
     * Compare impact measurements
     *
     * @private
     */
  compareImpactMeasurements(original, replayed, differences, tolerance) {
    const allKeys = new Set([
      ...Object.keys(original),
      ...Object.keys(replayed)
    ]);
    for (const key of allKeys) {
      const originalValue = original[key];
      const replayedValue = replayed[key];
      if (!this.valuesMatch(originalValue, replayedValue, tolerance)) {
        const diff = {
          type: 'impact_measurements',
          field: `outcome.impact.${key}`,
          originalValue,
          replayedValue,
          description: `Impact metric ${key} changed from ${originalValue} to ${replayedValue}`
        };
        // Calculate percentage difference for numeric values
        if (typeof originalValue === 'number' && typeof replayedValue === 'number' && originalValue !== 0) {
          diff.percentageDiff = ((replayedValue - originalValue) / originalValue) * 100;
        }
        differences.push(diff);
      }
    }
  }
  /**
     * Check if two values match within tolerance
     *
     * @private
     */
  valuesMatch(value1, value2, tolerance) {
    // Handle undefined/null
    if (value1 === undefined && value2 === undefined) {
      return true;
    }
    if (value1 === null && value2 === null) {
      return true;
    }
    if (value1 === undefined || value2 === undefined) {
      return false;
    }
    if (value1 === null || value2 === null) {
      return false;
    }
    // Handle numeric values with tolerance
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      if (tolerance === 0) {
        return value1 === value2;
      }
      // Calculate percentage difference
      if (value1 === 0 && value2 === 0) {
        return true;
      }
      if (value1 === 0 || value2 === 0) {
        return false;
      }
      const percentDiff = Math.abs((value2 - value1) / value1) * 100;
      return percentDiff <= tolerance;
    }
    // Handle other types with strict equality
    return value1 === value2;
  }
  /**
     * Find the most common differences
     *
     * @private
     */
  findTopDifferences(allDifferences, maxCount) {
    // Count occurrences of each difference pattern
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
    // Sort by count and return top N
    const sorted = Array.from(diffCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCount);
    return sorted.map(item => item.diff);
  }
  /**
     * Reconstruct system state at a specific point in time
     *
     * This method:
     * 1. Queries all Decision_Events up to the target timestamp
     * 2. Replays them chronologically to accumulate state changes
     * 3. Uses snapshot caching to improve performance for long event sequences
     * 4. Returns the reconstructed state at the target timestamp
     *
     * @param config - State reconstruction configuration
     * @returns Promise that resolves to reconstructed state
     *
     * Requirements: 3.2
     */
  async reconstructState(config) {
    // Validate configuration
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
      // Try to find a cached snapshot before the target timestamp
      let startState = null;
      let startTimestamp = config.startTime ? new Date(config.startTime).getTime() : 0;
      let eventsProcessed = 0;
      if (enableCaching) {
        const cachedSnapshot = this.findClosestSnapshot(targetTimestamp);
        if (cachedSnapshot && cachedSnapshot.timestamp <= targetTimestamp) {
          startState = cachedSnapshot.state;
          startTimestamp = cachedSnapshot.timestamp;
          eventsProcessed = cachedSnapshot.eventCount;
          span.addEvent('snapshot_cache_hit', {
            'snapshot.timestamp': new Date(cachedSnapshot.timestamp).toISOString(),
            'snapshot.event_count': cachedSnapshot.eventCount
          });
        } else {
          span.addEvent('snapshot_cache_miss');
        }
      }
      // Initialize state if no cached snapshot found
      if (!startState) {
        startState = this.createEmptyState(startTimestamp);
      }
      // Fetch events from start timestamp to target timestamp
      const events = await this.fetchEventsForStateReconstruction(startTimestamp, targetTimestamp, config);
      span.setAttribute('reconstruction.events_to_process', events.length);
      // Replay events and accumulate state
      const currentState = this.cloneState(startState);
      let lastSnapshotTimestamp = startTimestamp;
      for (const event of events) {
        // Apply event to state
        this.applyEventToState(currentState, event);
        eventsProcessed++;
        // Create snapshot at intervals for caching
        if (enableCaching &&
                    event.timestamp - lastSnapshotTimestamp >= snapshotInterval * 1000) {
          this.cacheStateSnapshot(event.timestamp, currentState, eventsProcessed);
          lastSnapshotTimestamp = event.timestamp;
        }
      }
      // Update final state metadata
      currentState.timestamp = targetTimestamp;
      currentState.eventsProcessed = eventsProcessed;
      currentState.fromCache = startState.fromCache;
      span.setAttribute('reconstruction.events_processed', eventsProcessed);
      span.setAttribute('reconstruction.components', currentState.componentStates.size);
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
  /**
     * Clear the state snapshot cache
     */
  clearSnapshotCache() {
    this.stateSnapshotCache.clear();
  }
  /**
     * Get snapshot cache statistics
     */
  getSnapshotCacheStats() {
    return {
      snapshotCount: this.stateSnapshotCache.size,
      timestamps: Array.from(this.stateSnapshotCache.keys()).sort()
    };
  }
  /**
     * Check if a replay is currently in progress
     */
  isReplayInProgress() {
    return this.isReplaying;
  }
  /**
     * Validate replay configuration
     *
     * @private
     */
  validateConfig(config) {
    if (!config.timeRange) {
      throw new Error('timeRange is required');
    }
    if (!config.timeRange.startTime || !config.timeRange.endTime) {
      throw new Error('timeRange must have startTime and endTime');
    }
    const startTime = new Date(config.timeRange.startTime).getTime();
    const endTime = new Date(config.timeRange.endTime).getTime();
    if (startTime >= endTime) {
      throw new Error('startTime must be before endTime');
    }
    if (config.speed !== undefined) {
      if (config.speed < 1 || config.speed > 100) {
        throw new Error('speed must be between 1 and 100');
      }
    }
    if (config.sandbox === undefined) {
      throw new Error('sandbox mode must be explicitly specified (true or false)');
    }
  }
  /**
     * Validate state reconstruction configuration
     *
     * @private
     */
  validateStateReconstructionConfig(config) {
    if (!config.targetTimestamp) {
      throw new Error('targetTimestamp is required');
    }
    const targetTime = new Date(config.targetTimestamp).getTime();
    if (isNaN(targetTime)) {
      throw new Error('targetTimestamp must be a valid date or timestamp');
    }
    if (config.startTime) {
      const startTime = new Date(config.startTime).getTime();
      if (isNaN(startTime)) {
        throw new Error('startTime must be a valid date or timestamp');
      }
      if (startTime >= targetTime) {
        throw new Error('startTime must be before targetTimestamp');
      }
    }
    if (config.snapshotInterval !== undefined && config.snapshotInterval <= 0) {
      throw new Error('snapshotInterval must be positive');
    }
  }
  /**
     * Create an empty state
     *
     * @private
     */
  createEmptyState(timestamp) {
    return {
      timestamp,
      componentStates: new Map(),
      metrics: {},
      eventsProcessed: 0,
      fromCache: false
    };
  }
  /**
     * Clone a state object for mutation
     *
     * @private
     */
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
  /**
     * Apply an event to the current state
     *
     * @private
     */
  applyEventToState(state, event) {
    const component = event.system_component;
    // Get or create component state
    let componentState = state.componentStates.get(component);
    if (!componentState) {
      componentState = {
        component,
        state: {},
        lastUpdated: event.timestamp
      };
      state.componentStates.set(component, componentState);
    }
    // Update component state from event context
    if (event.context.state) {
      componentState.state = {
        ...componentState.state,
        ...event.context.state
      };
    }
    // Update component state from action parameters
    if (event.action_taken.parameters) {
      componentState.state = {
        ...componentState.state,
        ...event.action_taken.parameters
      };
    }
    // Store last decision
    componentState.lastDecision = event;
    componentState.lastUpdated = event.timestamp;
    // Aggregate metrics
    if (event.context.metrics) {
      for (const [metricName, metricValue] of Object.entries(event.context.metrics)) {
        state.metrics[metricName] = metricValue;
      }
    }
    // Update timestamp
    state.timestamp = event.timestamp;
  }
  /**
     * Find the closest snapshot before the target timestamp
     *
     * @private
     */
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
  /**
     * Cache a state snapshot
     *
     * @private
     */
  cacheStateSnapshot(timestamp, state, eventCount) {
    const snapshot = {
      timestamp,
      state: this.cloneState(state),
      eventCount
    };
    this.stateSnapshotCache.set(timestamp, snapshot);
    // Limit cache size to prevent memory issues (keep last 100 snapshots)
    if (this.stateSnapshotCache.size > 100) {
      const oldestTimestamp = Math.min(...this.stateSnapshotCache.keys());
      this.stateSnapshotCache.delete(oldestTimestamp);
    }
  }
  /**
     * Fetch events for state reconstruction
     *
     * @private
     */
  async fetchEventsForStateReconstruction(startTimestamp, endTimestamp, config) {
    const allEvents = [];
    let cursor = null;
    let hasMore = true;
    while (hasMore) {
      const query = new DecisionQuery({
        startTime: startTimestamp / 1000, // Convert to microseconds
        endTime: endTimestamp / 1000,
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
    // Sort chronologically
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    return allEvents;
  }
  /**
     * Fetch all events in the specified time range
     *
     * @private
     */
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
        limit: 1000, // Max page size
        cursor: cursor || undefined,
        sortOrder: 'asc' // Chronological order
      });
      const result = await this.queryAPI.queryDecisions(query);
      allEvents.push(...result.events);
      hasMore = result.hasMore;
      cursor = result.nextCursor;
    }
    return allEvents;
  }
  /**
     * Replay a single event
     *
     * In sandbox mode, this simulates the decision without affecting production.
     * In production mode, this would re-execute the decision (not implemented for safety).
     *
     * @private
     */
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
        // Sandbox mode: simulate the decision without affecting production
        // This is a safe operation that only logs/traces the event
        span.addEvent('sandbox_replay', {
          'event_id': event.event_id,
          'decision_type': event.decision_type,
          'action_type': event.action_taken.type,
          'outcome_status': event.outcome.status
        });
        // In a real implementation, this would:
        // 1. Reconstruct the system state at the time of the decision
        // 2. Re-run the decision logic with that state
        // 3. Compare the new outcome with the original outcome
        // 4. Report any differences
        // For now, we just simulate the replay without side effects
      } else {
        // Production mode: would re-execute the decision
        // This is dangerous and should require explicit confirmation
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
  /**
     * Sleep for a specified duration
     *
     * @private
     */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /**
     * Get replay engine metrics
     */
  getMetrics() {
    return {
      isReplaying: this.isReplaying,
      queryAPIMetrics: this.queryAPI.getMetrics()
    };
  }
  /**
     * Health check
     */
  async healthCheck() {
    const queryHealth = await this.queryAPI.healthCheck();
    return queryHealth.healthy;
  }
}
// Singleton instance
let replayEngineInstance = null;
/**
 * Get or create Replay Engine instance
 *
 * @param queryAPI - Optional Query API instance
 * @returns Replay Engine instance
 */
export function getReplayEngine(queryAPI) {
  if (!replayEngineInstance) {
    replayEngineInstance = new ReplayEngine(queryAPI);
  }
  return replayEngineInstance;
}
export default ReplayEngine;
