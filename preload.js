const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('neuralAPI', {
  readFile: (p) => ipcRenderer.invoke('read-file', p),
  writeFile: (p, d) => ipcRenderer.invoke('write-file', p, d),
  selectFile: () => ipcRenderer.invoke('select-file')
});

// LLM bridge
contextBridge.exposeInMainWorld('llmBridge', {
  ping: () => ipcRenderer.invoke('llm-ping'),
  chat: (payload) => ipcRenderer.invoke('llm-chat', payload)
});
