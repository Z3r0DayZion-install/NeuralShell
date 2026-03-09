const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { kernel: rawKernel, ...caps } = require("../kernel");

const commandHandlers = new Map();
const AUTONOMOUS_DIR = path.join(__dirname, "../plugins/autonomous");
const MANIFESTS_DIR = path.join(__dirname, "../plugins/manifests");

/**
 * NeuralShell Plugin Loader — Sovereign Capability Gating (OMEGA)
 */

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex").toUpperCase();
}

function parseManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

/**
 * Creates a scoped kernel for a plugin, enforcing permission boundaries.
 */
function createScopedKernel(permissions) {
  return {
    async request(capability, method, params) {
      // Capability Gating
      if (capability === caps.CAP_NET && !permissions.includes("net")) {
        throw new Error("CAPABILITY_DENIED: Network access not authorized by manifest.");
      }
      if (capability === caps.CAP_FS && !permissions.includes("fs")) {
        throw new Error("CAPABILITY_DENIED: FileSystem access not authorized by manifest.");
      }
      if (capability === caps.CAP_PROC && !permissions.includes("proc")) {
        throw new Error("CAPABILITY_DENIED: Process execution not authorized by manifest.");
      }
      if (capability === caps.CAP_CRYPTO && !permissions.includes("crypto")) {
        throw new Error("CAPABILITY_DENIED: Crypto access not authorized by manifest.");
      }
      if (capability === caps.CAP_KEYCHAIN && !permissions.includes("keychain")) {
        throw new Error("CAPABILITY_DENIED: Keychain access not authorized by manifest.");
      }
      
      return rawKernel.request(capability, method, params);
    },
    ...caps // Include CAP_FS, CAP_NET, etc. constants
  };
}

async function onLoad() {
  if (!fs.existsSync(AUTONOMOUS_DIR)) fs.mkdirSync(AUTONOMOUS_DIR, { recursive: true });
  if (!fs.existsSync(MANIFESTS_DIR)) fs.mkdirSync(MANIFESTS_DIR, { recursive: true });

  const files = fs.readdirSync(AUTONOMOUS_DIR);
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    
    try {
      const pluginPath = path.join(AUTONOMOUS_DIR, file);
      const manifestPath = path.join(MANIFESTS_DIR, file.replace(".js", ".json"));
      
      if (!fs.existsSync(manifestPath)) {
        console.error(`[PLUGINS] Blocked: Plugin ${file} has no manifest.`);
        continue;
      }

      const manifest = parseManifest(manifestPath);
      const actualHash = calculateHash(pluginPath);
      
      if (actualHash !== manifest.hash.toUpperCase()) {
        console.error(`[PLUGINS] Blocked: Integrity mismatch for ${file}. Expected ${manifest.hash}, got ${actualHash}`);
        continue;
      }

      const scopedKernel = createScopedKernel(manifest.permissions || []);
      
      delete require.cache[require.resolve(pluginPath)];
      const plugin = require(pluginPath);
      
      if (plugin && typeof plugin.register === "function") {
        plugin.register({ 
          registerCommand, 
          kernel: scopedKernel 
        });
        console.log(`[PLUGINS] Verified & Loaded: ${manifest.name} v${manifest.version}`);
      }
    } catch (err) {
      console.error(`[PLUGINS] Failed to load autonomous plugin ${file}:`, err.message);
    }
  }
  return true;
}

async function onMessage() { return true; }
async function onShutdown() { return true; }

function listCommands() {
  return Array.from(commandHandlers.values()).map((entry) => ({
    name: entry.name,
    description: entry.description || "",
    args: Array.isArray(entry.args) ? entry.args : [],
    source: entry.source || "plugin"
  }));
}

function registerCommand(command) {
  if (!command || typeof command !== "object" || !command.name || typeof command.run !== "function") {
    throw new Error("Invalid command registration.");
  }
  commandHandlers.set(String(command.name), command);
}

async function runCommand(name, context) {
  const key = String(name || "");
  const cmd = commandHandlers.get(key);
  if (!cmd) return { ok: false, error: `Unknown command: ${key}` };
  
  try {
    const result = await cmd.run(context || {});
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  onLoad,
  onMessage,
  onShutdown,
  listCommands,
  registerCommand,
  runCommand
};
