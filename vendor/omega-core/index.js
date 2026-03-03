const crypto = require("crypto");
const fs = require("fs");
const { spawn } = require("child_process");

const CAP_FS = Symbol("CAP_FS");
const CAP_NET = Symbol("CAP_NET");
const CAP_PROC = Symbol("CAP_PROC");
const CAP_CRYPTO = Symbol("CAP_CRYPTO");
const CAP_KEYCHAIN = Symbol("CAP_KEYCHAIN");

function omegaBlock(message) {
  const err = new Error(message);
  err.code = "OMEGA_BLOCK";
  return err;
}

function assertHttpsUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || ""));
  } catch {
    throw omegaBlock("Only HTTPS URLs are allowed.");
  }
  if (parsed.protocol !== "https:") {
    throw omegaBlock("Only HTTPS URLs are allowed.");
  }
  return parsed.toString();
}

function hashFileSha256(filePath) {
  const hash = crypto.createHash("sha256");
  const content = fs.readFileSync(filePath);
  hash.update(content);
  return hash.digest("hex");
}

function createKernel(config = {}) {
  const kernelConfig = config && typeof config === "object" ? config : {};

  async function safeFetch(payload = {}) {
    const url = assertHttpsUrl(payload.url);
    const timeoutMs = Number(payload.timeoutMs) || Number(kernelConfig?.network?.timeoutMs) || 15000;
    const maxResponseSize = Number(kernelConfig?.network?.maxResponseSize) || 5 * 1024 * 1024;
    const fetchImpl = globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new Error("No fetch implementation available.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: payload.method || "GET",
        headers: payload.headers && typeof payload.headers === "object" ? payload.headers : {},
        body: payload.body == null ? undefined : payload.body,
        signal: controller.signal
      });

      const body = await response.arrayBuffer();
      if (body.byteLength > maxResponseSize) {
        throw omegaBlock("Response exceeded maxResponseSize.");
      }

      return {
        ok: Boolean(response.ok),
        status: Number(response.status),
        url: response.url,
        body: Buffer.from(body)
      };
    } catch (err) {
      if (controller.signal.aborted) {
        throw omegaBlock("Network timeout.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function executeTask(payload = {}) {
    const taskId = String(payload.taskId || "");
    const taskRegistry = kernelConfig?.execution?.taskRegistry || {};
    const task = taskRegistry[taskId];
    if (!task) {
      throw omegaBlock(`Task not registered: ${taskId}`);
    }
    const taskPath = String(task.path || "");
    if (!taskPath || !fs.existsSync(taskPath)) {
      throw omegaBlock(`Task binary not found: ${taskPath}`);
    }

    const expectedHash = String(task.hash || "").toLowerCase();
    const actualHash = hashFileSha256(taskPath).toLowerCase();
    if (!expectedHash || expectedHash !== actualHash) {
      throw omegaBlock("Binary hash mismatch.");
    }

    return await new Promise((resolve, reject) => {
      const child = spawn(taskPath, Array.isArray(task.args) ? task.args : [], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: {}
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk || "");
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk || "");
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        resolve({
          ok: Number(code) === 0,
          exitCode: Number(code),
          stdout,
          stderr
        });
      });
    });
  }

  async function kernelRequest(capability, operation, payload) {
    if (capability === CAP_NET && operation === "safeFetch") {
      return safeFetch(payload);
    }
    if (capability === CAP_PROC && operation === "executeTask") {
      return executeTask(payload);
    }
    throw omegaBlock(`Unsupported capability request: ${String(operation)}`);
  }

  return {
    request: kernelRequest
  };
}

class IntentFirewall {
  constructor(options = {}) {
    this.intentRegistry = options.intentRegistry && typeof options.intentRegistry === "object"
      ? options.intentRegistry
      : {};
  }

  _validateAgainstSchema(schema, payload) {
    if (!schema || typeof schema !== "object") {
      return;
    }

    if (schema.type === "object") {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw omegaBlock("Intent payload must be an object.");
      }

      const required = Array.isArray(schema.required) ? schema.required : [];
      for (const key of required) {
        if (!(key in payload)) {
          throw omegaBlock(`Intent payload missing required field: ${key}`);
        }
      }

      if (schema.additionalProperties === false && schema.properties && typeof schema.properties === "object") {
        const allowed = new Set(Object.keys(schema.properties));
        for (const key of Object.keys(payload)) {
          if (!allowed.has(key)) {
            throw omegaBlock(`Intent payload includes unexpected field: ${key}`);
          }
        }
      }
    }
  }

  async validate(intent, payload) {
    const intentId = String(intent || "");
    const spec = this.intentRegistry[intentId];
    if (!spec) {
      throw omegaBlock(`Intent not allowed: ${intentId}`);
    }

    this._validateAgainstSchema(spec.schema, payload);
    return {
      intent: intentId,
      payload: payload && typeof payload === "object" ? payload : {},
      requiresApproval: Boolean(spec.requiresApproval)
    };
  }
}

module.exports = {
  CAP_CRYPTO,
  CAP_FS,
  CAP_KEYCHAIN,
  CAP_NET,
  CAP_PROC,
  IntentFirewall,
  createKernel
};
