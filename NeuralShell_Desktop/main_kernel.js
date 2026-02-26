"use strict";

/**
 * 1. MAIN PROCESS ENVIRONMENT SANITIZATION
 */
const FORBIDDEN_ENV = ['NODE_OPTIONS', 'ELECTRON_RUN_AS_NODE', 'LD_PRELOAD', 'SSL_CERT_DIR'];
FORBIDDEN_ENV.forEach(v => { delete process.env[v]; delete process.env[v.toLowerCase()]; });

// 2. PROTOTYPE HARDENING
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
Object.freeze(Function.prototype);

const { app, session, BrowserWindow, ipcMain, dialog } = require('electron');
const { URL } = require('node:url'); 
const path = require('node:path');
const { verifyBootIntegrity, verifyDirectoryACL } = require('../src/boot/verify');

app.whenReady().then(async () => {
  // 3. PHYSICAL DIRECTORY TRUST
  if (!verifyDirectoryACL()) {
    dialog.showErrorBox("Security Failure", "NeuralShell must be installed in a protected directory (e.g. Program Files) to enforce Sovereign Integrity.");
    process.exit(1);
  }

  const integrity = await verifyBootIntegrity();
  if (!integrity.ok) {
    console.error(`FATAL: Integrity Violation: ${integrity.reason}`);
    process.exit(1); 
  }

  // 4. IPC PAYLOAD CAPPING middleware
  const MAX_IPC_SIZE = 2 * 1024 * 1024;
  const originalHandle = ipcMain.handle;
  ipcMain.handle = (channel, listener) => {
    return originalHandle.call(ipcMain, channel, async (event, ...args) => {
      try {
        const size = Buffer.byteLength(JSON.stringify(args));
        if (size > MAX_IPC_SIZE) throw new Error("ERR_IPC_PAYLOAD_TOO_LARGE");
        return await listener(event, ...args);
      } catch (e) {
        console.error(`[Kernel] IPC Error [${channel}]: ${e.message}`);
        throw e;
      }
    });
  };

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
    const url = new URL(details.url);
    if (url.protocol === 'file:') return cb({ cancel: false });
    if (url.protocol === 'data:' && details.resourceType === 'image') return cb({ cancel: false });
    cb({ cancel: true });
  });

  ipcMain.handle('kernel:confirm', (event, payload) => {
    const choice = dialog.showMessageBoxSync({
      type: 'warning',
      buttons: ['Deny', 'Execute'],
      defaultId: 0,
      title: 'Security Authorization Required',
      message: `The AI is requesting to execute: ${payload.action}`,
      detail: payload.details,
      noLink: true
    });
    return choice === 1;
  });

  const win = new BrowserWindow({
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      sandbox: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  
  if (app.isPackaged) {
    win.webContents.on('devtools-opened', () => { win.webContents.closeDevTools(); });
  }

  win.loadFile('src/renderer.html');
});
