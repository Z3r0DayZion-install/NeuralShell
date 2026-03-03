const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { kernel, CAP_PROC } = require("../kernel");

// Provide safe wrapped API to plugins
const safeLogger = require("./logger");

class PluginLoader {
  constructor() {
    this.plugins = [];
    this.commands = new Map();
    this.pluginDir = path.join(__dirname, "..", "plugins");
  }

  async init() {
    if (fs.existsSync(this.pluginDir)) {
      const files = fs.readdirSync(this.pluginDir);
      for (const file of files) {
        if (!file.endsWith(".js")) continue;
        const pluginPath = path.join(this.pluginDir, file);
        try {
          const pluginCode = fs.readFileSync(pluginPath, "utf8");
          
          // Create isolated sandbox
          const sandbox = {
            module: { exports: {} },
            console: {
              log: (...args) => safeLogger.info(`[Plugin:${file}] ` + args.join(' ')),
              warn: (...args) => safeLogger.warn(`[Plugin:${file}] ` + args.join(' ')),
              error: (...args) => safeLogger.error(`[Plugin:${file}] ` + args.join(' '))
            },
            // Polyfill a very restricted require for legacy plugin compat
            require: (moduleName) => {
              if (['fs', 'child_process', 'net', 'http', 'https', 'crypto'].includes(moduleName)) {
                throw new Error(`Capability Sandboxing blocked forbidden import: ${moduleName}`);
              }
              if (moduleName.includes('logger')) {
                return safeLogger;
              }
              if (moduleName === 'path') {
                return path;
              }
              throw new Error(`Sandboxed require denied: ${moduleName}`);
            },
            // Capability injection
            kernelAPI: {
              runProcess: async (cmd, args) => {
                // Request capability explicitly via the microkernel
                return await kernel.request(CAP_PROC, 'execute', { command: cmd, args });
              }
            }
          };

          vm.createContext(sandbox);
          const script = new vm.Script(pluginCode, { filename: file });
          script.runInContext(sandbox, { timeout: 1000 }); // Prevent infinite loop at load

          const plugin = sandbox.module.exports;
          this.plugins.push(plugin);
          this.registerPluginCommands(plugin, file);
        } catch (err) {
          console.warn("Failed to load plugin", file, err.message);
        }
      }
    }
  }

  registerPluginCommands(plugin, sourceName) {
    const definitions = Array.isArray(plugin.commands) ? plugin.commands : [];
    definitions.forEach((def) => {
      if (!def || typeof def.name !== "string" || typeof def.execute !== "function") {
        return;
      }
      const name = def.name.toLowerCase();
      this.commands.set(name, {
        name,
        description: def.description || "",
        args: Array.isArray(def.args) ? def.args : [],
        source: sourceName,
        execute: def.execute
      });
    });
  }

  async runCommand(name, ctx) {
    const command = this.commands.get(String(name || "").toLowerCase());
    if (!command) {
      return { ok: false, error: "Unknown command." };
    }
    try {
      // Execute in sandbox conceptually, but the function is already bound to its context
      const result = await command.execute(ctx);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Command failed." };
    }
  }

  listCommands() {
    return Array.from(this.commands.values()).map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      args: cmd.args,
      source: cmd.source
    }));
  }

  async onLoad() {
    for (const plugin of this.plugins) {
      if (typeof plugin.onLoad === "function") {
        try {
          await plugin.onLoad();
        } catch (err) {
          console.warn("Plugin onLoad error", err.message);
        }
      }
    }
  }

  async onMessage(message, conversation) {
    for (const plugin of this.plugins) {
      if (typeof plugin.onMessage === "function") {
        try {
          await plugin.onMessage(message, conversation);
        } catch (err) {
          console.warn("Plugin onMessage error", err.message);
        }
      }
    }
  }

  async onShutdown() {
    for (const plugin of this.plugins) {
      if (typeof plugin.onShutdown === "function") {
        try {
          await plugin.onShutdown();
        } catch (err) {
          console.warn("Plugin onShutdown error", err.message);
        }
      }
    }
  }
}

module.exports = new PluginLoader();
