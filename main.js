const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const LLM_HOST = 'http://127.0.0.1:11434';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('src/renderer.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Secure IPC routes
ipcMain.handle('read-file', async (_evt, filePath) => {
  return fs.promises.readFile(filePath, 'utf8');
});

ipcMain.handle('write-file', async (_evt, filePath, data) => {
  await fs.promises.writeFile(filePath, data, 'utf8');
  return true;
});

ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
  return canceled ? null : filePaths[0];
});
const fetch = require('node-fetch');
ipcMain.handle('llm-ping', async () => {
  try {
    const res = await fetch(`${LLM_HOST}/api/tags`);
    return res.ok;
  } catch { return false; }
});
ipcMain.handle('llm-chat', async (_e, body) => {
  const res = await fetch(`${LLM_HOST}/api/chat`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return res.json();
});
