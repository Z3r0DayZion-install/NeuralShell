import { RouterCore } from '../src/router/routerCore.js';
import { StreamManager } from '../src/router/streaming.js';

export function buildStreamingServer(options = {}) {
  const app = options.fastify || null;
  const routerCore = options.router || new RouterCore(options);
  const streamManager = new StreamManager({
    maxStreams: options.maxStreams || 100,
    streamTimeoutMs: options.streamTimeoutMs || 300000
  });

  async function handleStream(request, reply) {
    const { messages, model, temperature, max_tokens } = request.body || {};

    if (!messages || !Array.isArray(messages)) {
      reply.status(400);
      return { error: 'INVALID_PAYLOAD', message: 'messages array required' };
    }

    const requestId = `chatcmpl-${Date.now()}`;
    const streamId = streamManager.createStream(requestId, { id: requestId }).id;

    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    reply.header('X-Request-ID', requestId);

    streamManager.sendChunk(streamId, { id: requestId, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: model || 'default', choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }] }, 'chunk');

    try {
      const endpoint = routerCore.selectEndpoint();
      if (!endpoint) {
        streamManager.sendChunk(streamId, { error: 'NO_ACTIVE_ENDPOINTS' }, 'error');
        streamManager.sendDone(streamId);
        return;
      }

      const result = await routerCore.callEndpointStreaming(
        endpoint,
        { messages, model, temperature, max_tokens },
        (chunk) => {
          const delta = {
            id: requestId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: endpoint.model,
            choices: [{
              index: 0,
              delta: { content: chunk },
              finish_reason: null
            }]
          };
          streamManager.sendChunk(streamId, delta, 'chunk');
        }
      );

      streamManager.sendChunk(streamId, {
        id: requestId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: endpoint.model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
      }, 'chunk');

      streamManager.sendDone(streamId, { usage: result.usage });

    } catch (err) {
      streamManager.sendChunk(streamId, { error: err.message || 'Stream error' }, 'error');
      streamManager.abortStream(streamId, err.message);
    }

    return reply;
  }

  function setupRoutes(fastify) {
    fastify.post('/v1/chat/completions', {
      schema: {
        body: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: { type: 'array' },
            model: { type: 'string' },
            temperature: { type: 'number' },
            max_tokens: { type: 'integer' },
            stream: { type: 'boolean', default: false }
          }
        }
      }
    }, async (request, reply) => {
      const { stream } = request.body || {};

      if (stream) {
        return handleStream(request, reply);
      }

      const result = await routerCore.executeRequest(request.body);
      return result;
    });

    fastify.get('/streams', async () => {
      return streamManager.getStats();
    });

    fastify.delete('/streams/:id', async (request, reply) => {
      const { id } = request.params;
      streamManager.abortStream(id, 'cancelled');
      return { success: true };
    });
  }

  return {
    router: routerCore,
    streamManager,
    handleStream,
    setupRoutes
  };
}

export { StreamManager };
