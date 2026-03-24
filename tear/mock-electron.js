const path = require("node:path");
const os = require("node:os");

/**
 * Phase 13: mock-electron.js
 * 
 * Provides a minimal mock of the 'electron' module to allow Node-based tests 
 * to load modules that require('electron') at the top level.
 */

const userDataPath = process.env.NEURAL_USER_DATA_DIR || path.join(os.tmpdir(), "ns-test-userData");

const mockElectron = {
    app: {
        getAppPath: () => process.cwd(),
        getPath: (name) => {
            if (name === "userData") return userDataPath;
            return path.join(userDataPath, name);
        }
    },
    safeStorage: {
        isEncryptionAvailable: () => false,
        encryptString: (s) => Buffer.from(s),
        decryptString: (b) => b.toString()
    }
};

// Inject into require cache
require.cache[require.resolve("electron")] = {
    id: require.resolve("electron"),
    exports: mockElectron,
    loaded: true
};

module.exports = mockElectron;
