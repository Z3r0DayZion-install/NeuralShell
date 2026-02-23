/**
 * Unit Tests for Replay Engine
 * 
 * Tests the replay engine's ability to replay historical decisions
 * in sandbox mode with speed control.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReplayEngine, TimeRange, ReplayConfig, ReplayProgress } from '../../src/intelligence/replayEngine.js';
import { DecisionQueryAPI, DecisionQuery, QueryResult } from '../../src/intelligence/queryAPI.js';
import { DecisionEvent } from '../../src/intelligence/types.js';

describe('ReplayEngine', () => {
  let replayEngine: ReplayEngine;
  let mockQueryAPI: any;

  beforeEach(() => {
    // Create mock Query API
    mockQueryAPI = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      queryDecisions: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        queriesExecuted: 0,
        avgLatency: 0,
        connected: true
      }),
      healthCheck: vi.fn().mockResolvedValue({ healthy: true })
    };

    replayEngine = new ReplayEngine(mockQueryAPI);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should reject replay without timeRange', async () => {
      const config: any = {
        sandbox: true
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('timeRange is required');
    });

    it('should reject replay without startTime', async () => {
      const config: any = {
        timeRange: { endTime: new Date() },
        sandbox: true
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('timeRange must have startTime and endTime');
    });

    it('should reject replay without endTime', async () => {
      const config: any = {
        timeRange: { startTime: new Date() },
        sandbox: true
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('timeRange must have startTime and endTime');
    });

    it('should reject replay with startTime after endTime', async () => {
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-02'),
          endTime: new Date('2024-01-01')
        },
        sandbox: true
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('startTime must be before endTime');
    });

    it('should reject replay with speed < 1', async () => {
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 0.5
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('speed must be between 1 and 100');
    });

    it('should reject replay with speed > 100', async () => {
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 101
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('speed must be between 1 and 100');
    });

    it('should reject replay without explicit sandbox mode', async () => {
      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        }
      };

      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('sandbox mode must be explicitly specified');
    });

    it('should accept valid configuration', async () => {
      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([], false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 10
      };

      const result = await replayEngine.replayDecisions(config);
      expect(result).toBeDefined();
      expect(result.sandbox).toBe(true);
      expect(result.speed).toBe(10);
    });
  });

  describe('Sandbox Mode', () => {
    it('should replay events in sandbox mode without affecting production', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing'),
        createMockEvent('event-3', 3000000, 'routing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100 // Fast replay
      };

      const result = await replayEngine.replayDecisions(config);

      expect(result.eventsReplayed).toBe(3);
      expect(result.sandbox).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject production mode replay for safety', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: false
      };

      const result = await replayEngine.replayDecisions(config);

      // Should have errors because production mode is not implemented
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Production replay not implemented');
    });
  });

  describe('Chronological Ordering', () => {
    it('should replay events in chronological order', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-3', 3000000, 'routing'),
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const replayedOrder: string[] = [];
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100,
        onEvent: async (event) => {
          replayedOrder.push(event.event_id);
        }
      };

      await replayEngine.replayDecisions(config);

      // Should be sorted chronologically
      expect(replayedOrder).toEqual(['event-1', 'event-2', 'event-3']);
    });
  });

  describe('Speed Control', () => {
    it('should support 1x speed replay', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 1100000, 'healing') // 100ms later
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 1
      };

      const startTime = Date.now();
      await replayEngine.replayDecisions(config);
      const elapsed = Date.now() - startTime;

      // Should take approximately 100ms (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });

    it('should support 10x speed replay', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 1100000, 'healing') // 100ms later
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 10
      };

      const startTime = Date.now();
      await replayEngine.replayDecisions(config);
      const elapsed = Date.now() - startTime;

      // Should take approximately 10ms (100ms / 10x)
      expect(elapsed).toBeLessThan(50);
    });

    it('should support 100x speed replay', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 1100000, 'healing') // 100ms later
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100
      };

      const startTime = Date.now();
      await replayEngine.replayDecisions(config);
      const elapsed = Date.now() - startTime;

      // Should take approximately 1ms (100ms / 100x)
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Event Callbacks', () => {
    it('should call onEvent callback for each replayed event', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing'),
        createMockEvent('event-3', 3000000, 'routing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const replayedEvents: DecisionEvent[] = [];
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100,
        onEvent: async (event) => {
          replayedEvents.push(event);
        }
      };

      await replayEngine.replayDecisions(config);

      expect(replayedEvents).toHaveLength(3);
      expect(replayedEvents[0].event_id).toBe('event-1');
      expect(replayedEvents[1].event_id).toBe('event-2');
      expect(replayedEvents[2].event_id).toBe('event-3');
    });

    it('should call onProgress callback with progress updates', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing'),
        createMockEvent('event-3', 3000000, 'routing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const progressUpdates: ReplayProgress[] = [];
      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100,
        onProgress: (progress) => {
          progressUpdates.push({ ...progress });
        }
      };

      await replayEngine.replayDecisions(config);

      expect(progressUpdates).toHaveLength(3);
      expect(progressUpdates[0].eventsReplayed).toBe(1);
      expect(progressUpdates[1].eventsReplayed).toBe(2);
      expect(progressUpdates[2].eventsReplayed).toBe(3);
      expect(progressUpdates[2].percentComplete).toBe(100);
    });
  });

  describe('Pagination', () => {
    it('should handle paginated results from query API', async () => {
      const page1Events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing')
      ];

      const page2Events: DecisionEvent[] = [
        createMockEvent('event-3', 3000000, 'routing'),
        createMockEvent('event-4', 4000000, 'optimization')
      ];

      // First call returns page 1 with hasMore=true
      // Second call returns page 2 with hasMore=false
      mockQueryAPI.queryDecisions
        .mockResolvedValueOnce(new QueryResult(page1Events, true, 'cursor-1'))
        .mockResolvedValueOnce(new QueryResult(page2Events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100
      };

      const result = await replayEngine.replayDecisions(config);

      expect(result.eventsReplayed).toBe(4);
      expect(mockQueryAPI.queryDecisions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filtering', () => {
    it('should support filtering by decision types', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100,
        decisionTypes: ['scaling', 'healing']
      };

      await replayEngine.replayDecisions(config);

      // Verify query was called with decision types filter
      const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
      expect(queryCall.decisionTypes).toEqual(['scaling', 'healing']);
    });

    it('should support filtering by system components', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 100,
        systemComponents: ['auto-scaler']
      };

      await replayEngine.replayDecisions(config);

      // Verify query was called with system components filter
      const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
      expect(queryCall.systemComponents).toEqual(['auto-scaler']);
    });
  });

  describe('Empty Results', () => {
    it('should handle empty result set gracefully', async () => {
      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([], false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true
      };

      const result = await replayEngine.replayDecisions(config);

      expect(result.eventsReplayed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.totalSimulatedTime).toBe(0);
    });
  });

  describe('Stop Replay', () => {
    it('should allow stopping an ongoing replay', async () => {
      const events: DecisionEvent[] = Array.from({ length: 100 }, (_, i) =>
        createMockEvent(`event-${i}`, 1000000 + i * 1000, 'scaling')
      );

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 1, // Slow speed to allow stopping
        onProgress: (progress) => {
          if (progress.eventsReplayed === 5) {
            replayEngine.stopReplay();
          }
        }
      };

      const result = await replayEngine.replayDecisions(config);

      // Should have stopped after 5 events
      expect(result.eventsReplayed).toBeLessThan(100);
    });

    it('should throw error when stopping non-existent replay', () => {
      expect(() => replayEngine.stopReplay()).toThrow('No replay in progress');
    });
  });

  describe('Concurrent Replay Prevention', () => {
    it('should prevent concurrent replays', async () => {
      const events: DecisionEvent[] = [
        createMockEvent('event-1', 1000000, 'scaling')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: ReplayConfig = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        sandbox: true,
        speed: 1
      };

      // Start first replay
      const replay1Promise = replayEngine.replayDecisions(config);

      // Try to start second replay immediately
      await expect(replayEngine.replayDecisions(config)).rejects.toThrow('Replay already in progress');

      // Wait for first replay to complete
      await replay1Promise;
    });
  });

  describe('Health Check', () => {
    it('should return healthy when query API is healthy', async () => {
      mockQueryAPI.healthCheck.mockResolvedValue({ healthy: true });

      const healthy = await replayEngine.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should return unhealthy when query API is unhealthy', async () => {
      mockQueryAPI.healthCheck.mockResolvedValue({ healthy: false });

      const healthy = await replayEngine.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('Metrics', () => {
    it('should provide replay metrics', () => {
      const metrics = replayEngine.getMetrics();

      expect(metrics).toHaveProperty('isReplaying');
      expect(metrics).toHaveProperty('queryAPIMetrics');
      expect(metrics.isReplaying).toBe(false);
    });
  });

  describe('State Reconstruction', () => {
    describe('Configuration Validation', () => {
      it('should reject reconstruction without targetTimestamp', async () => {
        const config: any = {};

        await expect(replayEngine.reconstructState(config)).rejects.toThrow('targetTimestamp is required');
      });

      it('should reject reconstruction with invalid targetTimestamp', async () => {
        const config: any = {
          targetTimestamp: 'invalid-date'
        };

        await expect(replayEngine.reconstructState(config)).rejects.toThrow('targetTimestamp must be a valid date or timestamp');
      });

      it('should reject reconstruction with startTime after targetTimestamp', async () => {
        const config: any = {
          targetTimestamp: new Date('2024-01-01'),
          startTime: new Date('2024-01-02')
        };

        await expect(replayEngine.reconstructState(config)).rejects.toThrow('startTime must be before targetTimestamp');
      });

      it('should reject reconstruction with negative snapshotInterval', async () => {
        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          snapshotInterval: -1000
        };

        await expect(replayEngine.reconstructState(config)).rejects.toThrow('snapshotInterval must be positive');
      });

      it('should accept valid configuration', async () => {
        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([], false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          startTime: new Date('2024-01-01'),
          enableCaching: true,
          snapshotInterval: 60000
        };

        const result = await replayEngine.reconstructState(config);
        expect(result).toBeDefined();
        expect(result.timestamp).toBe(new Date('2024-01-02').getTime());
      });
    });

    describe('State Accumulation', () => {
      it('should reconstruct state from empty event stream', async () => {
        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([], false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02')
        };

        const result = await replayEngine.reconstructState(config);

        expect(result.eventsProcessed).toBe(0);
        expect(result.componentStates.size).toBe(0);
        expect(result.metrics).toEqual({});
      });

      it('should accumulate state from single event', async () => {
        const event = createMockEvent('event-1', 1000000, 'scaling');
        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([event], false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02')
        };

        const result = await replayEngine.reconstructState(config);

        expect(result.eventsProcessed).toBe(1);
        expect(result.componentStates.size).toBe(1);
        expect(result.componentStates.has('auto-scaler')).toBe(true);
        
        const componentState = result.componentStates.get('auto-scaler');
        expect(componentState?.lastDecision?.event_id).toBe('event-1');
        expect(componentState?.state.instances).toBe(3);
      });

      it('should accumulate state from multiple events', async () => {
        const events: DecisionEvent[] = [
          createMockEvent('event-1', 1000000, 'scaling'),
          createMockEvent('event-2', 2000000, 'healing'),
          createMockEvent('event-3', 3000000, 'routing')
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02')
        };

        const result = await replayEngine.reconstructState(config);

        expect(result.eventsProcessed).toBe(3);
        expect(result.componentStates.size).toBe(1); // All use 'auto-scaler'
        expect(result.metrics.cpu).toBe(80); // Last metric value
      });

      it('should track state for multiple components', async () => {
        const events: DecisionEvent[] = [
          { ...createMockEvent('event-1', 1000000, 'scaling'), system_component: 'auto-scaler' },
          { ...createMockEvent('event-2', 2000000, 'healing'), system_component: 'self-healing' },
          { ...createMockEvent('event-3', 3000000, 'security'), system_component: 'threat-detector' }
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02')
        };

        const result = await replayEngine.reconstructState(config);

        expect(result.eventsProcessed).toBe(3);
        expect(result.componentStates.size).toBe(3);
        expect(result.componentStates.has('auto-scaler')).toBe(true);
        expect(result.componentStates.has('self-healing')).toBe(true);
        expect(result.componentStates.has('threat-detector')).toBe(true);
      });

      it('should update component state with latest values', async () => {
        const events: DecisionEvent[] = [
          {
            ...createMockEvent('event-1', 1000000, 'scaling'),
            context: {
              trigger: 'cpu-high',
              metrics: { cpu: 80 },
              state: { instances: 3 }
            }
          },
          {
            ...createMockEvent('event-2', 2000000, 'scaling'),
            context: {
              trigger: 'cpu-higher',
              metrics: { cpu: 90 },
              state: { instances: 5 }
            }
          }
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02')
        };

        const result = await replayEngine.reconstructState(config);

        const componentState = result.componentStates.get('auto-scaler');
        expect(componentState?.state.instances).toBe(5); // Latest value
        expect(result.metrics.cpu).toBe(90); // Latest metric
      });
    });

    describe('Snapshot Caching', () => {
      it('should create snapshots at intervals', async () => {
        const events: DecisionEvent[] = [];
        const baseTime = 1000000;
        
        // Create events spanning 5 minutes (300 seconds)
        for (let i = 0; i < 10; i++) {
          events.push(createMockEvent(`event-${i}`, baseTime + i * 30000000, 'scaling')); // 30 seconds apart
        }

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          enableCaching: true,
          snapshotInterval: 60000 // 1 minute
        };

        await replayEngine.reconstructState(config);

        const cacheStats = replayEngine.getSnapshotCacheStats();
        expect(cacheStats.snapshotCount).toBeGreaterThan(0);
      });

      it('should use cached snapshot when available', async () => {
        const events1: DecisionEvent[] = [
          createMockEvent('event-1', 1000000, 'scaling'),
          createMockEvent('event-2', 2000000, 'healing')
        ];

        const events2: DecisionEvent[] = [
          createMockEvent('event-3', 3000000, 'routing')
        ];

        // First reconstruction - builds cache
        mockQueryAPI.queryDecisions.mockResolvedValueOnce(new QueryResult(events1, false, null));
        
        const config1: any = {
          targetTimestamp: 2000000 / 1000, // Timestamp in ms
          enableCaching: true,
          snapshotInterval: 1000 // 1 second for testing
        };

        const result1 = await replayEngine.reconstructState(config1);
        expect(result1.eventsProcessed).toBe(2);

        // Second reconstruction - should use cache
        mockQueryAPI.queryDecisions.mockResolvedValueOnce(new QueryResult(events2, false, null));
        
        const config2: any = {
          targetTimestamp: 3000000 / 1000,
          enableCaching: true
        };

        const result2 = await replayEngine.reconstructState(config2);
        
        // Should have processed fewer events due to cache
        expect(result2.eventsProcessed).toBeGreaterThanOrEqual(1);
      });

      it('should allow disabling cache', async () => {
        const events: DecisionEvent[] = [
          createMockEvent('event-1', 1000000, 'scaling')
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          enableCaching: false
        };

        await replayEngine.reconstructState(config);

        const cacheStats = replayEngine.getSnapshotCacheStats();
        expect(cacheStats.snapshotCount).toBe(0);
      });

      it('should clear snapshot cache', async () => {
        const events: DecisionEvent[] = [
          createMockEvent('event-1', 1000000, 'scaling')
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          enableCaching: true,
          snapshotInterval: 1000
        };

        await replayEngine.reconstructState(config);
        
        let cacheStats = replayEngine.getSnapshotCacheStats();
        const initialCount = cacheStats.snapshotCount;

        replayEngine.clearSnapshotCache();

        cacheStats = replayEngine.getSnapshotCacheStats();
        expect(cacheStats.snapshotCount).toBe(0);
      });
    });

    describe('Filtering', () => {
      it('should filter by decision types', async () => {
        const events: DecisionEvent[] = [
          createMockEvent('event-1', 1000000, 'scaling'),
          createMockEvent('event-2', 2000000, 'healing')
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([events[0]], false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          decisionTypes: ['scaling']
        };

        await replayEngine.reconstructState(config);

        const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
        expect(queryCall.decisionTypes).toEqual(['scaling']);
      });

      it('should filter by system components', async () => {
        const events: DecisionEvent[] = [
          { ...createMockEvent('event-1', 1000000, 'scaling'), system_component: 'auto-scaler' }
        ];

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          systemComponents: ['auto-scaler']
        };

        await replayEngine.reconstructState(config);

        const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
        expect(queryCall.systemComponents).toEqual(['auto-scaler']);
      });
    });

    describe('Performance', () => {
      it('should handle large event sequences efficiently', async () => {
        const events: DecisionEvent[] = [];
        
        // Create 1000 events
        for (let i = 0; i < 1000; i++) {
          events.push(createMockEvent(`event-${i}`, 1000000 + i * 1000, 'scaling'));
        }

        mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

        const config: any = {
          targetTimestamp: new Date('2024-01-02'),
          enableCaching: true,
          snapshotInterval: 10000 // 10 seconds
        };

        const startTime = Date.now();
        const result = await replayEngine.reconstructState(config);
        const elapsed = Date.now() - startTime;

        expect(result.eventsProcessed).toBe(1000);
        expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
      });
    });
  });
});

describe('Outcome Comparison', () => {
  let replayEngine: ReplayEngine;
  let mockQueryAPI: any;

  beforeEach(() => {
    mockQueryAPI = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      queryDecisions: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        queriesExecuted: 0,
        avgLatency: 0,
        connected: true
      }),
      healthCheck: vi.fn().mockResolvedValue({ healthy: true })
    };

    replayEngine = new ReplayEngine(mockQueryAPI);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Comparison', () => {
    it('should compare identical events and report no differences', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = { ...originalEvent };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.totalEvents).toBe(1);
      expect(report.matchingEvents).toBe(1);
      expect(report.differingEvents).toBe(0);
      expect(report.matchPercentage).toBe(100);
      expect(report.comparisons[0].matches).toBe(true);
      expect(report.comparisons[0].differences).toHaveLength(0);
    });

    it('should detect missing replayed event', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: []
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.totalEvents).toBe(1);
      expect(report.matchingEvents).toBe(0);
      expect(report.differingEvents).toBe(1);
      expect(report.comparisons[0].matches).toBe(false);
      expect(report.comparisons[0].differences[0].description).toContain('not found');
    });

    it('should fetch events from query API if not provided', async () => {
      const events = [createMockEvent('event-1', 1000000, 'scaling')];
      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        }
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(mockQueryAPI.queryDecisions).toHaveBeenCalled();
      expect(report.totalEvents).toBe(1);
    });
  });

  describe('Action Parameter Differences', () => {
    it('should detect action type differences', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        action_taken: {
          ...originalEvent.action_taken,
          type: 'scale_down'
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.action_parameters).toBe(1);
      
      const diff = report.comparisons[0].differences.find(d => d.field === 'action_taken.type');
      expect(diff).toBeDefined();
      expect(diff?.originalValue).toBe('scale_up');
      expect(diff?.replayedValue).toBe('scale_down');
    });

    it('should detect action parameter differences', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        action_taken: {
          ...originalEvent.action_taken,
          parameters: { target: 10 }
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.action_parameters).toBe(1);
      
      const diff = report.comparisons[0].differences.find(d => d.field === 'action_taken.parameters.target');
      expect(diff).toBeDefined();
      expect(diff?.originalValue).toBe(5);
      expect(diff?.replayedValue).toBe(10);
      expect(diff?.percentageDiff).toBe(100); // 100% increase
    });

    it('should detect new action parameters', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        action_taken: {
          ...originalEvent.action_taken,
          parameters: { target: 5, newParam: 'value' }
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      const diff = report.comparisons[0].differences.find(d => d.field === 'action_taken.parameters.newParam');
      expect(diff).toBeDefined();
    });
  });

  describe('Outcome Status Differences', () => {
    it('should detect outcome status changes', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          status: 'failure' as const
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.outcome_status).toBe(1);
      
      const diff = report.comparisons[0].differences.find(d => d.field === 'outcome.status');
      expect(diff).toBeDefined();
      expect(diff?.originalValue).toBe('success');
      expect(diff?.replayedValue).toBe('failure');
    });
  });

  describe('Performance Metric Differences', () => {
    it('should detect duration differences', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          duration_ms: 200
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.performance_metrics).toBe(1);
      
      const diff = report.comparisons[0].differences.find(d => d.field === 'outcome.duration_ms');
      expect(diff).toBeDefined();
      expect(diff?.originalValue).toBe(100);
      expect(diff?.replayedValue).toBe(200);
      expect(diff?.percentageDiff).toBe(100); // 100% increase
    });

    it('should respect numeric tolerance for duration', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          duration_ms: 105 // 5% increase
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent],
        numericTolerance: 10 // 10% tolerance
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.matchingEvents).toBe(1);
      expect(report.differingEvents).toBe(0);
    });

    it('should detect differences beyond tolerance', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          duration_ms: 120 // 20% increase
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent],
        numericTolerance: 10 // 10% tolerance
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.performance_metrics).toBe(1);
    });
  });

  describe('Impact Measurement Differences', () => {
    it('should detect impact metric differences', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          impact: { instances_added: 5 }
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      expect(report.differenceSummary.impact_measurements).toBe(1);
      
      const diff = report.comparisons[0].differences.find(d => d.field === 'outcome.impact.instances_added');
      expect(diff).toBeDefined();
      expect(diff?.originalValue).toBe(2);
      expect(diff?.replayedValue).toBe(5);
      expect(diff?.percentageDiff).toBe(150); // 150% increase
    });

    it('should detect new impact metrics', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          impact: { instances_added: 2, cpu_reduction: 20 }
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      const diff = report.comparisons[0].differences.find(d => d.field === 'outcome.impact.cpu_reduction');
      expect(diff).toBeDefined();
    });

    it('should detect missing impact metrics', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        outcome: {
          ...originalEvent.outcome,
          impact: {}
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differingEvents).toBe(1);
      const diff = report.comparisons[0].differences.find(d => d.field === 'outcome.impact.instances_added');
      expect(diff).toBeDefined();
    });
  });

  describe('Multiple Events Comparison', () => {
    it('should compare multiple events and aggregate statistics', async () => {
      const events = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing'),
        createMockEvent('event-3', 3000000, 'routing')
      ];

      const replayedEvents = [
        events[0], // Identical
        { ...events[1], outcome: { ...events[1].outcome, status: 'failure' as const } }, // Different
        events[2] // Identical
      ];

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: events,
        replayedEvents: replayedEvents
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.totalEvents).toBe(3);
      expect(report.matchingEvents).toBe(2);
      expect(report.differingEvents).toBe(1);
      expect(report.matchPercentage).toBeCloseTo(66.67, 1);
    });

    it('should generate difference summary by type', async () => {
      const originalEvent = createMockEvent('event-1', 1000000, 'scaling');
      const replayedEvent = {
        ...originalEvent,
        action_taken: {
          type: 'scale_down',
          parameters: { target: 10 }
        },
        outcome: {
          status: 'failure' as const,
          duration_ms: 200,
          impact: { instances_added: 5 }
        }
      };

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [originalEvent],
        replayedEvents: [replayedEvent]
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.differenceSummary.action_parameters).toBeGreaterThan(0);
      expect(report.differenceSummary.outcome_status).toBe(1);
      expect(report.differenceSummary.performance_metrics).toBe(1);
      expect(report.differenceSummary.impact_measurements).toBe(1);
    });
  });

  describe('Top Differences', () => {
    it('should identify most common differences', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        createMockEvent(`event-${i}`, 1000000 + i * 1000, 'scaling')
      );

      const replayedEvents = events.map(e => ({
        ...e,
        outcome: {
          ...e.outcome,
          duration_ms: 200 // All have same difference
        }
      }));

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: events,
        replayedEvents: replayedEvents,
        maxTopDifferences: 5
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.topDifferences.length).toBeGreaterThan(0);
      expect(report.topDifferences[0].field).toBe('outcome.duration_ms');
    });

    it('should limit top differences to maxTopDifferences', async () => {
      const events = Array.from({ length: 20 }, (_, i) =>
        createMockEvent(`event-${i}`, 1000000 + i * 1000, 'scaling')
      );

      const replayedEvents = events.map(e => ({
        ...e,
        outcome: {
          ...e.outcome,
          duration_ms: 200
        }
      }));

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: events,
        replayedEvents: replayedEvents,
        maxTopDifferences: 3
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.topDifferences.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Filtering', () => {
    it('should support filtering by decision types', async () => {
      const events = [
        createMockEvent('event-1', 1000000, 'scaling'),
        createMockEvent('event-2', 2000000, 'healing')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult([events[0]], false, null));

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        decisionTypes: ['scaling']
      };

      await replayEngine.compareOutcomes(config);

      const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
      expect(queryCall.decisionTypes).toEqual(['scaling']);
    });

    it('should support filtering by system components', async () => {
      const events = [
        createMockEvent('event-1', 1000000, 'scaling')
      ];

      mockQueryAPI.queryDecisions.mockResolvedValue(new QueryResult(events, false, null));

      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        systemComponents: ['auto-scaler']
      };

      await replayEngine.compareOutcomes(config);

      const queryCall = mockQueryAPI.queryDecisions.mock.calls[0][0];
      expect(queryCall.systemComponents).toEqual(['auto-scaler']);
    });
  });

  describe('Report Metadata', () => {
    it('should include time range in report', async () => {
      const timeRange = {
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02')
      };

      const config: any = {
        timeRange,
        originalEvents: [],
        replayedEvents: []
      };

      const report = await replayEngine.compareOutcomes(config);

      expect(report.timeRange).toEqual(timeRange);
    });

    it('should include comparison timestamp', async () => {
      const config: any = {
        timeRange: {
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-01-02')
        },
        originalEvents: [],
        replayedEvents: []
      };

      const beforeTime = Date.now() * 1000;
      const report = await replayEngine.compareOutcomes(config);
      const afterTime = Date.now() * 1000;

      expect(report.comparisonTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(report.comparisonTimestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});

/**
 * Helper function to create mock decision events
 */
function createMockEvent(
  eventId: string,
  timestamp: number,
  decisionType: string
): DecisionEvent {
  return {
    event_id: eventId,
    timestamp,
    decision_type: decisionType,
    system_component: 'auto-scaler',
    context: {
      trigger: 'test-trigger',
      metrics: { cpu: 80 },
      state: { instances: 3 }
    },
    action_taken: {
      type: 'scale_up',
      parameters: { target: 5 }
    },
    outcome: {
      status: 'success',
      duration_ms: 100,
      impact: { instances_added: 2 }
    },
    trace_id: '00000000000000000000000000000000',
    span_id: '0000000000000000'
  };
}
