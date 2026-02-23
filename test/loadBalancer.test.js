const { describe, it, expect, beforeEach } = require('@jest/globals');
const LoadBalancer = require('../src/router/loadBalancer');

describe('LoadBalancer', () => {
  let lb;
  const endpoints = [
    { id: 'ep1', url: 'http://localhost:3001', weight: 1 },
    { id: 'ep2', url: 'http://localhost:3002', weight: 2 },
    { id: 'ep3', url: 'http://localhost:3003', weight: 1 }
  ];

  beforeEach(() => {
    lb = new LoadBalancer({ strategy: 'round-robin' });
  });

  describe('constructor', () => {
    it('should initialize with default strategy', () => {
      expect(lb.strategy).toBe('round-robin');
    });
  });

  describe('round-robin', () => {
    it('should distribute requests evenly', () => {
      const selected = [];
      for (let i = 0; i < 6; i++) {
        selected.push(lb.select('round-robin', endpoints));
      }
      const counts = {};
      selected.forEach(ep => counts[ep.id] = (counts[ep.id] || 0) + 1);
      expect(counts.ep1).toBe(2);
      expect(counts.ep2).toBe(2);
      expect(counts.ep3).toBe(2);
    });
  });

  describe('least-connections', () => {
    it('should select endpoint with least connections', () => {
      const selected = lb.select('least-connections', endpoints);
      expect(selected).toBeDefined();
    });
  });

  describe('weighted', () => {
    it('should respect weights', () => {
      const selected = [];
      for (let i = 0; i < 40; i++) {
        selected.push(lb.select('weighted', endpoints));
      }
      const counts = {};
      selected.forEach(ep => counts[ep.id] = (counts[ep.id] || 0) + 1);
      expect(counts.ep2).toBeGreaterThan(counts.ep1);
    });
  });

  describe('random', () => {
    it('should select random endpoint', () => {
      const selected = lb.select('random', endpoints);
      expect(endpoints.includes(selected)).toBe(true);
    });
  });

  describe('ip-hash', () => {
    it('should hash consistent for same IP', () => {
      const ep1 = lb.select('ip-hash', endpoints, '192.168.1.1');
      const ep2 = lb.select('ip-hash', endpoints, '192.168.1.1');
      expect(ep1.id).toBe(ep2.id);
    });

    it('should distribute different IPs', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
      const selected = ips.map(ip => lb.select('ip-hash', endpoints, ip));
      const unique = new Set(selected.map(e => e.id));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('least-response-time', () => {
    it('should select fastest endpoint', () => {
      lb.updateResponseTime('ep1', 100);
      lb.updateResponseTime('ep2', 50);
      lb.updateResponseTime('ep3', 200);
      const selected = lb.select('least-response-time', endpoints);
      expect(selected.id).toBe('ep2');
    });
  });

  describe('health-based', () => {
    it('should exclude unhealthy endpoints', () => {
      lb.updateHealth('ep1', false);
      lb.updateHealth('ep2', true);
      lb.updateHealth('ep3', true);
      const selected = lb.select('health-based', endpoints);
      expect(selected.id).not.toBe('ep1');
    });
  });

  describe('priority', () => {
    it('should prioritize higher priority endpoints', () => {
      const prioritized = [
        { id: 'ep1', url: 'http://localhost:3001', priority: 1 },
        { id: 'ep2', url: 'http://localhost:3002', priority: 3 },
        { id: 'ep3', url: 'http://localhost:3003', priority: 2 }
      ];
      const selected = lb.select('priority', prioritized);
      expect(selected.id).toBe('ep2');
    });
  });

  describe('adaptive', () => {
    it('should adapt based on performance', () => {
      lb.updateResponseTime('ep1', 50);
      lb.updateResponseTime('ep2', 500);
      const selected = lb.select('adaptive', endpoints);
      expect(selected.id).toBe('ep1');
    });
  });

  describe('management', () => {
    it('should add endpoint', () => {
      lb.addEndpoint({ id: 'ep4', url: 'http://localhost:3004' });
      expect(lb.endpoints.length).toBe(4);
    });

    it('should remove endpoint', () => {
      lb.removeEndpoint('ep1');
      expect(lb.endpoints.length).toBe(2);
    });

    it('should update endpoint', () => {
      lb.updateEndpoint('ep1', { weight: 5 });
      const ep = lb.endpoints.find(e => e.id === 'ep1');
      expect(ep.weight).toBe(5);
    });
  });
});
