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
      ['updates.neuralshell.app', ['sha256/f7bb5d8487103251d86776295da97742d17c3857e4c029a68a99-ebff-11f0-b275-28dfeb5c36cb']]
    ]),
    maxResponseSize: 5 * 1024 * 1024,
    timeoutMs: 15000
  },
  execution: {
    taskRegistry: {
      'neural-link:devices': {
        path: path.join(__dirname, '../../bin/neural-link.exe'),
        args: ['devices'],
        hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' // Must be replaced with actual hash in prod
      },
      'neural-link:send': {
        path: path.join(__dirname, '../../bin/neural-link.exe'),
        args: ['send'],
        hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      },
      'neural-linkd:start': {
        path: path.join(__dirname, '../../bin/neural-linkd.exe'),
        args: [],
        hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
      },
      'ollama:list': {
        path: 'C:\\Users\\KickA\\AppData\\Local\\Programs\\Ollama\\ollama.exe',
        args: ['list'],
        hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
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
