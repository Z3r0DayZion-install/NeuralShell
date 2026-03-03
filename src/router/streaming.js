import crypto from 'crypto';

function createSSEParser() {
  let buffer = '';
  let eventType = 'message';
  let data = '';

  return {
    parse(line) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += `${line.slice(5).trim() }\n`;
      } else if (line === '') {
        const result = {
          type: eventType,
          data: data.trim(),
          raw: buffer
        };
        data = '';
        eventType = 'message';
        buffer = '';
        return result;
      }
      buffer += `${line }\n`;
      return null;
    },

    reset() {
      buffer = '';
      eventType = 'message';
      data = '';
    }
  };
}

function formatSSEMessage(data, event = 'message', id = null) {
  let message = '';
  if (id !== null) {
    message += `id: ${id}\n`;
  }
  message += `event: ${event}\n`;
  message += `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n`;
  message += '\n';
  return message;
}

function parseSSELine(line) {
  if (!line || line.startsWith(':')) {
    return null;
  }

  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return { key: line, value: '' };
  }

  const key = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1).trim();
  return { key, value };
}

class StreamManager {
  constructor(options = {}) {
    this.streams = new Map();
    this.maxStreams = options.maxStreams || 100;
    this.streamTimeoutMs = options.streamTimeoutMs || 300000;
    this.onData = options.onData || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});
  }

  createStream(requestId, options = {}) {
    if (this.streams.size >= this.maxStreams) {
      throw new Error('Maximum streams limit reached');
    }

    const streamId = options.id || crypto.randomUUID();
    const startTime = Date.now();

    const stream = {
      id: streamId,
      requestId,
      createdAt: startTime,
      lastActivityAt: startTime,
      bytesSent: 0,
      messagesSent: 0,
      aborted: false,
      timeout: null,
      parsers: new Map()
    };

    if (this.streamTimeoutMs > 0) {
      stream.timeout = setTimeout(() => {
        this.abortStream(streamId, 'timeout');
      }, this.streamTimeoutMs);
    }

    this.streams.set(streamId, stream);
    return stream;
  }

  sendChunk(streamId, data, event = 'message') {
    const stream = this.streams.get(streamId);
    if (!stream || stream.aborted) {
      return false;
    }

    const message = formatSSEMessage(data, event);
    stream.bytesSent += Buffer.byteLength(message, 'utf8');
    stream.messagesSent++;
    stream.lastActivityAt = Date.now();

    this.onData(streamId, message, stream);

    return true;
  }

  sendDone(streamId, finalData = {}) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return false;
    }

    this.sendChunk(streamId, { ...finalData, done: true }, 'done');
    this.cleanupStream(streamId);

    return true;
  }

  abortStream(streamId, reason = 'aborted') {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.aborted = true;
    this.onError(streamId, reason, stream);

    this.cleanupStream(streamId);
    return true;
  }

  cleanupStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return;
    }

    if (stream.timeout) {
      clearTimeout(stream.timeout);
    }

    // Clear parsers Map
    if (stream.parsers) {
      stream.parsers.clear();
    }

    this.onEnd(streamId, stream);
    this.streams.delete(streamId);
  }

  getStream(streamId) {
    return this.streams.get(streamId);
  }

  getAllStreams() {
    return Array.from(this.streams.values()).map(s => ({
      id: s.id,
      requestId: s.requestId,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      bytesSent: s.bytesSent,
      messagesSent: s.messagesSent,
      aborted: s.aborted,
      ageMs: Date.now() - s.createdAt
    }));
  }

  abortAll(reason = 'shutdown') {
    for (const streamId of this.streams.keys()) {
      this.abortStream(streamId, reason);
    }
  }

  cleanupOldStreams(maxAgeMs = 600000) {
    const now = Date.now();
    const toRemove = [];

    for (const [id, stream] of this.streams) {
      if (now - stream.lastActivityAt > maxAgeMs) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.abortStream(id, 'ageout');
    }

    return toRemove.length;
  }

  getStats() {
    let totalAge = 0;
    let activeCount = 0;
    let abortedCount = 0;
    let totalBytes = 0;
    let totalMessages = 0;

    for (const stream of this.streams.values()) {
      totalAge += Date.now() - stream.createdAt;
      totalBytes += stream.bytesSent;
      totalMessages += stream.messagesSent;
      if (stream.aborted) {
        abortedCount++;
      } else {
        activeCount++;
      }
    }

    const streamCount = this.streams.size;

    return {
      totalStreams: streamCount,
      activeStreams: activeCount,
      abortedStreams: abortedCount,
      maxStreams: this.maxStreams,
      totalBytesSent: totalBytes,
      totalMessagesSent: totalMessages,
      avgAgeMs: streamCount > 0 ? Math.round(totalAge / streamCount) : 0
    };
  }

  destroy() {
    this.abortAll('destroyed');
  }
}

// Convert parseStreamPayload to generator for memory efficiency
function* parseStreamPayload(body) {
  const lines = body.split('\n');
  const parser = createSSEParser();

  for (const line of lines) {
    const event = parser.parse(line);
    if (event) {
      yield event;
    }
  }
}

function isEventStreamRequest(headers) {
  const accept = headers.accept || '';
  const contentType = headers['content-type'] || '';
  return (
    accept.includes('text/event-stream') ||
    contentType.includes('text/event-stream')
  );
}

export {
  StreamManager,
  createSSEParser,
  formatSSEMessage,
  parseSSELine,
  parseStreamPayload,
  isEventStreamRequest
};
