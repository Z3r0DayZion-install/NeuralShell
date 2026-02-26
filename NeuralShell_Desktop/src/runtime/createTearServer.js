"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");
const diagnostics = require("node:diagnostics_channel");
const { validateLicenseFromDisk, resolveDefaultAppRoot } = require("../license/validator.cjs");
const { embeddedSecret } = require("../license/secret.cjs");
// pkg target node18-win-x64 embeds an older Node build (e.g. v18.5.0) where diagnostics.tracingChannel
// does not exist. Fastify v5 expects it. Polyfill to keep the TEAR runtime EXE functional.
if (typeof diagnostics.tracingChannel !== "function") {
  diagnostics.tracingChannel = function tracingChannelPolyfill(name) {
    const base = String(name || "trace");
    const start = diagnostics.channel(`${base}.start`);
    const end = diagnostics.channel(`${base}.end`);
    const asyncStart = diagnostics.channel(`${base}.asyncStart`);
    const asyncEnd = diagnostics.channel(`${base}.asyncEnd`);
    const error = diagnostics.channel(`${base}.error`);

    const ch = {
      start,
      end,
      asyncStart,
      asyncEnd,
      error,
      traceSync(fn, store, thisArg, ...args) {
        try {
          start.publish(store);
        } catch {
          // ignore
        }
        try {
          const res = fn.apply(thisArg, args);
          try {
            end.publish(store);
          } catch {
            // ignore
          }
          return res;
        } catch (err) {
          try {
            if (store && typeof store === "object") store.error = err;
            error.publish(store);
          } catch {
            // ignore
          }
          try {
            end.publish(store);
          } catch {
            // ignore
          }
          throw err;
        }
      },
      tracePromise(fn, store, thisArg, ...args) {
        let p;
        try {
          start.publish(store);
        } catch {
          // ignore
        }
        try {
          p = Promise.resolve(fn.apply(thisArg, args));
        } catch (err) {
          try {
            if (store && typeof store === "object") store.error = err;
            error.publish(store);
          } catch {
            // ignore
          }
          try {
            end.publish(store);
          } catch {
            // ignore
          }
          return Promise.reject(err);
        }
        return p.then(
          (v) => {
            try {
              end.publish(store);
            } catch {
              // ignore
            }
            return v;
          },
          (err) => {
            try {
              if (store && typeof store === "object") store.error = err;
              error.publish(store);
            } catch {
              // ignore
            }
            try {
              end.publish(store);
            } catch {
              // ignore
            }
            throw err;
          }
        );
      }
    };

    Object.defineProperty(ch, "hasSubscribers", {
      enumerable: true,
      get() {
        return Boolean(
          start.hasSubscribers ||
            end.hasSubscribers ||
            asyncStart.hasSubscribers ||
            asyncEnd.hasSubscribers ||
            error.hasSubscribers
        );
      }
    });

    return ch;
  };
}
const Fastify = require("fastify");

