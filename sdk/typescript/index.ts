export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface PromptRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  user?: string;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PromptResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  requestId: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  requestId: string;
}

export interface HealthResponse {
  ok: boolean;
  uptime: number;
  version: string;
}

export interface Metrics {
  total: number;
  success: number;
  fail: number;
  rejected: number;
  inFlight: number;
}

export interface EndpointStatus {
  name: string;
  url: string;
  model: string;
  healthy: boolean;
  inCooldown: boolean;
  failures: number;
  successes: number;
  avgLatencyMs: number;
}

export interface Config {
  server: {
    port: number;
    timeoutMs: number;
  };
  routing: {
    strategy: string;
    adaptive: boolean;
  };
  limits: {
    maxMessagesPerRequest: number;
    maxMessageChars: number;
  };
}

export interface NeuralShellOptions {
  baseUrl: string;
  adminToken?: string;
  promptToken?: string;
  requestId?: string;
  timeout?: number;
  retries?: number;
}

export class NeuralShellError extends Error {
  code: string;
  requestId?: string;

  constructor(message: string, code: string, requestId?: string) {
    super(message);
    this.name = 'NeuralShellError';
    this.code = code;
    this.requestId = requestId;
  }
}

export class NeuralShellClient {
  private baseUrl: string;
  private adminToken?: string;
  private promptToken?: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: NeuralShellOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.adminToken = options.adminToken;
    this.promptToken = options.promptToken;

    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (this.adminToken) {
      this.defaultHeaders['x-admin-token'] = this.adminToken;
    }
    if (this.promptToken) {
      this.defaultHeaders['x-prompt-token'] = this.promptToken;
    }
    if (options.requestId) {
      this.defaultHeaders['x-client-request-id'] = options.requestId;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      let data: unknown;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new NeuralShellError(
          errorData.message || `HTTP ${response.status}`,
          errorData.code || 'UNKNOWN',
          errorData.requestId
        );
      }

      return data as T;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  async ready(): Promise<Config> {
    return this.request<Config>('GET', '/ready');
  }

  async metrics(): Promise<Metrics> {
    return this.request<Metrics>('GET', '/metrics/json');
  }

  async metricsPrometheus(): Promise<string> {
    return this.request<string>('GET', '/metrics/prometheus');
  }

  async version(): Promise<{ version: string; startTime: string }> {
    return this.request('GET', '/version');
  }

  async errorCatalog(): Promise<{ errors: string[] }> {
    return this.request('GET', '/errors/catalog');
  }

  async endpoints(): Promise<{ endpoints: EndpointStatus[] }> {
    return this.request('GET', '/endpoints');
  }

  async config(): Promise<Config> {
    return this.request('GET', '/config');
  }

  async prompt(request: PromptRequest, options: {
    idempotencyKey?: string;
    dryRun?: boolean;
  } = {}): Promise<PromptResponse> {
    const headers: Record<string, string> = {};

    if (options.idempotencyKey) {
      headers['x-idempotency-key'] = options.idempotencyKey;
    }
    if (options.dryRun) {
      headers['x-dry-run'] = '1';
    }

    return this.request<PromptResponse>('POST', '/prompt', request, headers);
  }

  async *streamPrompt(
    request: PromptRequest,
    options: { idempotencyKey?: string } = {}
  ): AsyncGenerator<string> {
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
    };

    if (options.idempotencyKey) {
      headers['x-idempotency-key'] = options.idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}/prompt/stream`, {
      method: 'POST',
      headers: { ...this.defaultHeaders, ...headers },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new NeuralShellError(error.message, error.code, error.requestId);
    }

    if (!response.body) {
      throw new NeuralShellError('No response body', 'STREAM_ERROR');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          yield data;
        }
      }
    }
  }

  async resetMetrics(): Promise<void> {
    await this.request('POST', '/metrics/reset');
  }

  async resetEndpoints(): Promise<void> {
    await this.request('POST', '/endpoints/reset');
  }

  async reloadEndpoints(endpoints: Array<{
    name: string;
    url: string;
    model: string;
  }>): Promise<void> {
    await this.request('POST', '/endpoints/reload', { endpoints });
  }

  async runtimeSnapshot(): Promise<object> {
    return this.request('GET', '/admin/runtime/snapshot');
  }

  async idempotencyStats(): Promise<object> {
    return this.request('GET', '/admin/idempotency/stats');
  }

  async rateLimitStats(): Promise<object> {
    return this.request('GET', '/admin/rate-limit/stats');
  }

  async resetIdempotency(): Promise<void> {
    await this.request('POST', '/admin/idempotency/reset');
  }

  async resetRateLimits(): Promise<void> {
    await this.request('POST', '/admin/rate-limit/reset');
  }
}

export function createClient(options: NeuralShellOptions): NeuralShellClient {
  return new NeuralShellClient(options);
}
