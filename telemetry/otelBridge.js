const net = require("net");

class OTelBridge {
  constructor(options = {}) {
    this.host = String(options.host || "127.0.0.1");
    this.port = Number(options.port || 4317);
    this.enabled = Boolean(options.enabled);
    this.logger = typeof options.logger === "function" ? options.logger : () => {};
  }

  setEnabled(next) {
    this.enabled = Boolean(next);
    return this.status();
  }

  status() {
    return {
      enabled: this.enabled,
      host: this.host,
      port: this.port
    };
  }

  verifyConnection(timeoutMs = 1500) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;

      const finish = (ok, reason = "") => {
        if (done) return;
        done = true;
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve({
          ok,
          host: this.host,
          port: this.port,
          reason
        });
      };

      socket.setTimeout(timeoutMs, () => finish(false, "timeout"));
      socket.once("error", (err) => finish(false, err && err.message ? err.message : "connect_error"));
      socket.connect(this.port, this.host, () => finish(true, ""));
    });
  }

  async exportMetric(metric) {
    if (!this.enabled) {
      return { ok: false, reason: "disabled" };
    }
    const probe = await this.verifyConnection();
    if (!probe.ok) return probe;
    this.logger("metric", metric || {});
    return {
      ok: true,
      host: this.host,
      port: this.port
    };
  }
}

module.exports = {
  OTelBridge
};