function registerCrashHandlersOnce() {
  if (global.__NS_CRASH_HANDLERS_REGISTERED__) return true;
  global.__NS_CRASH_HANDLERS_REGISTERED__ = true;
  try {
    process.on("uncaughtException", (err) => {
      try {
        process.stderr.write(
          `[crash] uncaughtException ${String(err && err.stack ? err.stack : err)}\n`
        );
      } catch {
        // ignore
      }
      try {
        process.exit(1);
      } catch {
        // ignore
      }
    });
    process.on("unhandledRejection", (err) => {
      try {
        process.stderr.write(
          `[crash] unhandledRejection ${String(err && err.stack ? err.stack : err)}\n`
        );
      } catch {
        // ignore
      }
      try {
        process.exit(1);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
  return true;
}
const nodeFetch = require("node-fetch");
const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");

const { AutonomousEngine } = require("../core/autoEngine");
const { PersistentMemoryStore } = require("../core/persistentMemoryStore");
const { PermissionManager } = require("../core/permissionManager");
const { Telemetry } = require("../core/telemetry");
const { CheckpointManager } = require("../core/checkpointManager");
const { createPathGuard } = require("../core/pathGuard");
const { AuthManager } = require("../core/authManager");
const { SecretVaultFs } = require("../core/secretVaultFs");
const { SyncClient } = require("../core/syncClient");
const { UpdateService } = require("../core/updateService");
const { createEnvelope, parseEnvelope } = require("../core/tearCodec");

const fsp = fs.promises;

function isProofMode() {
  return process.env.NODE_ENV === "test" || process.env.PROOF_MODE === "1";
}

function isNodeExecPath() {
  try {
    const base = path.basename(process.execPath || "").toLowerCase();
    return base === "node" || base === "node.exe";
  } catch {
    return false;
  }
}

function startProofLockJanitor({ runtimeDir, lockPath, ownerPid }) {
  if (!isProofMode()) return;
  if (!isNodeExecPath()) return; // do not attempt under pkg/EXE

  const janitorScript = path.join(__dirname, "proofLockJanitor.cjs");
  try {
    if (!fs.existsSync(janitorScript)) return;
  } catch {
    return;
  }

  try {
    const { spawn } = require("child_process");
    const child = spawn(process.execPath, [janitorScript, String(ownerPid), lockPath, runtimeDir], {
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: true
    });
    child.unref();
  } catch {
    // ignore (best-effort in proof mode only)
  }
}

function resolveRuntimeDir(input) {
  if (input) return path.resolve(String(input));
  return path.join(process.cwd(), ".tear_runtime");
}

function acquireRuntimeLockOrThrow(runtimeDir) {
  const lockPath = path.join(runtimeDir, ".neuralshell.lock");
  try {
    fs.mkdirSync(runtimeDir, { recursive: true });
  } catch {
    // ignore
  }

  let fd = null;
  try {
    fd = fs.openSync(lockPath, "wx");
    const payload = JSON.stringify(
      { pid: process.pid, startedAt: new Date().toISOString(), runtimeDir },
      null,
      2
    );
    try {
      fs.writeFileSync(fd, payload, "utf8");
    } catch {
      // ignore
    }
    startProofLockJanitor({ runtimeDir, lockPath, ownerPid: process.pid });
    return {
      lockPath,
      close() {
        try {
          if (fd !== null) fs.closeSync(fd);
        } catch {
          // ignore
        }
        try {
          fs.unlinkSync(lockPath);
        } catch {
          // ignore
        }
      }
    };
  } catch (err) {
    const code = err && typeof err === "object" ? err.code : null;
    if (code === "EEXIST") {
      try {
        process.stderr.write("INSTANCE_LOCKED\n");
      } catch {
        // ignore
      }
      throw new Error("INSTANCE_LOCKED");
    }
    throw err;
  }
}

function isLoopbackAddress(ip) {
  const s = String(ip || "").trim().toLowerCase();
  if (!s) return false;
  if (s === "127.0.0.1" || s === "::1") return true;
  if (s.startsWith("::ffff:")) {
    const v4 = s.slice("::ffff:".length);
    return v4 === "127.0.0.1";
  }
  return false;
}

function assertLocalLlmHost(raw) {
  const s = String(raw || "")
    .trim()
    .replace(/\/+$/, "");
  // Tight allowlist: only local endpoints
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(s)) {
    throw new Error("LLM host must be localhost/127.0.0.1");
  }
  return s;
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map((x) => Number(x));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a == 10) return true;
    if (a == 127) return true;
    if (a == 169 && b == 254) return true;
    if (a == 172 && b >= 16 && b <= 31) return true;
    if (a == 192 && b == 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1") return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // ULA
    if (v.startsWith("fe80")) return true; // link-local
    return false;
  }
  return true; // unknown => treat as unsafe
}

/**
 * Validate a URL (even if it came from config/env).
 * - Only http/https
 * - Blocks localhost and private network targets (direct IP or via DNS)
 * - Optionally allowlist hosts (recommended for update feeds)
 */
async function assertSafeRemoteUrl(raw, opts = {}) {
  const allowHosts = Array.isArray(opts.allowHosts)
    ? new Set(opts.allowHosts.map((h) => String(h).toLowerCase()))
    : null;

  if (typeof raw !== "string" || !raw.trim()) throw new Error("Invalid url");
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Malformed url");
  }

  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http/https allowed");

  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) throw new Error("Localhost blocked");

  if (allowHosts && !allowHosts.has(host)) throw new Error("Host not allowed");

  // If hostname is an IP literal, block private ranges
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private network target blocked");
    return u.toString();
  }

  // Resolve and block private ranges
  const addrs = await dns.lookup(host, { all: true });
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error("Private network target blocked");
  }

  return u.toString();
}

