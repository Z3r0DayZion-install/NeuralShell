import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocketRouter } from './src/router/websocket.js';
import { RouterCore } from './src/router/routerCore.js';

export function buildWebSocketServer(options = {}) {
  const app = Fastify();
  
  app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1024 * 1024
    }
  });

  const routerCore = options.router || new RouterCore(options);
  const wsRouter = new WebSocketRouter();

  wsRouter.createUpstream('ollama', {
    url: options.ollamaUrl || 'ws://localhost:11434/ws',
    autoReconnect: true,
    maxReconnectAttempts: 5
  });

  wsRouter.createUpstream('openai', {
    url: options.openaiUrl || 'wss://api.openai.com/v1/realtime',
    autoReconnect: true,
    maxReconnectAttempts: 3
  });

  wsRouter.setDefault('ollama');

  app.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = connection.socket.protocol || 'default';
    
    connection.socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'prompt') {
          const result = await routerCore.executeRequest(message.payload);
          
          connection.socket.send(JSON.stringify({
            type: 'response',
            requestId: result.requestId,
            data: result
          }));
        }
        
        if (message.type === 'stream') {
          const stream = await routerCore.executeRequestStreaming(
            routerCore.selectEndpoint(),
            message.payload,
            (chunk) => {
              connection.socket.send(JSON.stringify({
                type: 'chunk',
                data: chunk
              }));
            }
          );
          
          connection.socket.send(JSON.stringify({
            type: 'done',
            data: stream
          }));
        }

      } catch (err) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: err.message
        }));
      }
    });

    connection.socket.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    connection.socket.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'NeuralShell WebSocket ready'
    }));
  });

  app.get('/health', async () => ({ ok: true }));

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildWebSocketServer({
    port: 3001,
    endpoints: [
      { name: 'ollama', url: 'http://localhost:11434/api/generate', model: 'llama3' },
      { name: 'openai', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4' }
    ]
  });

  server.listen({ port: 3001 }, (err) => {
    if (err) throw err;
    console.log('WebSocket server on ws://localhost:3001/ws');
  });
}
