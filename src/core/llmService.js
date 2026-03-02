class LLMService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    this.currentModel = null;
    this.statusCallbacks = [];
    this.abortController = null;
    this.fetchImpl = options.fetchImpl || fetch;
    this.requestTimeoutMs = options.requestTimeoutMs || 15000;
    this.maxRetries = options.maxRetries == null ? 2 : options.maxRetries;
    this.retryBaseDelayMs = options.retryBaseDelayMs || 300;
    this._cancelRequested = false;
    this.lastHealth = {
      ok: false,
      status: "unknown",
      retries: 0,
      latencyMs: null,
      error: "Health not checked yet",
      checkedAt: null,
      baseUrl: this.baseUrl
    };
  }

  setModel(model) {
    this.currentModel = model;
    this._emitStatus("model_changed");
  }

  configure(options = {}) {
    if (options.baseUrl) {
      this.baseUrl = String(options.baseUrl);
    }
    if (Number.isFinite(options.requestTimeoutMs) && options.requestTimeoutMs > 0) {
      this.requestTimeoutMs = options.requestTimeoutMs;
    }
    if (Number.isFinite(options.maxRetries) && options.maxRetries >= 0) {
      this.maxRetries = options.maxRetries;
    }
    this._updateHealth({ status: "configured" });
  }

  onStatusChange(cb) {
    if (typeof cb === "function") {
      this.statusCallbacks.push(cb);
    }
  }

  _emitStatus(status) {
    this.statusCallbacks.forEach((cb) => {
      try {
        cb(status);
      } catch {
        // Ignore listener failures.
      }
    });
  }

  async _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _updateHealth(patch) {
    this.lastHealth = {
      ...this.lastHealth,
      ...patch,
      checkedAt: new Date().toISOString(),
      baseUrl: this.baseUrl
    };
  }

  _buildErrorMessage(err, timedOut) {
    if (this._cancelRequested) {
      return "Request cancelled.";
    }
    if (timedOut) {
      return `Request timed out after ${this.requestTimeoutMs}ms.`;
    }
    if (err && err.message) {
      return err.message;
    }
    return "Network request failed.";
  }

  async _fetchWithRetry(url, init, options = {}) {
    const retries = options.retries == null ? this.maxRetries : options.retries;
    const includeCancel = Boolean(options.includeCancel);

    let lastError = null;
    let attempt = 0;
    while (attempt <= retries) {
      let timedOut = false;
      const controller = includeCancel ? (this.abortController = new AbortController()) : new AbortController();
      this._cancelRequested = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.requestTimeoutMs);

      const startedAt = Date.now();
      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const latencyMs = Date.now() - startedAt;
          this._updateHealth({
            ok: true,
            status: "online",
            retries: attempt,
            latencyMs,
            error: null
          });
          return response;
        }

        const retryableStatus = response.status >= 500 || response.status === 429;
        const httpError = new Error(`HTTP ${response.status}`);
        httpError.status = response.status;
        lastError = httpError;

        if (!retryableStatus || attempt === retries) {
          this._updateHealth({
            ok: false,
            status: "offline",
            retries: attempt,
            latencyMs: Date.now() - startedAt,
            error: httpError.message
          });
          throw httpError;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const message = this._buildErrorMessage(err, timedOut);
        lastError = new Error(message);

        if (this._cancelRequested) {
          this._emitStatus("cancelled");
          this._updateHealth({
            ok: false,
            status: "cancelled",
            retries: attempt,
            latencyMs: null,
            error: message
          });
          throw lastError;
        }

        if (attempt === retries) {
          this._emitStatus("offline");
          this._updateHealth({
            ok: false,
            status: "offline",
            retries: attempt,
            latencyMs: null,
            error: message
          });
          throw lastError;
        }
      } finally {
        if (!includeCancel) {
          this.abortController = null;
        }
      }

      const delay = this.retryBaseDelayMs * Math.pow(2, attempt);
      this._emitStatus("retrying");
      await this._sleep(delay);
      attempt += 1;
    }

    throw lastError || new Error("Failed request.");
  }

  async getModelList() {
    try {
      const response = await this._fetchWithRetry(`${this.baseUrl}/api/tags`, {}, { retries: 1, includeCancel: false });
      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models.map((m) => m.name).filter(Boolean) : [];
      return models;
    } catch {
      return [];
    }
  }

  async getHealth() {
    try {
      const models = await this.getModelList();
      if (models.length > 0) {
        return {
          ...this.lastHealth,
          models: models.length
        };
      }
      return {
        ...this.lastHealth,
        ok: false,
        status: this.lastHealth.status === "unknown" ? "offline" : this.lastHealth.status,
        models: 0
      };
    } catch {
      return {
        ...this.lastHealth,
        ok: false,
        status: "offline",
        models: 0
      };
    }
  }

  async chat(messages, stream = false) {
    if (!this.currentModel) {
      throw new Error("Model not set");
    }

    this._emitStatus("connecting");

    const response = await this._fetchWithRetry(
      `${this.baseUrl}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.currentModel,
          messages,
          stream
        })
      },
      { retries: this.maxRetries, includeCancel: true }
    );

    this._emitStatus("connected");

    if (!stream) {
      const data = await response.json();
      this.abortController = null;
      return {
        message: { content: data && data.message ? data.message.content || "" : "" }
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const service = this;

    async function* iterator() {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message && json.message.content) {
              yield { message: { content: json.message.content } };
            }
          } catch {
            // Ignore non-JSON chunk boundaries.
          }
        }
      }

      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          if (json.message && json.message.content) {
            yield { message: { content: json.message.content } };
          }
        } catch {
          // Ignore partial trailing data.
        }
      }

      service.abortController = null;
    }

    return iterator();
  }

  cancelStream() {
    this._cancelRequested = true;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

const llmService = new LLMService();
module.exports = llmService;
module.exports.LLMService = LLMService;
