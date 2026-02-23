import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionPool } from '../../src/router/connectionPool.js';
import { WebSocketPool } from '../../src/router/websocket.js';

describe('Phase 2: Resource Management', () => {
  describe('Property 6: Graceful connection pool shutdown', () => {
    it('should wait for active requests before closing', async () => {
      const pool = new ConnectionPool({ maxSockets: 10 });

      // Simulate active requests
      pool.metrics.requestsActive = 3;

      const startTime = Date.now();

      // Start shutdown (should wait for requests)
      const shutdownPromise = pool.closeAll();

      // Simulate requests completing after 200ms
      setTimeout(() => {
        pool.metrics.requestsActive = 0;
      }, 200);

      await shutdownPromise;

      const duration = Date.now() - startTime;

      // Should have waited at least 200ms for requests to complete
      expect(duration).toBeGreaterThanOrEqual(150);
      expect(pool.pools.size).toBe(0);
    });

    it('should force close after grace period', async () => {
      const pool = new ConnectionPool({ maxSockets: 10 });

      // Simulate active requests that never complete
      pool.metrics.requestsActive = 5;

      const startTime = Date.now();
      await pool.closeAll();
      const duration = Date.now() - startTime;

      // Should force close after grace period (5 seconds)
      expect(duration).toBeLessThan(6000);
      expect(pool.pools.size).toBe(0);
    });
  });

  describe('Property 7: Component cleanup completeness', () => {
    it('should clear all WebSocket data structures on destroy', async () => {
      const wsPool = new WebSocketPool({ maxConnections: 10 });

      // Add some mock data
      wsPool.connections.set('conn1', { id: 'conn1', ws: { close: vi.fn() } });
      wsPool.connections.set('conn2', { id: 'conn2', ws: { close: vi.fn() } });
      wsPool.messageHandlers.set('test', vi.fn());

      await wsPool.destroy();

      expect(wsPool.connections.size).toBe(0);
      expect(wsPool.messageHandlers.size).toBe(0);
    });

    it('should stop heartbeat interval on destroy', async () => {
      const wsPool = new WebSocketPool({ heartbeatInterval: 1000 });

      wsPool.startHeartbeat();
      expect(wsPool.heartbeat).toBeDefined();

      await wsPool.destroy();

      expect(wsPool.heartbeat).toBeUndefined();
    });
  });

  describe('Unit Test: Forced shutdown after timeout', () => {
    it('should force close connections after grace period', async () => {
      const pool = new ConnectionPool();

      // Create a mock pool entry
      const mockAgent = { destroy: vi.fn() };
      pool.pools.set('test-pool', {
        agent: mockAgent,
        url: 'http://test.com',
        requests: 0,
        errors: 0,
        totalTime: 0
      });

      // Set active requests that won't complete
      pool.metrics.requestsActive = 10;

      await pool.closeAll();

      // Agent should be destroyed even with active requests
      expect(mockAgent.destroy).toHaveBeenCalled();
      expect(pool.pools.size).toBe(0);
    });
  });

  describe('Unit Test: WebSocket server shutdown', () => {
    it('should close server and clear connections', async () => {
      const wsPool = new WebSocketPool();

      // Mock server
      wsPool.server = {
        close: vi.fn((cb) => cb())
      };

      // Add mock connections
      wsPool.connections.set('conn1', {
        id: 'conn1',
        ws: { close: vi.fn(), readyState: 1 }
      });

      await wsPool.destroy();

      expect(wsPool.server.close).toHaveBeenCalled();
      expect(wsPool.connections.size).toBe(0);
    });
  });
});
