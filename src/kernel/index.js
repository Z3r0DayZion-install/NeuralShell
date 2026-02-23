/**
 * NeuralShell Kernel Broker
 * Mediates all restricted operations via Capability Tokens.
 */

import { CAP_EXEC, CAP_FS, CAP_NET, CAP_CRYPTO, CAP_UI } from './tokens.js';
import * as execution from './execution.js';
import * as filesystem from './filesystem.js';
import { safeFetch } from './network.js';
import * as crypto from './crypto.js';
import * as intentParser from './intentParser.js';

const Broker = (function() {
  const interfaceMap = new Map([
    [CAP_EXEC, execution.executeTask],
    [CAP_FS, filesystem.atomicRead],
    [CAP_NET, safeFetch],
    [CAP_CRYPTO, {
      encrypt: crypto.encryptVault,
      decrypt: crypto.decryptVault
    }],
    [CAP_UI, {
      parseIntent: intentParser.parseIntent
    }]
  ]);

  return Object.freeze({
    request: async (token, action, ...args) => {
      if (!interfaceMap.has(token)) throw new Error("ERR_INVALID_CAPABILITY_TOKEN");
      const target = interfaceMap.get(token);
      
      if (typeof target === 'function') {
        return await target(action, ...args);
      }
      
      if (target[action]) {
        return await target[action](...args);
      }
      
      throw new Error(`ERR_INVALID_ACTION: ${String(action)}`);
    }
  });
})();

export default Broker;
