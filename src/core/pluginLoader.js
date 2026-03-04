const commandHandlers = new Map();

async function onLoad() {
  return true;
}

async function onMessage() {
  return true;
}

async function onShutdown() {
  return true;
}

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
    throw new Error("Invalid command registration payload.");
  }
  commandHandlers.set(String(command.name), command);
}

async function runCommand(name, context) {
  const key = String(name || "");
  const cmd = commandHandlers.get(key);
  if (!cmd) {
    return {
      ok: false,
      error: `Unknown command: ${key}`
    };
  }
  const result = await cmd.run(context || {});
  return {
    ok: true,
    result
  };
}

module.exports = {
  onLoad,
  onMessage,
  onShutdown,
  listCommands,
  registerCommand,
  runCommand
};
