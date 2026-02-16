const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("neuralAPI", {
  readFile: (p) => ipcRenderer.invoke("read-file", p),
  writeFile: (p, d) => ipcRenderer.invoke("write-file", p, d),
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectSavePath: (options) => ipcRenderer.invoke("select-save-path", options)
});

contextBridge.exposeInMainWorld("llmBridge", {
  ping: () => ipcRenderer.invoke("llm-ping"),
  chat: (payload) => ipcRenderer.invoke("llm-chat", payload),
  streamStart: (payload) => ipcRenderer.invoke("llm-stream:start", payload),
  streamCancel: (streamId) => ipcRenderer.invoke("llm-stream:cancel", streamId),
  streamResume: (streamId) => ipcRenderer.invoke("llm-stream:resume", streamId),
  onStreamEvent: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === "function") callback(payload);
    };
    ipcRenderer.on("llm:stream:event", handler);
    return () => ipcRenderer.removeListener("llm:stream:event", handler);
  }
});

contextBridge.exposeInMainWorld("autonomousBridge", {
  start: (payload) => ipcRenderer.invoke("auto:start", payload),
  stop: () => ipcRenderer.invoke("auto:stop"),
  status: () => ipcRenderer.invoke("auto:status"),
  onTick: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === "function") callback(payload);
    };
    ipcRenderer.on("auto:tick", handler);
    return () => ipcRenderer.removeListener("auto:tick", handler);
  }
});

contextBridge.exposeInMainWorld("memoryBridge", {
  add: (record) => ipcRenderer.invoke("memory:add", record),
  list: (limit) => ipcRenderer.invoke("memory:list", limit),
  search: (query, limit) => ipcRenderer.invoke("memory:search", query, limit),
  compact: (sessionId) => ipcRenderer.invoke("memory:compact", sessionId)
});

contextBridge.exposeInMainWorld("checkpointBridge", {
  save: (state, reason) => ipcRenderer.invoke("checkpoint:save", state, reason),
  list: () => ipcRenderer.invoke("checkpoint:list"),
  latest: () => ipcRenderer.invoke("checkpoint:latest"),
  load: (name) => ipcRenderer.invoke("checkpoint:load", name)
});

contextBridge.exposeInMainWorld("permissionBridge", {
  list: () => ipcRenderer.invoke("permissions:list"),
  set: (key, value) => ipcRenderer.invoke("permissions:set", key, value),
  audit: (limit) => ipcRenderer.invoke("permissions:audit", limit)
});

contextBridge.exposeInMainWorld("telemetryBridge", {
  get: () => ipcRenderer.invoke("telemetry:get")
});

contextBridge.exposeInMainWorld("authBridge", {
  login: (pin) => ipcRenderer.invoke("auth:login", pin),
  logout: () => ipcRenderer.invoke("auth:logout"),
  status: () => ipcRenderer.invoke("auth:status"),
  setupPin: (pin, role) => ipcRenderer.invoke("auth:setup-pin", pin, role),
  recoverPin: (pin, confirmation) => ipcRenderer.invoke("auth:recover-pin", pin, confirmation),
  setPin: (pin, role) => ipcRenderer.invoke("auth:set-pin", pin, role)
});

contextBridge.exposeInMainWorld("vaultBridge", {
  setSecret: (secret) => ipcRenderer.invoke("vault:set-secret", secret),
  getSecret: () => ipcRenderer.invoke("vault:get-secret"),
  clearSecret: () => ipcRenderer.invoke("vault:clear-secret")
});

contextBridge.exposeInMainWorld("syncBridge", {
  push: (endpoint, token, payload) => ipcRenderer.invoke("sync:push", endpoint, token, payload),
  pull: (endpoint, token) => ipcRenderer.invoke("sync:pull", endpoint, token)
});

contextBridge.exposeInMainWorld("updateBridge", {
  check: (feedUrl) => ipcRenderer.invoke("update:check", feedUrl)
});
