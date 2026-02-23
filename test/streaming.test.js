const { describe, it, expect, beforeEach } = require('@jest/globals');
const Streaming = require('../src/router/streaming');

describe('Streaming', () => {
  let streaming;

  beforeEach(() => {
    streaming = new Streaming();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(streaming.config).toBeDefined();
    });
  });

  describe('createStream', () => {
    it('should create SSE stream', () => {
      const stream = streaming.createSSEStream();
      expect(stream).toBeDefined();
    });
  });

  describe('parseSSE', () => {
    it('should parse SSE data', () => {
      const data = streaming.parseSSE('data: {"content": "hello"}');
      expect(data).toEqual({ content: 'hello' });
    });

    it('should handle empty data', () => {
      const data = streaming.parseSSE('data: ');
      expect(data).toBeNull();
    });
  });

  describe('formatSSE', () => {
    it('should format SSE message', () => {
      const sse = streaming.formatSSE({ content: 'hello' });
      expect(sse).toContain('data:');
    });
  });

  describe('streamResponse', () => {
    it('should stream response chunks', async () => {
      const chunks = [];
      const mockReadable = {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              if (i < 3) {
                return Promise.resolve({ value: { content: `chunk ${i++}` }, done: false });
              }
              return Promise.resolve({ done: true });
            }
          };
        }
      };

      for await (const chunk of streaming.streamResponse(mockReadable)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBe(3);
    });
  });

  describe('bufferChunks', () => {
    it('should buffer chunks', () => {
      const chunks = ['Hello', ' ', 'World'];
      const buffered = streaming.bufferChunks(chunks);
      expect(buffered).toBe('Hello World');
    });
  });

  describe('transform', () => {
    it('should transform stream data', async () => {
      const transformed = [];
      const mockStream = {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              if (i < 3) {
                return Promise.resolve({ value: { text: `text ${i++}` }, done: false });
              }
              return Promise.resolve({ done: true });
            }
          };
        }
      };

      for await (const chunk of streaming.transform(mockStream, d => ({ ...d, transformed: true }))) {
        transformed.push(chunk);
      }
      expect(transformed[0].transformed).toBe(true);
    });
  });
});
