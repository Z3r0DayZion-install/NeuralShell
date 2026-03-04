const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');
const { createKernel, CAP_FS, CAP_NET, CAP_PROC, CAP_CRYPTO, CAP_KEYCHAIN } = require('@neural/omega-core');

/**
 * NeuralShell Kernel Initialization
 * Plugs NeuralShell configuration into OMEGA Core.
 */

const SHA256_HEX = /^[a-f0-9]{64}$/;

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeTaskEnvSuffix(taskId) {
  return taskId.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function resolveTaskRegistry() {
  const defaultOllamaPath = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe')
    : (process.env.NEURALSHELL_OLLAMA_PATH || '');

  const specs = {
    'neural-link:devices': {
      path: path.join(__dirname, '../../bin/neural-link.exe'),
      args: ['devices']
    },
    'neural-link:send': {
      path: path.join(__dirname, '../../bin/neural-link.exe'),
      args: ['send']
    },
    'neural-linkd:start': {
      path: path.join(__dirname, '../../bin/neural-linkd.exe'),
      args: []
    },
    'ollama:list': {
      path: defaultOllamaPath,
      args: ['list']
    }
  };

  const registry = {};
  for (const [taskId, spec] of Object.entries(specs)) {
    if (!spec.path || !path.isAbsolute(spec.path) || !fs.existsSync(spec.path)) {
      continue;
    }
    const envKey = `NEURALSHELL_TASK_HASH_${normalizeTaskEnvSuffix(taskId)}`;
    const expectedHash = String(process.env[envKey] || '').trim().toLowerCase();
    if (!SHA256_HEX.test(expectedHash)) {
      continue;
    }
    if (sha256File(spec.path) !== expectedHash) {
      continue;
    }
    registry[taskId] = {
      path: spec.path,
      args: spec.args,
      hash: expectedHash
    };
  }
  return registry;
}

function parsePinnedKeys(envValue) {
  return String(envValue || '')
    .split(',')
    .map((pin) => pin.trim())
    .filter((pin) => /^sha256\/[A-Za-z0-9+/=]+$/.test(pin));
}

function resolvePinnedKeys() {
  const pinnedKeys = new Map();
  const updatePins = parsePinnedKeys(process.env.NEURALSHELL_UPDATES_TLS_PINS);
  if (updatePins.length > 0) {
    pinnedKeys.set('updates.neuralshell.app', updatePins);
  }
  return pinnedKeys;
}

const kernelConfig = {
  fs: {
    readOnlyRoot: app.getAppPath(),
    writeRoot: app.getPath('userData'),
    pathResolver: (name) => app.getPath(name)
  },
  network: {
    pinnedKeys: resolvePinnedKeys(),
    maxResponseSize: 5 * 1024 * 1024,
    timeoutMs: 15000
  },
  execution: {
    taskRegistry: resolveTaskRegistry()
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
