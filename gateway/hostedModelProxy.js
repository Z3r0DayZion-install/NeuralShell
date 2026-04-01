const http = require("http");
const { Readable } = require("stream");

function jsonResponse(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload)}\n`);
}

class HostedModelProxy {
  constructor(options = {}) {
    this.host = String(options.host || "127.0.0.1");
    this.port = Number(options.port || 55117);
    this.providerApiKey = String(options.providerApiKey || process.env.TOGETHER_API_KEY || "").trim();
    this.upstreamBaseUrl = String(options.upstreamBaseUrl || "https://api.together.xyz").replace(/\/+$/, "");
    this.rateCapPerMinute = Math.max(1, Number(options.rateCapPerMinute || 60));
    this.logger = typeof options.logger === "function" ? options.logger : () => {};
    this._requests = [];
    this._server = null;
  }

  baseUrl() {
    return `http://${this.host}:${this.port}`;
  }

  status() {
    return {
      running: Boolean(this._server),
      enabled: Boolean(this._server),
      host: this.host,
      port: this.port,
      baseUrl: this.baseUrl(),
      upstreamBaseUrl: this.upstreamBaseUrl,
      rateCapPerMinute: this.rateCapPerMinute,
      apiKeyPresent: Boolean(this.providerApiKey)
    };
  }

  _allowRequest() {
    const now = Date.now();
    const horizon = now - 60 * 1000;
    this._requests = this._requests.filter((ts) => ts >= horizon);
    if (this._requests.length >= this.rateCapPerMinute) {
      return false;
    }
    this._requests.push(now);
    return true;
  }

  async _proxyRequest(req, res) {
    if (!this.providerApiKey) {
      jsonResponse(res, 503, {
        ok: false,
        reason: "missing_together_api_key",
        hint: "Set TOGETHER_API_KEY to use hosted model proxy."
      });
      return;
    }
    if (!this._allowRequest()) {
      jsonResponse(res, 429, {
        ok: false,
        reason: "rate_limited",
        rateCapPerMinute: this.rateCapPerMinute
      });
      return;
    }

    const targetPath = req.url && req.url.startsWith("/") ? req.url : "/v1/models";
    const upstreamUrl = `${this.upstreamBaseUrl}${targetPath}`;
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);
    const bodyText = bodyBuffer.length > 0 ? bodyBuffer.toString("utf8") : "";

    const upstream = await fetch(upstreamUrl, {
      method: String(req.method || "GET").toUpperCase(),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.providerApiKey}`
      },
      body: req.method === "GET" ? undefined : bodyText
    });

    res.statusCode = Number(upstream.status || 502);
    upstream.headers.forEach((value, key) => {
      if (String(key || "").toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    if (!upstream.body) {
      res.end();
      return;
    }
    const stream = Readable.fromWeb(upstream.body);
    stream.on("error", () => {
      if (!res.writableEnded) {
        res.end();
      }
    });
    stream.pipe(res);
  }

  start() {
    if (this._server) return Promise.resolve(this.status());
    return new Promise((resolve, reject) => {
      this._server = http.createServer(async (req, res) => {
        try {
          const route = String(req.url || "").trim();
          if (route === "/health") {
            jsonResponse(res, 200, {
              ok: true,
              provider: "together_proxy",
              running: true,
              rateCapPerMinute: this.rateCapPerMinute,
              apiKeyPresent: Boolean(this.providerApiKey)
            });
            return;
          }
          if (route === "/v1/models" || route === "/v1/chat/completions") {
            await this._proxyRequest(req, res);
            return;
          }
          jsonResponse(res, 404, {
            ok: false,
            reason: "not_found"
          });
        } catch (err) {
          jsonResponse(res, 500, {
            ok: false,
            reason: err && err.message ? err.message : String(err)
          });
        }
      });

      this._server.once("error", (err) => {
        this._server = null;
        reject(err);
      });
      this._server.listen(this.port, this.host, () => {
        this.logger("started", this.status());
        resolve(this.status());
      });
    });
  }

  stop() {
    if (!this._server) return;
    const server = this._server;
    this._server = null;
    server.close();
    this.logger("stopped", {
      host: this.host,
      port: this.port
    });
  }
}

module.exports = {
  HostedModelProxy
};

