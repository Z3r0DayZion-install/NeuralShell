const fs = require("fs");
const path = require("path");

const commandHandlers = new Map();
const AUTONOMOUS_DIR = path.join(__dirname, "../plugins/autonomous");

/**
 * NeuralShell Plugin Loader — Sovereign & Extensible
 */

async function onLoad() {
  if (!fs.existsSync(AUTONOMOUS_DIR)) {
    fs.mkdirSync(AUTONOMOUS_DIR, { recursive: true });
  }

  // Load built-in plugins if any exist in src/plugins/
  // ...

  // Load Autonomous Plugins (Agent-authored)
  const files = fs.readdirSync(AUTONOMOUS_DIR);
  for (const file of files) {
    if (file.endsWith(".js")) {
      try {
        const pluginPath = path.join(AUTONOMOUS_DIR, file);
        // Clear cache to allow hot-reloading
        delete require.cache[require.resolve(pluginPath)];
        const plugin = require(pluginPath);
        if (plugin && typeof plugin.register === "function") {
          plugin.register({ registerCommand });
        }
      } catch (err) {
        console.error(`[PLUGINS] Failed to load autonomous plugin ${file}:`, err.message);
      }
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
