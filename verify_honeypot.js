const path = require('path');
const os = require('os');
const Module = require('module');

// Mock Electron before requiring sessionManager
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
    if (request === 'electron') {
        return {
            app: {
                getAppPath: () => __dirname,
                getPath: (name) => {
                    if (name === 'userData') return path.join(os.homedir(), 'AppData', 'Roaming', 'neuralshell-v5');
                    return __dirname;
                }
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

const sessionManager = require('./src/core/sessionManager');

// Override the require in sessionManager briefly for testing
// or just call the internal _checkHoneypot directly if possible.
console.log("--- Triggering Honey-Session Trip: admin_vault ---");
try {
    sessionManager.loadSession('admin_vault', 'any_passphrase');
} catch (e) {
    console.log("Caught expected error:", e.message);
}

console.log("\n--- Triggering Normal Session: valid_test (Should NOT trip) ---");
try {
    // This will fail because file doesn't exist, but it shouldn't trip the honeypot
    sessionManager.loadSession('valid_test', 'any');
} catch (e) {
    if (e.message.includes('Security Breach')) {
        console.error("FAIL: Normal session tripped honeypot!");
    } else {
        console.log("Normal behavior: File not found or decryption failed.");
    }
}
