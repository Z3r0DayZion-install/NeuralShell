const { contextBridge, ipcRenderer } = require("electron");

const ALLOWED_INVOKE_CHANNELS = new Set([
  "llm:ping",
  "llm:chat",
  "llm:stream",
  "model:set",
  "llm:listModels",
  "llm:health",
  "llm:cancelStream",
  "state:get",
  "state:set",
  "state:update",
  "state:export",
  "state:import",
  "settings:get",
  "settings:update",
  "session:list",
  "session:save",
  "session:load",
  "session:search",
  "session:delete",
  "session:rename",
  "session:metadata",
  "session:repairIndex",
  "session:export",
  "session:import-bundle",
  "command:list",
  "command:run",
  "llm:bridge:get",
  "llm:bridge:test",
  "llm:bridge:save",
  "rgb:status",
  "rgb:applyMood",
  "audit:append",
  "audit:tail",
  "audit:verify",
  "system:stats",
  "log:log",
  "log:tail",
  "log:clear",
  "log:export",
  "log:tailKnowledge",
  "log:getCapabilityGraph",
  "chatlog:tail",
  "chatlog:export",
  "chatlog:clear",
  "identity:pubkey",
  "identity:trust-peer",
  "identity:revoke-peer",
  "identity:list-peers",
  "identity:rotate",
  "daemon:status",
  "xp:status",
  "xp:add",
  "ritual:list",
  "ritual:execute",
  "ritual:schedule",
  "ritual:setAutoTrigger",
  "ritual:scheduled",
  "history:parse",
  "history:format",
  "vault:lock",
  "vault:unlock",
  "vault:compact",
  "llm:autoDetect",
  "llm:setPersona",
  "kernel:request",
  "recovery:repair",
  "recovery:restart",
  "empire:scan"
]);

const ALLOWED_SEND_CHANNELS = new Set([]);
const ALLOWED_ON_CHANNELS = new Set([
  "llm-status-change",
  "daemon-status",
  "transfer-progress",
  "xp-update",
  "ritual-triggered"
]);

function assertAllowed(set, channel, type) {
  if (!set.has(channel)) {
    throw new Error(`IPC ${type} channel is not allowed: ${channel}`);
  }
}

