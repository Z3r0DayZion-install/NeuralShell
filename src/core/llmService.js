class LLMService {
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.baseUrl = String(options.baseUrl || "http://127.0.0.1:11434");
    this.maxRetries = Number.isFinite(Number(options.maxRetries)) ? Number(options.maxRetries) : 2;
    this.retryBaseDelayMs = Number.isFinite(Number(options.retryBaseDelayMs)) ? Number(options.retryBaseDelayMs) : 250;
    this.requestTimeoutMs = Number.isFinite(Number(options.requestTimeoutMs)) ? Number(options.requestTimeoutMs) : 15000;
    this.model = "llama3";
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
    return {
      ok: true,
      persona: String(personaId || "balanced")
    };
  }

  autoDetectLocalLLM() {
    return {
      ok: true,
      detected: true,
      baseUrl: this.baseUrl
    };
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
      return { ok: true, baseUrl: this.baseUrl };
    } catch (err) {
      const reason = err && err.message ? err.message : "unknown error";
      this._lastHealth = { ok: false, reason };
      return { ok: false, baseUrl: this.baseUrl, reason };
    }
  }

  async chat(messages, streamMode = false) {
    if (!Array.isArray(messages)) {
      throw new Error("messages must be an array.");
    }

    const controller = new AbortController();
    this._activeController = controller;
    this._emitStatus("busy");

    try {
      if (streamMode) {
        const response = await this._withRetry(async () => {
          return this._fetchJson("/api/chat", {
            method: "POST",
            body: JSON.stringify({
              model: this.model,
              stream: true,
              messages
            })
          }, controller);
        });

        async function* oneShotIterator() {
          yield response;
        }
        this._emitStatus("online");
        return oneShotIterator();
      }

      const response = await this._withRetry(async () => {
        return this._fetchJson("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            model: this.model,
            stream: false,
            messages
          })
        }, controller);
      });

      this._emitStatus("online");
      return response;
    } catch (err) {
      const aborted = controller.signal.aborted;
      if (aborted || /aborted/i.test(String(err && err.message))) {
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

  async _fetchJson(endpoint, init = {}, controller) {
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
      return response.json();
    } catch (err) {
      if (signalController.signal.aborted) {
        throw new Error("timed out");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

const defaultService = new LLMService();

module.exports = defaultService;
module.exports.LLMService = LLMService;