async function createTearServer(options = {}) {
  const runtimeDir = resolveRuntimeDir(options.runtimeDir || process.env.NS_RUNTIME_DIR);
  const llmHost = assertLocalLlmHost(options.llmHost || process.env.NS_LLM_HOST || "http://127.0.0.1:11434");

  const lock = acquireRuntimeLockOrThrow(runtimeDir);

  const maxWriteBytes = 2 * 1024 * 1024;
  const telemetry = new Telemetry();
  const server = Fastify({ logger: true });
  try {
    server.addHook("onClose", async () => {
      try {
        lock.close();
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
  const startedAtNs = process.hrtime.bigint();
  let requestsTotal = 0;
  let failuresTotal = 0;
  const dryRun = process.env.NS_DRY_RUN === "1" || process.env.NS_TEAR_DRY_RUN === "1";
  const proofRoutesEnabled = process.env.NODE_ENV === "test" || process.env.PROOF_MODE === "1";
  const crashHandlersRegistered = registerCrashHandlersOnce();

  const enforceLicensing = (Boolean(process.pkg) || process.env.NS_LICENSE_ENFORCE === "1") && !proofRoutesEnabled;
  const license = enforceLicensing
    ? validateLicenseFromDisk({ appRoot: resolveDefaultAppRoot(), secret: embeddedSecret })
    : { ok: true, mode: "full", status: "not-enforced", tier: null, expiresAt: null, reason: "not-enforced" };
  const licenseMode = license && license.mode === "full" ? "full" : "restricted";

  const dataDir = path.join(runtimeDir, "runtime");

  // Keep scope tight: runtime + dist only.
  const pathGuard = createPathGuard([runtimeDir, dataDir, path.join(process.cwd(), "dist")]);

  const memoryStore = new PersistentMemoryStore(path.join(dataDir, "memory"));
  const permissionManager = new PermissionManager(path.join(dataDir, "security"));
  const checkpointManager = new CheckpointManager(path.join(dataDir, "checkpoints"));
  const authManager = new AuthManager(path.join(dataDir, "auth"));
  const secretVault = new SecretVaultFs(path.join(dataDir, "vault"), process.env.NS_VAULT_KEY || "");
  const syncClient = new SyncClient();
  const updateService = new UpdateService();
  const autonomousEngine = new AutonomousEngine(() => {});

  await Promise.all([
    memoryStore.init(),
    permissionManager.init(),
    checkpointManager.init(),
    authManager.init(),
    secretVault.init()
  ]);

  function requireAdmin() {
    authManager.requireAdmin();
  }

  function requirePermission(key) {
    if (!permissionManager.allowed(key)) throw new Error(`Permission denied: ${key}`);
  }

  // ---- File path hardening ----
  function resolveUnderRuntime(userPath) {
    if (typeof userPath !== "string" || !userPath.trim()) throw new Error("Invalid path");
    const cleaned = userPath.replace(/\0/g, "").trim();

    if (path.isAbsolute(cleaned) || /^[a-zA-Z]+:/.test(cleaned)) throw new Error("Absolute path blocked");

    const normalized = path.posix.normalize(cleaned.replace(/\\/g, "/"));
    if (normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
      throw new Error("Traversal blocked");
    }

    const abs = path.resolve(runtimeDir, normalized);
    const root = runtimeDir.endsWith(path.sep) ? runtimeDir : runtimeDir + path.sep;
    if (!(abs + path.sep).startsWith(root)) throw new Error("Escapes runtime root");

    return pathGuard.assertAllowed(abs);
  }

  function assertText(input) {
    if (typeof input !== "string") throw new Error("Invalid data payload");
    if (Buffer.byteLength(input, "utf8") > maxWriteBytes) throw new Error("Payload too large");
    return input;
  }

  function wrap(route, fn) {
    return telemetry.wrap(route, fn);
  }

  // ---- Prometheus /metrics (contract parity with node runtime proof) ----
  server.addHook("onRequest", async (req, reply) => {
    try {
      if (reply && typeof reply.header === "function") reply.header("x-neuralshell-license-mode", licenseMode);
    } catch {
      // ignore
    }
    if (req.url === "/metrics") return;
    requestsTotal += 1;
  });

  server.addHook("onResponse", async (req, reply) => {
    if (req.url === "/metrics") return;
    if (reply && Number(reply.statusCode) >= 500 && !dryRun) failuresTotal += 1;
  });

  server.addHook("preHandler", async (req, reply) => {
    if (licenseMode !== "restricted") return;
    if (
      req.url === "/health" ||
      req.url === "/metrics" ||
      req.url === "/telemetry" ||
      req.url === "/license/status" ||
      req.url === "/license/require"
    )
      return;
    try {
      reply.type("application/json; charset=utf-8");
      reply.code(403);
    } catch {
      // ignore
    }
    return { ok: false, error: "license_required", mode: "restricted" };
  });

  server.get("/metrics", async (req, reply) => {
    const uptimeSeconds = Number(process.hrtime.bigint() - startedAtNs) / 1e9;
    const body =
      [
        "# HELP neuralshell_uptime_seconds Process uptime in seconds",
        "# TYPE neuralshell_uptime_seconds gauge",
        `neuralshell_uptime_seconds ${uptimeSeconds.toFixed(6)}`,
        "# HELP neuralshell_requests_total Total HTTP requests handled (excluding /metrics)",
        "# TYPE neuralshell_requests_total counter",
        `neuralshell_requests_total ${requestsTotal}`,
        "# HELP neuralshell_failures_total Total HTTP failures (status >= 500) in normal mode",
        "# TYPE neuralshell_failures_total counter",
        `neuralshell_failures_total ${failuresTotal}`
      ].join("\n") + "\n";

    reply.type("text/plain; version=0.0.4; charset=utf-8");
    reply.code(200);
    return body;
  });

  // -------- routes --------

  server.get("/health", async () => ({
    ok: true,
    runtimeDir,
    license: {
      enforced: enforceLicensing,
      mode: licenseMode,
      status: license && typeof license.status === "string" ? license.status : "unknown",
      reason: license && typeof license.reason === "string" ? license.reason : null,
      tier: license && typeof license.tier === "string" ? license.tier : null,
      expiresAt: license && typeof license.expiresAt === "string" ? license.expiresAt : null
    },
    crashHandlersRegistered
  }));
  server.get("/license/status", async () => ({
    ok: true,
    enforced: enforceLicensing,
    mode: licenseMode,
    status: license && typeof license.status === "string" ? license.status : "unknown",
    reason: license && typeof license.reason === "string" ? license.reason : null,
    tier: license && typeof license.tier === "string" ? license.tier : null,
    expiresAt: license && typeof license.expiresAt === "string" ? license.expiresAt : null
  }));
  server.get("/license/require", async (req, reply) => {
    if (licenseMode === "restricted") {
      reply.type("application/json; charset=utf-8");
      reply.code(403);
      return { ok: false, error: "license_required", mode: "restricted" };
    }
    reply.type("application/json; charset=utf-8");
    reply.code(200);
    return { ok: true, mode: "full" };
  });
  server.get("/telemetry", async () => telemetry.snapshot());

  // ---- Proof-only endpoints (localhost-only + env-gated) ----
  if (proofRoutesEnabled) {
    function assertLocal(req) {
      const remote =
        req?.socket?.remoteAddress ||
        req?.raw?.socket?.remoteAddress ||
        req?.raw?.connection?.remoteAddress ||
        "";
      if (!isLoopbackAddress(remote)) {
        const err = new Error("Forbidden: proof endpoints are localhost-only");
        err.statusCode = 403;
        throw err;
      }
    }

    server.get("/__proof/ok", async (req, reply) =>
      wrap("__proof/ok", async () => {
        assertLocal(req);
        reply.code(200);
        reply.type("application/json");
        return { ok: true, dryRun: Boolean(dryRun) };
      })()
    );

    server.get("/__proof/fail", async (req, reply) =>
      wrap("__proof/fail", async () => {
        assertLocal(req);
        reply.code(500);
        reply.type("application/json");
        return { error: "PROOF_FORCED_FAILURE", dryRun: Boolean(dryRun) };
      })()
    );

    server.post("/__proof/shutdown", async (req, reply) =>
      wrap("__proof/shutdown", async () => {
        assertLocal(req);
        reply.code(200);
        reply.type("application/json");
        reply.send({ ok: true });
        setTimeout(async () => {
          try {
            await server.close();
          } catch {
            // ignore
          } finally {
            process.exit(0);
          }
        }, 25);
        return;
      })()
    );
  }

  server.post("/auth/setup-pin", async (req) =>
    wrap("auth/setup-pin", async () => authManager.bootstrapPin(req.body?.pin, req.body?.role))()
  );
  server.post("/auth/login", async (req) => wrap("auth/login", async () => authManager.login(req.body?.pin))());
  server.post("/auth/logout", async (req) => wrap("auth/logout", async () => authManager.logout())());
  server.get("/auth/status", async () => wrap("auth/status", async () => authManager.status())());
  server.post("/auth/recover-pin", async (req) =>
    wrap("auth/recover-pin", async () => {
      const phrase = String(req.body?.confirmation || "")
        .trim()
        .toUpperCase();
      if (phrase !== "RESET PIN") throw new Error("Type RESET PIN to confirm");
      return authManager.recoverPin(req.body?.pin, "runtime-recovery");
    })()
  );

  server.get("/permissions", async () =>
    wrap("permissions/list", async () => {
      requireAdmin();
      return permissionManager.list();
    })()
  );
  server.post("/permissions/set", async (req) =>
    wrap("permissions/set", async () => {
      requireAdmin();
      return permissionManager.set(req.body?.key, req.body?.value, "runtime");
    })()
  );
  server.get("/permissions/audit", async (req) =>
    wrap("permissions/audit", async () => permissionManager.auditTail(req.query?.limit))()
  );

  server.post("/vault/set", async (req) =>
    wrap("vault/set", async () => {
      requireAdmin();
      return secretVault.set(req.body?.secret);
    })()
  );
  server.get("/vault/get", async () =>
    wrap("vault/get", async () => {
      requireAdmin();
      return { secret: await secretVault.get() };
    })()
  );
  server.post("/vault/clear", async () =>
    wrap("vault/clear", async () => {
      requireAdmin();
      return secretVault.clear();
    })()
  );

  server.post("/memory/add", async (req) => wrap("memory/add", async () => memoryStore.add(req.body || {}))());
  server.get("/memory/list", async (req) => wrap("memory/list", async () => memoryStore.list(req.query?.limit))());
  server.get("/memory/search", async (req) =>
    wrap("memory/search", async () => memoryStore.search(req.query?.q, req.query?.limit))()
  );
  server.post("/memory/compact", async (req) =>
    wrap("memory/compact", async () => memoryStore.compact(req.body?.sessionId))()
  );

  server.post("/checkpoint/save", async (req) =>
    wrap("checkpoint/save", async () => {
      requirePermission("checkpointWrite");
      return checkpointManager.save(req.body?.state || {}, req.body?.reason || "manual");
    })()
  );
  server.get("/checkpoint/list", async () => wrap("checkpoint/list", async () => checkpointManager.list())());
  server.get("/checkpoint/latest", async () => wrap("checkpoint/latest", async () => checkpointManager.latest())());
  server.get("/checkpoint/load/:name", async (req) =>
    wrap("checkpoint/load", async () => checkpointManager.load(req.params?.name))()
  );

  // --- FILE OPS (hardened) ---
  server.post("/file/read", async (req) =>
    wrap("file/read", async () => {
      requirePermission("fileRead");
      const safePath = resolveUnderRuntime(req.body?.path);
      await permissionManager.audit("read-file", safePath, "runtime");
      return { data: await fsp.readFile(safePath, "utf8") };
    })()
  );

  server.post("/file/write", async (req) =>
    wrap("file/write", async () => {
      requireAdmin();
      requirePermission("fileWrite");
      const safePath = resolveUnderRuntime(req.body?.path);
      const safeData = assertText(req.body?.data);

      await permissionManager.audit("write-file", safePath, "runtime", safeData.length);

      await fsp.mkdir(path.dirname(safePath), { recursive: true });
      await fsp.writeFile(safePath, safeData, "utf8");
      return { ok: true };
    })()
  );

  // --- LLM (local only) ---
  server.get("/llm/ping", async () =>
    wrap("llm/ping", async () => {
      const res = await nodeFetch(`${llmHost}/api/tags`, { redirect: "error" });
      return { ok: res.ok };
    })()
  );

  server.post("/llm/chat", async (req) =>
    wrap("llm/chat", async () => {
      const payload = req.body;
      if (!payload || typeof payload !== "object") throw new Error("Invalid chat payload");

      const res = await nodeFetch(`${llmHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "error",
        body: JSON.stringify(payload)
      });

      return res.json();
    })()
  );

  server.post("/auto/start", async (req) =>
    wrap("auto/start", async () => {
      requirePermission("autoMode");
      await permissionManager.audit("auto-start", "autoMode", "runtime", req.body?.goal || "");
      return autonomousEngine.start(req.body || {});
    })()
  );
  server.post("/auto/stop", async () => wrap("auto/stop", async () => autonomousEngine.stop())());
  server.get("/auto/status", async () => wrap("auto/status", async () => autonomousEngine.status())());

  // --- SYNC (SSRF hardened; endpoint from env only) ---
  server.post("/sync/push", async (req) =>
    wrap("sync/push", async () => {
      requireAdmin();

      const endpoint = process.env.NS_SYNC_ENDPOINT
        ? await assertSafeRemoteUrl(String(process.env.NS_SYNC_ENDPOINT))
        : null;
      if (!endpoint) throw new Error("NS_SYNC_ENDPOINT not configured");

      return syncClient.push(endpoint, req.body?.token, req.body?.payload);
    })()
  );

  server.post("/sync/pull", async (req) =>
    wrap("sync/pull", async () => {
      requireAdmin();

      const endpoint = process.env.NS_SYNC_ENDPOINT
        ? await assertSafeRemoteUrl(String(process.env.NS_SYNC_ENDPOINT))
        : null;
      if (!endpoint) throw new Error("NS_SYNC_ENDPOINT not configured");

      return syncClient.pull(endpoint, req.body?.token);
    })()
  );

  // --- UPDATE CHECK (SSRF hardened; feed URL from env only) ---
  const UPDATE_ALLOW_HOSTS = (process.env.NS_UPDATE_ALLOW_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  server.post("/update/check", async (req) =>
    wrap("update/check", async () => {
      const currentVersion = String(req.body?.currentVersion || "0.0.0");

      const feedUrl = process.env.NS_UPDATE_FEED_URL
        ? await assertSafeRemoteUrl(String(process.env.NS_UPDATE_FEED_URL), {
            allowHosts: UPDATE_ALLOW_HOSTS.length ? UPDATE_ALLOW_HOSTS : null
          })
        : undefined;

      return updateService.check(currentVersion, feedUrl);
    })()
  );

  server.post("/tear/export", async (req) =>
    wrap("tear/export", async () => {
      const payload = req.body?.payload;
      if (!payload || typeof payload !== "object") throw new Error("Invalid TEAR payload");
      const envelope = await createEnvelope(payload, req.body?.secret || "", req.body?.hint || "");
      return { envelope };
    })()
  );

  server.post("/tear/import", async (req) =>
    wrap("tear/import", async () => {
      const envelope = req.body?.envelope;
      if (!envelope || typeof envelope !== "object") throw new Error("Invalid TEAR envelope");
      const payload = await parseEnvelope(envelope, req.body?.secret || "");
      return { payload };
    })()
  );

  return { server, runtimeDir };
}

module.exports = { createTearServer };
