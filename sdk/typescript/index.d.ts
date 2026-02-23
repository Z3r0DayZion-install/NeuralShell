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
export declare class NeuralShellError extends Error {
    code: string;
    requestId?: string;
    constructor(message: string, code: string, requestId?: string);
}
export declare class NeuralShellClient {
    private baseUrl;
    private adminToken?;
    private promptToken?;
    private defaultHeaders;
    constructor(options: NeuralShellOptions);
    private request;
    health(): Promise<HealthResponse>;
    ready(): Promise<Config>;
    metrics(): Promise<Metrics>;
    metricsPrometheus(): Promise<string>;
    version(): Promise<{
        version: string;
        startTime: string;
    }>;
    errorCatalog(): Promise<{
        errors: string[];
    }>;
    endpoints(): Promise<{
        endpoints: EndpointStatus[];
    }>;
    config(): Promise<Config>;
    prompt(request: PromptRequest, options?: {
        idempotencyKey?: string;
        dryRun?: boolean;
    }): Promise<PromptResponse>;
    streamPrompt(request: PromptRequest, options?: {
        idempotencyKey?: string;
    }): AsyncGenerator<string>;
    resetMetrics(): Promise<void>;
    resetEndpoints(): Promise<void>;
    reloadEndpoints(endpoints: Array<{
        name: string;
        url: string;
        model: string;
    }>): Promise<void>;
    runtimeSnapshot(): Promise<object>;
    idempotencyStats(): Promise<object>;
    rateLimitStats(): Promise<object>;
    resetIdempotency(): Promise<void>;
    resetRateLimits(): Promise<void>;
}
export declare function createClient(options: NeuralShellOptions): NeuralShellClient;
//# sourceMappingURL=index.d.ts.map