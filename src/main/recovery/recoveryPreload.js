const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('recovery', {
  onReport: (fn) => ipcRenderer.on('recovery:report', (_e, data) => fn(data)),
  repair: () => ipcRenderer.invoke('recovery:repair'),
  restart: () => ipcRenderer.invoke('recovery:restart')
});