/**
 * Expose a namespace on the window for the renderer to communicate with
 * the main process. Each function invokes an IPC handler or listens for
 * asynchronous events. The API surface is intentionally limited to
 * prevent arbitrary code execution in the renderer.
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Generic IPC invoke wrapper. Use this to call ipcMain.handle() channels.
   * @param {string} channel The channel name
   * @param {any} data The argument to send
   */
  invoke: (channel, data) => {
    assertAllowed(ALLOWED_INVOKE_CHANNELS, channel, "invoke");
    return ipcRenderer.invoke(channel, data);
  },
  /**
   * Generic IPC send wrapper for asynchronous messages.
   * @param {string} channel
   * @param {any} data
   */
  send: (channel, data) => {
    assertAllowed(ALLOWED_SEND_CHANNELS, channel, "send");
    return ipcRenderer.send(channel, data);
  },
  /**
   * Listen for an IPC message from the main process. The handler is
   * called with the message's arguments when the event fires.
   * @param {string} channel
   * @param {function} func
   */
  on: (channel, func) => {
    assertAllowed(ALLOWED_ON_CHANNELS, channel, "on");
    return ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
  // Namespaced typed APIs for backward compatibility. These call the
  // underlying ipcRenderer.invoke methods internally.
  llm: {
    /**
     * Check connectivity to the LLM backend.
     * @returns {Promise<boolean>}
     */
    ping: () => ipcRenderer.invoke("llm:ping"),
    /**
     * Make a non-streaming chat request.
     * @param {Array<{role:string, content:string}>} messages
     * @returns {Promise<any>}
     */
    chat: (messages) => ipcRenderer.invoke("llm:chat", messages),
    /**
     * Start a streaming chat request. The returned promise resolves when
     * the request has been initiated. Stream data is delivered via the
     * `llm-stream-data` and `llm-stream-complete` events.
     * @param {Array<{role:string, content:string}>} messages
     * @returns {Promise<boolean>}
     */
    streamChat: (messages) => ipcRenderer.invoke("llm:stream", messages),
    /**
     * Update the selected model.
     * @param {string} model
     */
    setModel: (model) => ipcRenderer.invoke("model:set", model),
    /**
     * Retrieve available models from the server. Returns an array of
     * strings. When the server cannot be contacted an empty array is
     * returned.
     * @returns {Promise<string[]>}
     */
    listModels: () => ipcRenderer.invoke("llm:listModels"),
    /**
     * Retrieve backend health diagnostics.
     * @returns {Promise<object>}
     */
    health: () => ipcRenderer.invoke("llm:health"),
    /**
     * Cancel an in‑flight streaming request. Resolves when cancellation has
     * been propagated to the main process.
     * @returns {Promise<boolean>}
     */
    cancelStream: () => ipcRenderer.invoke("llm:cancelStream"),
    /**
     * Auto-detect local Ollama instance.
     */
    autoDetect: () => ipcRenderer.invoke("llm:autoDetect"),
    /**
     * Set the current persona for the assistant.
     * @param {string} personaId
     */
    setPersona: (personaId) => ipcRenderer.invoke("llm:setPersona", personaId)
  },
  xp: {
    status: () => ipcRenderer.invoke("xp:status"),
    add: (amount) => ipcRenderer.invoke("xp:add", amount),
    onUpdate: (fn) => ipcRenderer.on("xp-update", (_e, data) => fn(data))
  },
  ritual: {
    list: () => ipcRenderer.invoke("ritual:list"),
    execute: (id) => ipcRenderer.invoke("ritual:execute", id),
    schedule: (id, timestamp) =>
      ipcRenderer.invoke("ritual:schedule", id, timestamp),
    setAutoTrigger: (criteria) =>
      ipcRenderer.invoke("ritual:setAutoTrigger", criteria),
    getScheduled: () => ipcRenderer.invoke("ritual:scheduled"),
    onTrigger: (fn) =>
      ipcRenderer.on("ritual-triggered", (_e, data) => fn(data))
  },
  history: {
    parse: (filePath) => ipcRenderer.invoke("history:parse", filePath),
    format: (logs) => ipcRenderer.invoke("history:format", logs)
  },
  vault: {
    lock: () => ipcRenderer.invoke("vault:lock"),
    unlock: (password) => ipcRenderer.invoke("vault:unlock", password),
    compact: (data, format) => ipcRenderer.invoke("vault:compact", data, format)
  },
  kernel: {
    request: (intent, payload) =>
      ipcRenderer.invoke("kernel:request", intent, payload)
  },
  empire: {
    scan: () => ipcRenderer.invoke("empire:scan")
  },
  state: {
    /**
     * Retrieve the entire persisted state.
     * @returns {Promise<object>}
     */
    get: () => ipcRenderer.invoke("state:get"),
    /**
     * Set a single property in the state.
     * @param {string} key
     * @param {any} value
     */
    set: (key, value) => ipcRenderer.invoke("state:set", key, value),
    /**
     * Merge multiple properties into the state.
     * @param {object} updates
     */
    update: (updates) => ipcRenderer.invoke("state:update", updates),
    export: () => ipcRenderer.invoke("state:export"),
    import: (payload) => ipcRenderer.invoke("state:import", payload)
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (settings) => ipcRenderer.invoke("settings:update", settings)
  },
  session: {
    /**
     * List saved sessions.
     * @returns {Promise<string[]>}
     */
    list: () => ipcRenderer.invoke("session:list"),
    /**
     * Save a session using the provided name, data and passphrase.
     * @param {string} name
     * @param {any} data
     * @param {string} passphrase
     */
    save: (name, data, passphrase) =>
      ipcRenderer.invoke("session:save", name, data, passphrase),
    /**
     * Load and decrypt a session.
     * @param {string} name
     * @param {string} passphrase
     */
    load: (name, passphrase) =>
      ipcRenderer.invoke("session:load", name, passphrase),
    /**
     * Search for sessions containing the given query in their name.
     * @param {string} query
     * @returns {Promise<Array<object>>}
     */
    search: (query) => ipcRenderer.invoke("session:search", query),
    /**
     * Delete a session by name.
     * @param {string} name
     * @returns {Promise<boolean>}
     */
    delete: (name) => ipcRenderer.invoke("session:delete", name),
    /**
     * Rename a session.
     * @param {string} oldName
     * @param {string} newName
     * @returns {Promise<boolean>}
     */
    rename: (oldName, newName) =>
      ipcRenderer.invoke("session:rename", oldName, newName),
    /**
     * Retrieve full metadata for all sessions.
     * @returns {Promise<Object>}
     */
    metadata: () => ipcRenderer.invoke("session:metadata"),
    repairIndex: () => ipcRenderer.invoke("session:repairIndex"),
    /** Export a session as a NeuralLink™ bundle to a peer. */
    export: (name, peerId) =>
      ipcRenderer.invoke("session:export", name, peerId),
    /** Import and verify a NeuralLink™ bundle from a local path. */
    importBundle: (filePath) =>
      ipcRenderer.invoke("session:import-bundle", filePath)
  },
  command: {
    list: () => ipcRenderer.invoke("command:list"),
    run: (name, args) => ipcRenderer.invoke("command:run", name, args)
  },
  bridge: {
    get: () => ipcRenderer.invoke("llm:bridge:get"),
    test: (profile) => ipcRenderer.invoke("llm:bridge:test", profile),
    save: (payload) => ipcRenderer.invoke("llm:bridge:save", payload)
  },
  rgb: {
    status: () => ipcRenderer.invoke("rgb:status"),
    applyMood: (payload) => ipcRenderer.invoke("rgb:applyMood", payload)
  },
  audit: {
    append: (payload) => ipcRenderer.invoke("audit:append", payload),
    tail: (limit) => ipcRenderer.invoke("audit:tail", limit),
    verify: () => ipcRenderer.invoke("audit:verify")
  },
  system: {
    /**
     * Get a snapshot of system statistics.
     * @returns {Promise<object>}
     */
    getStats: () => ipcRenderer.invoke("system:stats")
  },
  logger: {
    /**
     * Log an event from the renderer.
     * @param {string} level
     * @param {string} message
     */
    log: (level, message, meta) =>
      ipcRenderer.invoke("log:log", level, message, meta),
    tail: (lines) => ipcRenderer.invoke("log:tail", lines),
    clear: () => ipcRenderer.invoke("log:clear"),
    export: () => ipcRenderer.invoke("log:export")
  },
  chatlog: {
    tail: (limit) => ipcRenderer.invoke("chatlog:tail", limit),
    export: () => ipcRenderer.invoke("chatlog:export"),
    clear: () => ipcRenderer.invoke("chatlog:clear")
  },
  identity: {
    /** Returns own public key PEM and display fingerprint. */
    pubkey: () => ipcRenderer.invoke("identity:pubkey"),
    /** Add a peer device to the trust store. */
    trustPeer: (deviceId, pubKeyPem, label) =>
      ipcRenderer.invoke("identity:trust-peer", deviceId, pubKeyPem, label),
    /** Remove a peer device from the trust store. */
    revokePeer: (deviceId) =>
      ipcRenderer.invoke("identity:revoke-peer", deviceId),
    /** List all trusted peer devices. */
    listPeers: () => ipcRenderer.invoke("identity:list-peers"),
    /** Rotate own keypair (generates new key, preserves trust store). */
    rotate: () => ipcRenderer.invoke("identity:rotate")
  },
  daemon: {
    /** Get current watchdog status snapshot. */
    status: () => ipcRenderer.invoke("daemon:status"),
    /** Subscribe to live daemon lifecycle events from the watchdog. */
    onStatus: (fn) => ipcRenderer.on("daemon-status", (_e, data) => fn(data)),
    /** Subscribe to real-time file transfer progress. */
    onTransferProgress: (fn) =>
      ipcRenderer.on("transfer-progress", (_e, data) => fn(data))
  }
});

// Forward LLM streaming events to the renderer as DOM events. The
// renderer can listen to these events using window.addEventListener().
ipcRenderer.on("llm-stream-data", (_event, data) => {
  window.dispatchEvent(new CustomEvent("llm-stream-data", { detail: data }));
});
ipcRenderer.on("llm-stream-error", (_event, message) => {
  window.dispatchEvent(
    new CustomEvent("llm-stream-error", { detail: message })
  );
});
ipcRenderer.on("llm-stream-complete", () => {
  window.dispatchEvent(new Event("llm-stream-complete"));
});
