const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');

let recoveryWin = null;

function createRecoveryWindow(report) {
  if (recoveryWin) return;

  recoveryWin = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'NeuralShell Recovery Mode',
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'recoveryPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  recoveryWin.loadFile(path.join(__dirname, '../../recovery/index.html'));

  recoveryWin.on('closed', () => {
    recoveryWin = null;
  });

  // Send report to UI once loaded
  recoveryWin.webContents.on('did-finish-load', () => {
    recoveryWin.webContents.send('recovery:report', report);
  });
}

module.exports = { createRecoveryWindow };
