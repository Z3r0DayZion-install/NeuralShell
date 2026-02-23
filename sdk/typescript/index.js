"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralShellClient = exports.NeuralShellError = void 0;
exports.createClient = createClient;
class NeuralShellError extends Error {
    constructor(message, code, requestId) {
        super(message);
        this.name = 'NeuralShellError';
        this.code = code;
        this.requestId = requestId;
    }
}
exports.NeuralShellError = NeuralShellError;
class NeuralShellClient {
    constructor(options) {
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
    async request(method, path, body, headers = {}) {
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
            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            }
            else {
                data = await response.text();
            }
            if (!response.ok) {
                const errorData = data;
                throw new NeuralShellError(errorData.message || `HTTP ${response.status}`, errorData.code || 'UNKNOWN', errorData.requestId);
            }
            return data;
        }
        catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    }
    async health() {
        return this.request('GET', '/health');
    }
    async ready() {
        return this.request('GET', '/ready');
    }
    async metrics() {
        return this.request('GET', '/metrics/json');
    }
    async metricsPrometheus() {
        return this.request('GET', '/metrics/prometheus');
    }
    async version() {
        return this.request('GET', '/version');
    }
    async errorCatalog() {
        return this.request('GET', '/errors/catalog');
    }
    async endpoints() {
        return this.request('GET', '/endpoints');
    }
    async config() {
        return this.request('GET', '/config');
    }
    async prompt(request, options = {}) {
        const headers = {};
        if (options.idempotencyKey) {
            headers['x-idempotency-key'] = options.idempotencyKey;
        }
        if (options.dryRun) {
            headers['x-dry-run'] = '1';
        }
        return this.request('POST', '/prompt', request, headers);
    }
    async *streamPrompt(request, options = {}) {
        const headers = {
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
            const error = await response.json();
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
            if (done)
                break;
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
    async resetMetrics() {
        await this.request('POST', '/metrics/reset');
    }
    async resetEndpoints() {
        await this.request('POST', '/endpoints/reset');
    }
    async reloadEndpoints(endpoints) {
        await this.request('POST', '/endpoints/reload', { endpoints });
    }
    async runtimeSnapshot() {
        return this.request('GET', '/admin/runtime/snapshot');
    }
    async idempotencyStats() {
        return this.request('GET', '/admin/idempotency/stats');
    }
    async rateLimitStats() {
        return this.request('GET', '/admin/rate-limit/stats');
    }
    async resetIdempotency() {
        await this.request('POST', '/admin/idempotency/reset');
    }
    async resetRateLimits() {
        await this.request('POST', '/admin/rate-limit/reset');
    }
}
exports.NeuralShellClient = NeuralShellClient;
function createClient(options) {
    return new NeuralShellClient(options);
}
//# sourceMappingURL=index.js.map
