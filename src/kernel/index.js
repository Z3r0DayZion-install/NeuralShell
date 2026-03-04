const path = require('path');
const { app, safeStorage } = require('electron');
const { createKernel, CAP_FS, CAP_NET, CAP_PROC, CAP_CRYPTO, CAP_KEYCHAIN } = require('@neural/omega-core');

/**
 * NeuralShell Kernel Initialization
 * Plugs NeuralShell configuration into OMEGA Core.
 */

const kernelConfig = {
  fs: {
    readOnlyRoot: app.getAppPath(),
    writeRoot: app.getPath('userData'),
    pathResolver: (name) => app.getPath(name)
  },
  network: {
    pinnedKeys: new Map([
      ['updates.neuralshell.app', []] // TODO: pin actual TLS certificate hash before release
    ]),
    maxResponseSize: 5 * 1024 * 1024,
    timeoutMs: 15000
  },
  execution: {
    taskRegistry: {
      'neural-link:devices': {
        path: path.join(__dirname, '../../bin/neural-link.exe'),
        args: ['devices'],
        hash: null // TODO: compute and pin actual binary hash before release
      },
      'neural-link:send': {
        path: path.join(__dirname, '../../bin/neural-link.exe'),
        args: ['send'],
        hash: null // TODO: compute and pin actual binary hash before release
      },
      'neural-linkd:start': {
        path: path.join(__dirname, '../../bin/neural-linkd.exe'),
        args: [],
        hash: null // TODO: compute and pin actual binary hash before release
      },
      'ollama:list': {
        path: process.platform === 'win32'
          ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe')
          : 'ollama',
        args: ['list'],
        hash: null // TODO: compute and pin actual binary hash before release
      }
    }
  },
  crypto: {},
  keychain: {
    safeStorage
  }
};

const kernel = createKernel(kernelConfig);

module.exports = {
  kernel,
  CAP_FS,
  CAP_NET,
  CAP_PROC,
  CAP_CRYPTO,
  CAP_KEYCHAIN
};
