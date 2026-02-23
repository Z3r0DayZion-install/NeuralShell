import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { RouterCore } from './src/router/routerCore.js';
import { CircuitBreakerManager } from './src/router/circuitBreaker.js';
import { ResponseCache } from './src/router/responseCache.js';
import { PriorityQueue, PRIORITIES } from './src/router/priorityQueue.js';
import { ConnectionPool } from './src/router/connectionPool.js';
import { PrometheusExporter } from './src/router/prometheus.js';
import { StreamManager } from './src/router/streaming.js';
import { WebSocketPool } from './src/router/websocket.js';
import { createGraphQLRouter } from './src/router/graphql.js';
import { OAuth2Provider, APIKeyManager } from './src/router/auth.js';
import { TenantManager, TenantIsolation } from './src/router/multitenancy.js';
import { CostTracker, BillingManager } from './src/router/costTracking.js';
import { ChaosEngine } from './src/router/chaosEngine.js';
import { LoadBalancer } from './src/router/loadBalancer.js';
import { PluginManager } from './src/router/pluginSystem.js';

export function buildUnifiedServer(options = {}) {
  const app = Fastify({
    logger: options.logger !== false,
    trustProxy: true,
    bodyLimit: options.bodyLimit || 262144
  });

  const config = {
    port: options.port || 3000,
    timeoutMs: options.timeoutMs || 5000,
    maxConcurrent: options.maxConcurrent || 100,
    queueSize: options.queueSize || 256,
    ...options
  };

  const routerCore = new RouterCore({
    port: config.port,
    timeoutMs: config.timeoutMs,
    maxConcurrent: config.maxConcurrent,
    queueSize: config.queueSize,
    cache: options.cache ?? { enabled: true, ttl: 300 },
    circuitBreaker: options.circuitBreaker ?? { enabled: true, failureThreshold: 5 }
  });

  const connectionPool = new ConnectionPool({ maxSockets: 50 });
  const streamManager = new StreamManager({ maxStreams: 100 });
  const wsPool = new WebSocketPool({ maxConnections: 100 });
  const prometheus = new PrometheusExporter({ namespace: 'neuralshell', subsystem: 'unified' });
  const apiKeyManager = new APIKeyManager();
  const tenantManager = new TenantManager();
  const tenantIsolation = new TenantIsolation(tenantManager);
  const costTracker = new CostTracker();
  const billingManager = new BillingManager({ costTracker });
  const chaosEngine = new ChaosEngine({ enabled: options.chaosEnabled || false });
  const loadBalancer = new LoadBalancer({ strategy: options.lbStrategy || 'adaptive' });
  const pluginManager = new PluginManager();

  if (options.endpoints) {
    for (const ep of options.endpoints) {
      routerCore.addEndpoint(ep);
      loadBalancer.addEndpoint(ep.name, ep.url, ep.weight);
    }
  }

  app.addHook('onRequest', async (request, reply) => {
    if (options.chaosEnabled) {
      await chaosEngine.execute('latency', { min: 10, max: 50 });
    }
  });

  app.get('/health', async () => {
    return { ok: true, timestamp: Date.now(), version: options.version || '1.0.0' };
  });

  app.get('/ready', async () => {
    return {
      timeoutMs: config.timeoutMs,
      maxConcurrent: config.maxConcurrent,
      endpoints: routerCore.getEndpointStats(),
      circuitBreaker: routerCore.circuitBreaker.getAllStats(),
      cache: routerCore.responseCache.getStats(),
      tenants: tenantManager.tenants.size
    };
  });

  app.get('/metrics', async () => {
    return routerCore.getMetrics();
  });

  app.get('/metrics/prometheus', async (req, reply) => {
    const metrics = routerCore.getPrometheusMetrics();
    reply.header('Content-Type', 'text/plain');
    return metrics;
  });

  app.get('/endpoints', async () => {
    return {
      endpoints: routerCore.getEndpointStats(),
      loadBalancer: loadBalancer.getStats()
    };
  });

  app.post('/endpoints/reset', async () => {
    routerCore.resetEndpoints();
    loadBalancer.clearCooldowns();
    return { success: true };
  });

  app.post('/metrics/reset', async () => {
    routerCore.resetMetrics();
    prometheus.resetAll();
    return { success: true };
  });

  app.get('/admin/tenants', async () => {
    return { tenants: tenantManager.listTenants() };
  });

  app.post('/admin/tenants', async (request) => {
    const tenant = tenantManager.createTenant(request.body);
    return tenant;
  });

  app.get('/admin/costs', async () => {
    return costTracker.getAllTenantsSummary();
  });

  app.get('/admin/chaos/experiments', async () => {
    return { experiments: chaosEngine.getExperiments() };
  });

  app.post('/admin/chaos/experiments', async (request) => {
    const experiment = chaosEngine.createExperiment(request.body);
    if (request.body.enabled) {
      chaosEngine.enableExperiment(experiment.id);
    }
    return experiment;
  });

  app.get('/admin/plugins', async () => {
    return { plugins: pluginManager.listPlugins() };
  });

  app.post('/prompt', async (request, reply) => {
    const { messages, model, temperature, max_tokens, stream, priority } = request.body || {};

    if (!messages || !Array.isArray(messages)) {
      reply.status(400);
      return { error: 'INVALID_PAYLOAD', message: 'messages array required' };
    }

    if (stream) {
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Connection', 'keep-alive');

      try {
        const endpoint = routerCore.selectEndpoint();
        if (!endpoint) {
          reply.write('data: {"error":"NO_ACTIVE_ENDPOINTS"}\n\n');
          return reply;
        }

        const streamId = streamManager.createStream(request.id || 'stream').id;

        const result = await routerCore.callEndpoint(endpoint, { messages, model, temperature, max_tokens }, {
          stream: true,
          onChunk: (chunk) => {
            reply.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          }
        });

        reply.write('data: [DONE]\n\n');
        return reply;
      } catch (err) {
        reply.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        return reply;
      }
    }

    const result = await routerCore.executeRequest({ messages, model, temperature, max_tokens });
    return result;
  });

  app.get('/v1/models', async () => {
    const endpoints = routerCore.getEndpointStats();
    return {
      data: endpoints.map(ep => ({
        id: ep.name,
        object: 'model',
        created: Date.now(),
        owned_by: 'neuralshell'
      }))
    };
  });

  app.get('/graphql/schema', async () => {
    return { schema: createGraphQLRouter({}).getSchemaSDL() };
  });

  app.post('/graphql', async (req, reply) => {
    const graphql = createGraphQLRouter({
      health: () => ({ ok: true, uptime: Date.now() - routerCore.startTime }),
      metrics: () => routerCore.getMetrics(),
      endpoints: () => routerCore.getEndpointStats(),
      version: () => options.version || '1.0.0'
    });
    return graphql.handle(req, reply);
  });

  app.register(async function (ws) {
    ws.get('/ws', { websocket: true }, (connection, req) => {
      const clientId = connection.socket.protocol || 'default';

      connection.socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'prompt') {
            const result = await routerCore.executeRequest(message.payload);
            connection.socket.send(JSON.stringify({ type: 'response', data: result }));
          }

          if (message.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (err) {
          connection.socket.send(JSON.stringify({ type: 'error', error: err.message }));
        }
      });

      connection.socket.on('close', () => {
        wsPool.close(clientId);
      });

      connection.socket.send(JSON.stringify({ type: 'connected', clientId }));
    });
  });

  app.get('/streams', async () => {
    return streamManager.getStats();
  });

  const originalClose = app.close.bind(app);
  app.close = async () => {
    routerCore.shutdown();
    connectionPool.closeAll();
    streamManager.destroy();
    wsPool.destroy();
    chaosEngine.enabled = false;
    return originalClose();
  };

  app.routerCore = routerCore;
  app.connectionPool = connectionPool;
  app.streamManager = streamManager;
  app.wsPool = wsPool;
  app.prometheus = prometheus;
  app.apiKeyManager = apiKeyManager;
  app.tenantManager = tenantManager;
  app.tenantIsolation = tenantIsolation;
  app.costTracker = costTracker;
  app.billingManager = billingManager;
  app.chaosEngine = chaosEngine;
  app.loadBalancer = loadBalancer;
  app.pluginManager = pluginManager;

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildUnifiedServer({
    port: 3000,
    version: '2.0.0',
    endpoints: [
      { name: 'ollama', url: 'http://localhost:11434/api/generate', model: 'llama3', weight: 1 },
      { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4', weight: 2 }
    ],
    cache: { enabled: true, ttl: 60 },
    circuitBreaker: { enabled: true },
    chaosEnabled: false,
    lbStrategy: 'adaptive'
  });

  server.listen({ port: 3000 }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('NeuralShell Unified Server running on port 3000');
    console.log('  REST: http://localhost:3000');
    console.log('  WebSocket: ws://localhost:3000/ws');
    console.log('  GraphQL: http://localhost:3000/graphql');
  });
}
