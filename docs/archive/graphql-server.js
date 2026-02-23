import Fastify from 'fastify';
import { createGraphQLRouter } from './src/router/graphql.js';
import { RouterCore } from './src/router/routerCore.js';

export function buildGraphQLServer(options = {}) {
  const app = Fastify({ logger: true });

  const routerCore = options.router || new RouterCore(options);

  const context = {
    health: () => ({
      ok: true,
      uptime: Date.now() - routerCore.startTime,
      version: options.version || '1.0.0'
    }),
    metrics: () => routerCore.getMetrics(),
    endpoints: () => routerCore.getEndpointStats(),
    config: () => ({
      port: routerCore.options.port,
      timeoutMs: routerCore.options.timeoutMs,
      strategy: 'adaptive',
      adaptive: true,
      maxMessagesPerRequest: 64,
      maxMessageChars: 8000
    }),
    version: () => options.version || '1.0.0',
    resetMetrics: () => { routerCore.resetMetrics(); return true; },
    resetEndpoints: () => { routerCore.resetEndpoints(); return true; },
    reloadEndpoints: (endpoints) => {
      routerCore.setEndpoints(endpoints);
      return true;
    },
    resetIdempotency: () => true,
    resetRateLimits: () => true,
    analytics: (args) => ({
      totalRequests: routerCore.metrics.total,
      totalTokens: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      byModel: []
    })
  };

  const graphql = createGraphQLRouter(context);

  app.get('/graphql/schema', async () => {
    return { schema: graphql.getSchemaSDL() };
  });

  app.post('/graphql', async (req, reply) => {
    return graphql.handle(req, reply);
  });

  app.get('/health', async () => ({ ok: true }));

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildGraphQLServer({
    port: 3002,
    endpoints: [
      { name: 'ollama', url: 'http://localhost:11434/api/generate', model: 'llama3' },
      { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4' }
    ]
  });

  server.listen({ port: 3002 }, (err) => {
    if (err) throw err;
    console.log('GraphQL server on http://localhost:3002/graphql');
  });
}
