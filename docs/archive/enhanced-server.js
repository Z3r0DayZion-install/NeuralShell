import Fastify from 'fastify';
import { RouterCore } from './src/router/routerCore.js';

export function buildEnhancedServer(options = {}) {
  const app = Fastify({
    logger: options.logger !== false,
    trustProxy: true
  });

  const routerCore = new RouterCore({
    port: options.port || 3000,
    timeoutMs: options.timeoutMs || 5000,
    maxConcurrent: options.maxConcurrent || 32,
    queueSize: options.queueSize || 128,
    cache: {
      enabled: options.cache?.enabled ?? true,
      ttl: options.cache?.ttl || 300
    },
    circuitBreaker: {
      enabled: options.circuitBreaker?.enabled ?? true,
      failureThreshold: options.circuitBreaker?.failureThreshold || 5,
      timeoutMs: options.circuitBreaker?.timeoutMs || 30000
    }
  });

  if (options.endpoints) {
    for (const ep of options.endpoints) {
      routerCore.addEndpoint(ep);
    }
  }

  app.get('/health', async () => {
    return { ok: true, timestamp: Date.now() };
  });

  app.get('/ready', async () => {
    return {
      timeoutMs: routerCore.options.timeoutMs,
      maxConcurrent: routerCore.options.maxConcurrent,
      endpoints: routerCore.getEndpointStats().map(ep => ({
        name: ep.name,
        healthy: ep.healthy,
        inCooldown: ep.inCooldown
      }))
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
    const stats = routerCore.getEndpointStats();
    return { endpoints: stats };
  });

  app.post('/endpoints/reset', async () => {
    routerCore.resetEndpoints();
    return { success: true };
  });

  app.post('/metrics/reset', async () => {
    routerCore.resetMetrics();
    return { success: true };
  });

  app.post('/prompt', async (request, reply) => {
    const { messages, model, temperature, max_tokens, stream } = request.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      reply.status(400);
      return { error: 'INVALID_PAYLOAD', message: 'messages array is required' };
    }

    try {
      const result = await routerCore.executeRequest({
        messages,
        model,
        temperature,
        max_tokens
      }, {
        useCache: options.cache?.enabled ?? true
      });

      if (stream) {
        reply.header('Content-Type', 'text/event-stream');
        reply.header('Cache-Control', 'no-cache');
        reply.header('Connection', 'keep-alive');
        
        const stream = result.choices?.[0]?.message?.content || '';
        const words = stream.split(' ');
        
        for (const word of words) {
          reply.write(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`);
          await new Promise(r => setTimeout(r, 50));
        }
        reply.write('data: [DONE]\n\n');
        return reply;
      }

      return result;
    } catch (err) {
      const statusCode = err.statusCode || 502;
      reply.status(statusCode);
      return {
        error: err.code || 'ALL_ENDPOINTS_FAILED',
        message: err.message || 'All endpoints failed',
        requestId: err.requestId
      };
    }
  });

  app.get('/version', async () => {
    return {
      version: options.version || '1.0.0',
      startTime: new Date(routerCore.startTime).toISOString()
    };
  });

  const originalClose = app.close.bind(app);
  app.close = async () => {
    routerCore.shutdown();
    return originalClose();
  };

  app.routerCore = routerCore;

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildEnhancedServer({
    port: 3000,
    endpoints: [
      { name: 'ollama', url: 'http://localhost:11434/api/generate', model: 'llama3', weight: 1 },
      { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4', weight: 2 }
    ],
    cache: { enabled: true, ttl: 60 },
    circuitBreaker: { enabled: true }
  });

  server.listen({ port: 3000 }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Enhanced NeuralShell server running on port 3000');
  });
}

export { RouterCore };
