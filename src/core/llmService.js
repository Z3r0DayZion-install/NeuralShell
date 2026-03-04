const { TextDecoder } = require("util");

const PERSONA_PROMPTS = {
  balanced: "You are NeuralShell assistant: practical, concise, and accurate.",
  engineer: "You are NeuralShell engineer mode: prioritize implementation details, constraints, and debugging precision.",
  founder: "You are NeuralShell founder mode: focus on outcomes, tradeoffs, and fast execution.",
  analyst: "You are NeuralShell analyst mode: reason in clear steps and validate assumptions explicitly.",
  creative: "You are NeuralShell creative mode: produce novel options while remaining grounded in constraints."
};

const VALID_PERSONAS = new Set(Object.keys(PERSONA_PROMPTS));

class LLMService {
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.baseUrl = String(options.baseUrl || "http://127.0.0.1:11434");
    this.maxRetries = Number.isFinite(Number(options.maxRetries)) ? Number(options.maxRetries) : 2;
    this.retryBaseDelayMs = Number.isFinite(Number(options.retryBaseDelayMs)) ? Number(options.retryBaseDelayMs) : 250;
    this.requestTimeoutMs = Number.isFinite(Number(options.requestTimeoutMs)) ? Number(options.requestTimeoutMs) : 15000;
    this.model = "llama3";
    this.persona = "balanced";
    this._listeners = new Set();
    this._activeController = null;
    this._lastHealth = { ok: false, reason: "not_checked" };
  }

  configure(options = {}) {
    if (options.baseUrl) {
      this.baseUrl = String(options.baseUrl);
    }
    if (options.maxRetries != null) {
      this.maxRetries = Number(options.maxRetries);
    }
    if (options.requestTimeoutMs != null) {
      this.requestTimeoutMs = Number(options.requestTimeoutMs);
    }
    if (options.retryBaseDelayMs != null) {
      this.retryBaseDelayMs = Number(options.retryBaseDelayMs);
    }
    if (options.persona != null) {
      this.setPersona(options.persona);
    }
  }

  setModel(model) {
    const normalized = String(model || "").trim();
    if (!normalized) {
      throw new Error("Model is required.");
    }
    this.model = normalized;
    return this.model;
  }

  setPersona(personaId) {
    const normalized = String(personaId || "balanced").trim().toLowerCase();
    if (!VALID_PERSONAS.has(normalized)) {
      throw new Error(`Unsupported persona: ${normalized}`);
    }
    this.persona = normalized;
    return {
      ok: true,
      persona: this.persona
    };
  }

  async autoDetectLocalLLM() {
    const started = Date.now();
    try {
      const version = await this._fetchJson("/api/version", { method: "GET" });
      const models = await this.getModelList().catch(() => []);
      return {
        ok: true,
        detected: true,
        baseUrl: this.baseUrl,
        latencyMs: Date.now() - started,
        version,
        modelCount: models.length,
        models: models.slice(0, 20)
      };
    } catch (err) {
      return {
        ok: false,
        detected: false,
        baseUrl: this.baseUrl,
        latencyMs: Date.now() - started,
        reason: err && err.message ? err.message : "detection_failed"
      };
    }
  }

  onStatusChange(fn) {
    if (typeof fn === "function") {
      this._listeners.add(fn);
    }
    return () => this._listeners.delete(fn);
  }

  _emitStatus(status) {
    for (const listener of this._listeners) {
      try {
        listener(status);
      } catch {
        // Listener errors should not break service flow.
      }
    }
  }

  async getModelList() {
    const result = await this._withRetry(async () => {
      const response = await this._fetchJson("/api/tags", {
        method: "GET"
      });
      const models = Array.isArray(response.models) ? response.models : [];
      return models
        .map((entry) => (entry && typeof entry.name === "string" ? entry.name : ""))
        .filter(Boolean);
    });
    this._lastHealth = { ok: true };
    this._emitStatus("online");
    return result;
  }

  async getHealth() {
    try {
      await this.getModelList();
      return { ok: true, baseUrl: this.baseUrl, model: this.model, persona: this.persona };
    } catch (err) {
      const reason = err && err.message ? err.message : "unknown error";
      this._lastHealth = { ok: false, reason };
      return { ok: false, baseUrl: this.baseUrl, model: this.model, persona: this.persona, reason };
    }
  }

  _applyPersona(messages) {
    const normalized = messages.map((entry) => ({
      role: String(entry.role || ""),
      content: String(entry.content || "")
    }));
    const hasSystem = normalized.some((entry) => entry.role === "system");
    if (hasSystem) {
      return normalized;
    }
    return [
      {
        role: "system",
        content: PERSONA_PROMPTS[this.persona] || PERSONA_PROMPTS.balanced
      },
      ...normalized
    ];
  }

  async chat(messages, streamMode = false) {
    if (!Array.isArray(messages)) {
      throw new Error("messages must be an array.");
    }

    const payloadMessages = this._applyPersona(messages);
    const controller = new AbortController();
    this._activeController = controller;
    this._emitStatus("busy");

    try {
      if (streamMode) {
        const response = await this._withRetry(async () => {
          return this._fetchResponse("/api/chat", {
            method: "POST",
            body: JSON.stringify({
              model: this.model,
              stream: true,
              messages: payloadMessages
            })
          }, controller);
        });

        this._emitStatus("online");
        return this._streamJsonLines(response);
      }

      const response = await this._withRetry(async () => {
        return this._fetchJson("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            model: this.model,
            stream: false,
            messages: payloadMessages
          })
        }, controller);
      });

      this._emitStatus("online");
      return response;
    } catch (err) {
      const cancelledByUser = controller.__cancelledByUser === true;
      if (cancelledByUser || /aborted|cancelled/i.test(String(err && err.message))) {
        this._emitStatus("cancelled");
        throw new Error("cancelled");
      }
      this._emitStatus("error");
      throw err;
    } finally {
      if (this._activeController === controller) {
        this._activeController = null;
      }
    }
  }

  cancelStream() {
    if (this._activeController) {
      this._activeController.__cancelledByUser = true;
      this._activeController.abort();
      this._emitStatus("cancelled");
      return true;
    }
    return false;
  }

  async _withRetry(task) {
    let lastError = null;
    const attempts = Math.max(0, this.maxRetries) + 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await task();
      } catch (err) {
        lastError = err;
        if (attempt >= attempts - 1) {
          break;
        }
        this._emitStatus("reconnecting");
        await this._sleep(this.retryBaseDelayMs * (attempt + 1));
      }
    }

    throw lastError || new Error("request failed");
  }

  _sleep(ms) {
    const delay = Number.isFinite(Number(ms)) ? Number(ms) : 0;
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
  }

  async _fetchResponse(endpoint, init = {}, controller) {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("No fetch implementation available.");
    }

    const signalController = controller || new AbortController();
    const timeoutMs = Number.isFinite(this.requestTimeoutMs) ? this.requestTimeoutMs : 15000;
    const timer = setTimeout(() => {
      signalController.abort();
    }, timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${endpoint}`, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init.headers || {})
        },
        signal: signalController.signal
      });

      if (!response || typeof response.ok !== "boolean") {
        throw new Error("failed to fetch");
      }
      if (!response.ok) {
        throw new Error(`request failed with status ${response.status}`);
      }
      return response;
    } catch (err) {
      if (signalController.signal.aborted) {
        if (signalController.__cancelledByUser) {
          throw new Error("aborted");
        }
        throw new Error("timed out");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async _fetchJson(endpoint, init = {}, controller) {
    const response = await this._fetchResponse(endpoint, init, controller);
    if (!response || typeof response.json !== "function") {
      throw new Error("invalid JSON response");
    }
    return response.json();
  }

  _toUint8Array(chunk) {
    if (chunk == null) return new Uint8Array();
    if (chunk instanceof Uint8Array) return chunk;
    if (Buffer.isBuffer(chunk)) return new Uint8Array(chunk);
    if (typeof chunk === "string") return new Uint8Array(Buffer.from(chunk, "utf8"));
    return new Uint8Array(chunk);
  }

  async *_iterateBodyChunks(body) {
    if (!body) return;
    if (typeof body[Symbol.asyncIterator] === "function") {
      for await (const chunk of body) {
        yield chunk;
      }
      return;
    }
    if (typeof body.getReader === "function") {
      const reader = body.getReader();
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        yield next.value;
      }
      return;
    }
    throw new Error("response stream is not readable");
  }

  async *_streamJsonLines(response) {
    const decoder = new TextDecoder("utf8");
    let buffer = "";

    for await (const chunk of this._iterateBodyChunks(response.body)) {
      buffer += decoder.decode(this._toUint8Array(chunk), { stream: true });
      let lineBreak = buffer.indexOf("\n");
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak).trim();
        buffer = buffer.slice(lineBreak + 1);
        if (line.length > 0) {
          try {
            yield JSON.parse(line);
          } catch {
            // Ignore malformed stream chunks and continue.
          }
        }
        lineBreak = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();
    const tail = buffer.trim();
    if (tail.length > 0) {
      try {
        yield JSON.parse(tail);
      } catch {
        // Ignore malformed tail.
      }
    }
  }
}

const defaultService = new LLMService();

module.exports = defaultService;
module.exports.LLMService = LLMService;
