// Response streaming support for server-sent events and large responses
export class ResponseStreamer {
  static canStream(url, headers) {
    // Check if endpoint supports streaming
    return (
      url.includes('stream') ||
      headers?.accept?.includes('text/event-stream') ||
      headers?.['x-stream']?.includes('1')
    );
  }

  static formatSSEChunk(data) {
    if (typeof data === 'string') {
      return `data: ${data}\n\n`;
    }
    return `data: ${JSON.stringify(data)}\n\n`;
  }

  static async *streamResponse(response, maxChunkSize = 4096) {
    if (!response.body) {
      yield JSON.stringify({ error: 'No response body' });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Yield complete chunks
        const lines = buffer.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          yield lines[i];
        }
        buffer = lines[lines.length - 1];
      }

      // Flush remaining buffer
      if (buffer.length > 0) {
        yield buffer;
      }
    } finally {
      reader.releaseLock();
    }
  }

  static createStreamResponse(fastifyReply, contentType = 'text/event-stream') {
    return fastifyReply
      .type(contentType)
      .header('Cache-Control', 'no-cache')
      .header('Connection', 'keep-alive')
      .header('X-Accel-Buffering', 'no');
  }

  static async sendStream(fastifyReply, asyncGenerator) {
    const stream = fastifyReply.raw;

    try {
      for await (const chunk of asyncGenerator) {
        if (!stream.write(this.formatSSEChunk(chunk))) {
          // Backpressure handling
          await new Promise((resolve) => stream.once('drain', resolve));
        }
      }
      stream.end();
    } catch (err) {
      stream.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      stream.end();
    }
  }
}
