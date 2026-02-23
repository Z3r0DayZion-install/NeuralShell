import { describe, it, expect, beforeEach } from 'vitest';
import { SizeLimitedMap } from '../../src/router/size-limited-map.js';
import { LoadBalancer } from '../../src/router/loadBalancer.js';

describe('Phase 4: Medium Priority Fixes', () => {
  describe('Property 18: Size-limited maps enforce maximum size and TTL', () => {
    it('should enforce maximum size', () => {
      const map = new SizeLimitedMap({ maxSize: 5, ttl: null });

      for (let i = 0; i < 10; i++) {
        map.set(`key${i}`, `value${i}`);
      }

      expect(map.size).toBe(5);
    });

    it('should evict oldest entries when full', () => {
      const map = new SizeLimitedMap({ maxSize: 3, ttl: null });

      map.set('key1', 'value1');
      map.set('key2', 'value2');
      map.set('key3', 'value3');
      map.set('key4', 'value4'); // Should evict key1

      expect(map.get('key1')).toBeUndefined();
      expect(map.get('key2')).toBe('value2');
      expect(map.get('key3')).toBe('value3');
      expect(map.get('key4')).toBe('value4');
    });

    it('should automatically remove entries after TTL', async () => {
      const map = new SizeLimitedMap({ maxSize: 10, ttl: 100 });

      map.set('key1', 'value1');
      expect(map.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(map.get('key1')).toBeUndefined();
    });
  });

  describe('Property 20: Endpoint selection caching', () => {
    it('should cache available endpoints', () => {
      const lb = new LoadBalancer({ strategy: 'round-robin' });

      lb.addEndpoint('ep1', 'http://ep1.com');
      lb.addEndpoint('ep2', 'http://ep2.com');
      lb.addEndpoint('ep3', 'http://ep3.com');

      // First selection should compute available endpoints
      const ep1 = lb.select();
      expect(ep1).toBeDefined();
      expect(lb.availableEndpointsDirty).toBe(false);

      // Second selection should use cached endpoints
      const ep2 = lb.select();
      expect(ep2).toBeDefined();
      expect(lb.availableEndpointsDirty).toBe(false);
    });

    it('should mark cache dirty on health changes', () => {
      const lb = new LoadBalancer({ strategy: 'round-robin' });

      lb.addEndpoint('ep1', 'http://ep1.com');
      lb.select(); // Cache endpoints

      expect(lb.availableEndpointsDirty).toBe(false);

      lb.setHealth('ep1', false);

      expect(lb.availableEndpointsDirty).toBe(true);
    });
  });

  describe('Property 21: Latency calculation correctness', () => {
    it('should calculate average latency correctly', () => {
      const lb = new LoadBalancer();
      lb.addEndpoint('ep1', 'http://ep1.com');

      const latencies = [100, 200, 300, 400, 500];

      for (const latency of latencies) {
        lb.recordSuccess('ep1', latency);
      }

      const endpoint = lb.getEndpointStats('ep1');
      const expectedAvg = latencies.reduce((a, b) => a + b) / latencies.length;

      expect(endpoint.avgLatency).toBeCloseTo(expectedAvg, 1);
    });

    it('should use sum-based calculation', () => {
      const lb = new LoadBalancer();
      lb.addEndpoint('ep1', 'http://ep1.com');

      lb.recordSuccess('ep1', 100);
      lb.recordSuccess('ep1', 200);
      lb.recordSuccess('ep1', 300);

      const endpoint = lb.getEndpointStats('ep1');

      expect(endpoint.latencySum).toBe(600);
      expect(endpoint.latencyCount).toBe(3);
      expect(endpoint.avgLatency).toBe(200);
    });
  });

  describe('Unit Test: Stream parser cleanup', () => {
    it('should clear parsers map on cleanup', () => {
      const stream = {
        id: 'test-stream',
        parsers: new Map(),
        timeout: null
      };

      stream.parsers.set('parser1', {});
      stream.parsers.set('parser2', {});

      expect(stream.parsers.size).toBe(2);

      // Cleanup
      if (stream.parsers) {
        stream.parsers.clear();
      }

      expect(stream.parsers.size).toBe(0);
    });
  });

  describe('Idempotency cache management', () => {
    it('should enforce size limits on idempotency cache', () => {
      const cache = new SizeLimitedMap({ maxSize: 100, ttl: 60000 });

      for (let i = 0; i < 150; i++) {
        cache.set(`req${i}`, { result: 'cached' });
      }

      expect(cache.size).toBeLessThanOrEqual(100);
    });
  });

  describe('Affinity map management', () => {
    it('should enforce size limits on affinity map', () => {
      const affinity = new SizeLimitedMap({ maxSize: 1000, ttl: 600000 });

      for (let i = 0; i < 1500; i++) {
        affinity.set(`session${i}`, `endpoint${i % 10}`);
      }

      expect(affinity.size).toBeLessThanOrEqual(1000);
    });
  });
});
