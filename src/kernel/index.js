const { createKernel, CAP_FS, CAP_NET, CAP_PROC, CAP_CRYPTO, CAP_KEYCHAIN } = require('@neural/omega-core');
const { app, safeStorage } = require('electron');

const fsBroker = require('./filesystem');
const netBroker = require('./network');
const procBroker = require('./execution');
const cryptoBroker = require('./crypto');

/**
 * NeuralShell Kernel Initialization — OMEGA v5.2.0 (GOLDEN MASTER)
 * Wraps @neural/omega-core to provide extended, audited capabilities.
 */

const kernelConfig = {
  fs: {
    readOnlyRoot: app.getAppPath(),
    writeRoot: app.getPath('userData'),
    pathResolver: (name) => app.getPath(name)
  },
  network: {
    pinnedKeys: new Map(), // Pins resolved in network broker
    maxResponseSize: 5 * 1024 * 1024,
    timeoutMs: 15000
  },
  execution: {
    taskRegistry: {} // Registry resolved in execution broker
  },
  crypto: {},
  keychain: {
    safeStorage
  }
};

const rawKernel = createKernel(kernelConfig);

const enhancedKernel = {
  async request(capability, operation, payload) {
    // 1. ROUTE FS CAPABILITIES
    if (capability === CAP_FS) {
      if (typeof fsBroker[operation] === 'function') {
        return await fsBroker[operation](payload);
      }
      throw new Error(`Unsupported FS operation: ${operation}`);
    }

    // 2. ROUTE NET CAPABILITIES
    if (capability === CAP_NET) {
      if (operation === 'safeFetch') {
        return await netBroker.safeFetch(payload);
      }
      // Fallback to raw kernel if needed
    }

    // 3. ROUTE PROC CAPABILITIES
    if (capability === CAP_PROC) {
      if (operation === 'executeTask') {
        return await procBroker.executeTask(payload);
      }
      if (operation === 'spawnDaemon') {
        return await procBroker.spawnDaemon(payload);
      }
    }

    // 4. ROUTE CRYPTO CAPABILITIES
    if (capability === CAP_CRYPTO) {
      if (typeof cryptoBroker[operation] === 'function') {
        return await cryptoBroker[operation](payload);
      }
      throw new Error(`Unsupported CRYPTO operation: ${operation}`);
    }

    return await rawKernel.request(capability, operation, payload);
  }
};

module.exports = {
  kernel: enhancedKernel,
  CAP_FS,
  CAP_NET,
  CAP_PROC,
  CAP_CRYPTO,
  CAP_KEYCHAIN
};
