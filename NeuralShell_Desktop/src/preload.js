const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('llmBridge', {
    ping: () => ipcRenderer.invoke('ping'),
    chat: (messages) => ipcRenderer.invoke('chat', messages)
});
