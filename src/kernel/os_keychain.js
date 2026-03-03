const { safeStorage } = require('electron');

/**
 * NeuralShell OS Keychain Broker — Phase 3
 * 
 * Uses Electron's safeStorage to encrypt/decrypt secrets using
 * OS-level protection (DPAPI on Windows, Keychain on macOS, libsecret on Linux).
 */

class OSKeychainBroker {
  async encrypt(payload) {
    const { data } = payload;
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS Encryption not available on this system.');
    }
    const buffer = safeStorage.encryptString(data);
    return buffer.toString('base64');
  }

  async decrypt(payload) {
    const { data } = payload;
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS Encryption not available on this system.');
    }
    const buffer = Buffer.from(data, 'base64');
    return safeStorage.decryptString(buffer);
  }
}

module.exports = new OSKeychainBroker();
