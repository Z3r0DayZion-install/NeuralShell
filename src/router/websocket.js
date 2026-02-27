import WebSocket from 'ws';
import crypto from 'crypto';
import { sanitizeForLogging } from './security-utils.js';

class WebSocketPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 100;
    this.connectionTimeout = options.connectionTimeout || 30000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      closed: 0
    };
  }

  createServer(port, options = {}) {
    this.server = new WebSocket.Server({ port, ...options });

    this.server.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.server.on('error', (err) => {
      console.error('WebSocket server error:', err.message);
      this.stats.errors++;
    });

    return this.server;
  }

  handleConnection(ws, req) {
    const id = crypto.randomUUID();
    const clientIp = req.socket.remoteAddress;
    const url = req.url;

    if (this.connections.size >= this.maxConnections) {
      ws.close(1008, 'Server full');
      return;
    }

    const connection = {
      id,
      ws,
      clientIp,
      url,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      authenticated: false,
      tenantId: null,
      metadata: {}
    };

    this.connections.set(id, connection);
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    ws.on('message', (data) => {
      this.handleMessage(id, data);
    });

    ws.on('close', (code, reason) => {
      this.handleClose(id, code, reason);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket ${id} error:`, err.message);
      this.stats.errors++;
    });

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      connection.lastActivity = Date.now();
    });

    this.send(id, { type: 'connected', id, welcome: 'NeuralShell WebSocket' });

    return id;
  }

  handleMessage(id, data) {
    const connection = this.connections.get(id);
    if (!connection) {
      return;
    }

    connection.lastActivity = Date.now();
    this.stats.messagesReceived++;

    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (err) {
      // Send error response for invalid JSON
      this.send(id, {
        type: 'error',
        code: 'INVALID_JSON',
        message: 'Invalid JSON',
        error: err.message
      });
      return;
    }

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        // Catch handler errors and send error responses
        handler(connection, message);
      } catch (err) {
        console.error('Message handler error:', sanitizeForLogging({
          error: err.message,
          messageType: message.type
        }));
        this.send(id, {
          type: 'error',
          code: 'HANDLER_ERROR',
          message: 'Error processing message',
          messageType: message.type
        });
      }
    } else {
      this.send(id, { type: 'error', code: 'UNKNOWN_MESSAGE_TYPE', received: message.type });
    }
  }

  handleClose(id, _code, _reason) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
      this.stats.activeConnections--;
      this.stats.closed++;
    }
  }

  send(id, message) {
    const connection = this.connections.get(id);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      connection.ws.send(data);
      connection.messagesSent++;
      this.stats.messagesSent++;
      return true;
    } catch (err) {
      console.error('WebSocket send error:', err.message);
      this.stats.errors++;
      return false;
    }
  }

  broadcast(message, filter = null) {
    let count = 0;
    for (const [id, connection] of this.connections) {
      if (filter && !filter(connection)) {
        continue;
      }
      if (this.send(id, message)) {
        count++;
      }
    }
    return count;
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  getConnection(id) {
    return this.connections.get(id);
  }

  getAllConnections() {
    return Array.from(this.connections.values()).map(c => ({
      id: c.id,
      clientIp: c.clientIp,
      url: c.url,
      createdAt: c.createdAt,
      lastActivity: c.lastActivity,
      authenticated: c.authenticated,
      tenantId: c.tenantId,
      messagesSent: c.messagesSent,
      messagesReceived: c.messagesReceived
    }));
  }

  close(id, code = 1000, reason = 'Goodbye') {
    const connection = this.connections.get(id);
    if (connection) {
      connection.ws.close(code, reason);
    }
  }

  closeAll(code = 1000, reason = 'Server shutdown') {
    for (const connection of this.connections.values()) {
      connection.ws.close(code, reason);
    }
  }

  startHeartbeat() {
    this.heartbeat = setInterval(() => {
      for (const [id, connection] of this.connections) {
        if (!connection.ws.isAlive) {
          this.close(id, 1001, 'Heartbeat timeout');
          continue;
        }
        connection.ws.isAlive = false;
        connection.ws.ping();
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
  }

  getStats() {
    return {
      ...this.stats,
      activeConnections: this.connections.size,
      maxConnections: this.maxConnections
    };
  }

  async destroy() {
    // Stop heartbeat interval
    this.stopHeartbeat();

    // Close all connections
    this.closeAll(1001, 'Server shutting down');

    // Wait briefly for connections to close gracefully
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear all data structures
    this.connections.clear();
    this.messageHandlers.clear();

    // Close WebSocket server if it exists
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }
}

class WebSocketUpstream {
  constructor(options = {}) {
    this.url = options.url;
    this.protocols = options.protocols || [];
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.autoReconnect = options.autoReconnect !== false;
    this.messageQueue = [];
    this.handlers = {
      open: [],
      close: [],
      error: [],
      message: []
    };
    this.connected = false;
    this.lastMessageAt = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.protocols, {
          headers: this.headers,
          handshakeTimeout: this.timeout
        });

        const timeout = setTimeout(() => {
          this.ws.close();
          reject(new Error('Connection timeout'));
        }, this.timeout);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.flushQueue();
          this.handlers.open.forEach(h => h());
          resolve();
        });

        this.ws.on('close', (code, reason) => {
          this.connected = false;
          this.handlers.close.forEach(h => h(code, reason.toString()));

          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          }
        });

        this.ws.on('error', (err) => {
          clearTimeout(timeout);
          this.handlers.error.forEach(h => h(err));
          reject(err);
        });

        this.ws.on('message', (data) => {
          this.lastMessageAt = Date.now();
          let message;
          try {
            message = JSON.parse(data.toString());
          } catch {
            message = data.toString();
          }
          this.handlers.message.forEach(h => h(message));
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  send(message) {
    if (!this.connected) {
      this.messageQueue.push(message);
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(data);
      return true;
    } catch (err) {
      console.error('WebSocket upstream send error:', err.message);
      return false;
    }
  }

  flushQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  close(code = 1000, reason = 'Client disconnect') {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
  }

  removeHandler(event, handler) {
    if (this.handlers[event]) {
      const index = this.handlers[event].indexOf(handler);
      if (index > -1) {
        this.handlers[event].splice(index, 1);
      }
    }
  }

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  getLatency() {
    if (!this.lastMessageAt) {
      return null;
    }
    return Date.now() - this.lastMessageAt;
  }
}

class WebSocketRouter {
  constructor(options = {}) {
    this.wsPool = new WebSocketPool(options);
    this.upstreams = new Map();
    this.routeTable = new Map();
    this.defaultUpstream = null;
  }

  createUpstream(name, options) {
    const upstream = new WebSocketUpstream(options);
    this.upstreams.set(name, upstream);
    return upstream;
  }

  addRoute(pattern, upstreamName) {
    this.routeTable.set(pattern, upstreamName);
  }

  setDefault(upstreamName) {
    this.defaultUpstream = upstreamName;
  }

  getUpstream(message) {
    for (const [pattern, upstreamName] of this.routeTable) {
      if (this.matchPattern(pattern, message)) {
        return this.upstreams.get(upstreamName);
      }
    }
    return this.defaultUpstream ? this.upstreams.get(this.defaultUpstream) : null;
  }

  matchPattern(pattern, message) {
    if (typeof pattern === 'function') {
      return pattern(message);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(JSON.stringify(message));
    }
    if (typeof pattern === 'string') {
      return message.type === pattern;
    }
    return false;
  }

  createServer(port) {
    this.wsPool.onMessage('prompt', async (connection, message) => {
      const upstream = this.getUpstream(message);
      if (!upstream) {
        this.wsPool.send(connection.id, {
          type: 'error',
          code: 'NO_UPSTREAM',
          message: 'No upstream available'
        });
        return;
      }

      try {
        if (!upstream.isConnected()) {
          await upstream.connect();
        }

        upstream.send({
          ...message,
          _sourceWsId: connection.id,
          _tenantId: connection.tenantId
        });

        upstream.on('message', (response) => {
          if (response._targetWsId === connection.id) {
            this.wsPool.send(connection.id, response);
          }
        });

      } catch (err) {
        this.wsPool.send(connection.id, {
          type: 'error',
          code: 'UPSTREAM_ERROR',
          message: err.message
        });
      }
    });

    return this.wsPool.createServer(port);
  }

  getStats() {
    return {
      pool: this.wsPool.getStats(),
      upstreams: Object.fromEntries(
        Array.from(this.upstreams.entries()).map(([name, up]) => [
          name,
          {
            connected: up.isConnected(),
            reconnectAttempts: up.reconnectAttempts,
            latency: up.getLatency()
          }
        ])
      )
    };
  }
}

export { WebSocketPool, WebSocketUpstream, WebSocketRouter };
