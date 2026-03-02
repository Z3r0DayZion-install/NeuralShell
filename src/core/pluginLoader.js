const fs = require("fs");
const path = require("path");

class PluginLoader {
  constructor() {
    this.plugins = [];
    this.commands = new Map();
    const pluginDir = path.join(__dirname, "..", "plugins");
    if (fs.existsSync(pluginDir)) {
      fs.readdirSync(pluginDir).forEach((file) => {
        if (!file.endsWith(".js")) return;
        const pluginPath = path.join(pluginDir, file);
        try {
          const plugin = require(pluginPath);
          this.plugins.push(plugin);
          this.registerPluginCommands(plugin, file);
        } catch (err) {
          console.warn("Failed to load plugin", file, err);
        }
      });
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
          console.warn("Plugin onLoad error", err);
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
          console.warn("Plugin onMessage error", err);
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
          console.warn("Plugin onShutdown error", err);
        }
      }
    }
  }
}

module.exports = new PluginLoader();
