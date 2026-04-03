const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const { getDaemonJwtSecret, runProofBundle, runGitSha } = require("../core/daemonBridgeRuntime");

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const safe = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = safe.length % 4 === 0 ? "" : "=".repeat(4 - (safe.length % 4));
  return Buffer.from(`${safe}${pad}`, "base64").toString("utf8");
}

function signJwt(payload, secret, ttlSeconds = 120) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + Math.max(30, Number(ttlSeconds) || 120)
  };
  const headerSeg = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadSeg = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${headerSeg}.${payloadSeg}`;
  const sig = crypto
    .createHmac("sha256", String(secret || ""))
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signingInput}.${sig}`;
}

function verifyJwt(token, secret) {
  const safe = String(token || "").trim();
  if (!safe) return { ok: false, reason: "missing_token" };
  const parts = safe.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid_jwt_format" };
  const [headerSeg, payloadSeg, sig] = parts;
  const signingInput = `${headerSeg}.${payloadSeg}`;
  const expectedSig = crypto
    .createHmac("sha256", String(secret || ""))
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { ok: false, reason: "signature_mismatch" };
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSeg));
  } catch {
    return { ok: false, reason: "payload_parse_failed" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp || 0) < now) {
    return { ok: false, reason: "token_expired" };
  }
  return {
    ok: true,
    payload
  };
}

function parseCommandMessage(rawMessage) {
  if (typeof rawMessage !== "string") return { action: "" };
  try {
    const parsed = JSON.parse(rawMessage);
    if (!parsed || typeof parsed !== "object") return { action: "" };
    return parsed;
  } catch {
    return { action: "" };
  }
}

class DaemonWsBridge {
  constructor(options = {}) {
    this.host = String(options.host || "127.0.0.1");
    this.port = Number(options.port || 55015);
    this.secret = getDaemonJwtSecret(options.secret);
    this.logger = typeof options.logger === "function" ? options.logger : () => {};
    this.wss = null;
    this._activeProofRuns = new Set();
  }

  issueToken(payload = {}) {
    const safePayload = {
      aud: "neuralshell-ws-bridge",
      scope: "proof:run",
      ...payload
    };
    return signJwt(safePayload, this.secret, 180);
  }

  status() {
    return {
      running: Boolean(this.wss),
      host: this.host,
      port: this.port,
      activeProofRuns: this._activeProofRuns.size
    };
  }

  start() {
    if (this.wss) return this.status();
    this.wss = new WebSocketServer({
      host: this.host,
      port: this.port
    });
    this.wss.on("connection", (socket, request) => {
      const wsUrl = new URL(request.url || "/", `ws://${this.host}:${this.port}`);
      const token = String(wsUrl.searchParams.get("token") || "");
      const auth = verifyJwt(token, this.secret);
      if (!auth.ok) {
        socket.send(JSON.stringify({ action: "error", reason: `auth_failed:${auth.reason}` }));
        socket.close(1008, "auth_failed");
        return;
      }

      socket.send(JSON.stringify({
        action: "welcome",
        host: this.host,
        port: this.port,
        scope: String(auth.payload && auth.payload.scope || "")
      }));

      socket.on("message", async (raw) => {
        const command = parseCommandMessage(String(raw || ""));
        if (command.action === "ping") {
          socket.send(JSON.stringify({ action: "pong", ts: new Date().toISOString() }));
          return;
        }

        if (command.action === "proof.run") {
          const workspacePath = String(command.workspacePath || "").trim() || process.cwd();
          const selection = String(command.selection || "").trim();
          const filePath = String(command.filePath || "").trim();
          this._activeProofRuns.add(socket);
          socket.send(JSON.stringify({
            action: "proof.status",
            state: "running",
            workspacePath,
            filePath,
            selectionLength: selection.length
          }));
          try {
            const [result, sha] = await Promise.all([
              runProofBundle(workspacePath, (payload) => {
                if (socket.readyState === socket.OPEN) {
                  socket.send(JSON.stringify(payload));
                }
              }),
              runGitSha(workspacePath)
            ]);
            socket.send(JSON.stringify({
              action: "proof.complete",
              ok: Boolean(result.ok),
              mark: result.ok ? "✅" : "❌",
              sha: String(sha || ""),
              exitCode: Number(result.exitCode || 0),
              durationMs: Number(result.durationMs || 0)
            }));
          } catch (err) {
            socket.send(JSON.stringify({
              action: "proof.complete",
              ok: false,
              mark: "❌",
              sha: "",
              exitCode: 1,
              reason: err && err.message ? err.message : String(err)
            }));
          } finally {
            this._activeProofRuns.delete(socket);
          }
          return;
        }

        socket.send(JSON.stringify({
          action: "error",
          reason: `unknown_action:${String(command.action || "")}`
        }));
      });
    });
    this.logger("daemon_ws_bridge_started", {
      host: this.host,
      port: this.port
    });
    return this.status();
  }

  stop() {
    if (!this.wss) return;
    try {
      this.wss.close();
    } finally {
      this.wss = null;
      this._activeProofRuns.clear();
    }
    this.logger("daemon_ws_bridge_stopped", {
      host: this.host,
      port: this.port
    });
  }
}

module.exports = {
  DaemonWsBridge,
  signJwt,
  verifyJwt
};
