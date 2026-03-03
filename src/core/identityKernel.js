"use strict";

/**
 * IdentityKernel — Phase 4/5: Identity Layer + Hardware-Bound Key Storage
 * 
 * REFACTORED: Refactored to use KernelBroker for all privileged operations.
 */

const { kernel, CAP_FS, CAP_PROC, CAP_CRYPTO, CAP_KEYCHAIN } = require("../kernel");
const path = require("path");

const HW_SALT = "neurallink-identity-hw-v1";

class IdentityKernel {
    constructor() {
        this._privateKey = null;
        this._publicKey = null;
        this._trustStore = {};
        this._wrappingKey = null;
        this._paths = {};
    }

    async init() {
        const userData = await kernel.request(CAP_FS, 'getPath', { name: 'userData' });
        this._paths.trustStore = path.join(userData, "identity-trust-store.json");
        this._paths.keyStore = path.join(userData, "identity.key.json");

        const fp = await this._getHardwareFingerprint();
        this._wrappingKey = await kernel.request(CAP_CRYPTO, 'pbkdf2', { 
            password: fp, 
            salt: HW_SALT, 
            iterations: 100000, 
            keylen: 32 
        });

        const exists = await kernel.request(CAP_FS, 'exists', { filePath: this._paths.keyStore });
        if (exists) {
            try {
                const rawContent = await kernel.request(CAP_FS, 'readFile', { filePath: this._paths.keyStore });
                const raw = JSON.parse(rawContent);

                let privateKeyPem;
                if (raw.enc) {
                    privateKeyPem = await this._decryptPem(raw, this._wrappingKey);
                } else if (raw.osEnc) {
                    privateKeyPem = await kernel.request(CAP_KEYCHAIN, 'decrypt', { data: raw.osEnc });
                } else {
                    throw new Error("Unrecognized key format");
                }

                this._privateKey = privateKeyPem;
                const keyPair = await kernel.request(CAP_CRYPTO, 'generateKeyPair', { 
                    algorithm: 'ec', 
                    options: { namedCurve: 'prime256v1' } 
                });
                this._publicKey = keyPair.publicKey; 
            } catch (err) {
                console.error("[IdentityKernel] Key load failed, regenerating:", err.message);
                await this._generate();
            }
        } else {
            await this._generate();
        }

        const trustExists = await kernel.request(CAP_FS, 'exists', { filePath: this._paths.trustStore });
        if (trustExists) {
            try {
                const content = await kernel.request(CAP_FS, 'readFile', { filePath: this._paths.trustStore });
                this._trustStore = JSON.parse(content);
            } catch {
                this._trustStore = {};
            }
        }
    }

    async _getHardwareFingerprint() {
        try {
            const cpu = await kernel.request(CAP_PROC, 'execute', { command: 'wmic', args: ['cpu', 'get', 'ProcessorId', '/value'] });
            const board = await kernel.request(CAP_PROC, 'execute', { command: 'wmic', args: ['baseboard', 'get', 'SerialNumber', '/value'] });
            
            const fingerprint = `${cpu.trim()}|${board.trim()}`;
            return await kernel.request(CAP_CRYPTO, 'hash', { data: fingerprint });
        } catch {
            const userData = await kernel.request(CAP_FS, 'getPath', { name: 'userData' });
            return await kernel.request(CAP_CRYPTO, 'hash', { data: userData });
        }
    }

    async _generate() {
        const { privateKey, publicKey } = await kernel.request(CAP_CRYPTO, 'generateKeyPair', {
            algorithm: 'ec',
            options: { namedCurve: 'prime256v1' }
        });
        this._privateKey = privateKey;
        this._publicKey = publicKey;
        await this._saveKey(privateKey);
    }

    async _saveKey(privateKeyPem) {
        let wrapped;
        try {
            // Try OS-level hardware binding first (Phase 3)
            const osEnc = await kernel.request(CAP_KEYCHAIN, 'encrypt', { data: privateKeyPem });
            wrapped = { osEnc, createdAt: new Date().toISOString(), hwBound: true, method: 'os_keychain' };
        } catch (err) {
            // Fallback to manual fingerprint binding
            wrapped = await this._encryptPem(privateKeyPem, this._wrappingKey);
            wrapped.createdAt = new Date().toISOString();
            wrapped.hwBound = true;
            wrapped.method = 'fingerprint';
        }
        
        await kernel.request(CAP_FS, 'writeFile', { 
            filePath: this._paths.keyStore, 
            data: JSON.stringify(wrapped, null, 2) 
        });
    }

    async _encryptPem(pem, keyHex) {
        const iv = (await kernel.request(CAP_CRYPTO, 'hash', { data: Math.random().toString() })).slice(0, 24);
        const res = await kernel.request(CAP_CRYPTO, 'encrypt', {
            key: keyHex,
            iv: iv,
            data: pem
        });
        return {
            enc: res.data,
            iv: iv,
            tag: res.tag,
            alg: "aes-256-gcm"
        };
    }

    async _decryptPem(stored, keyHex) {
        return await kernel.request(CAP_CRYPTO, 'decrypt', {
            key: keyHex,
            iv: stored.iv,
            data: stored.enc,
            tag: stored.tag
        });
    }

    getPublicKeyPem() {
        return this._publicKey;
    }

    async getFingerprint() {
        const hash = await kernel.request(CAP_CRYPTO, 'hash', { data: this._publicKey });
        return hash.toUpperCase().match(/.{2}/g).slice(0, 8).join(":");
    }

    async sign(data) {
        return await kernel.request(CAP_CRYPTO, 'sign', { data, privateKey: this._privateKey });
    }

    async verify(data, signature, pubKeyPem) {
        return await kernel.request(CAP_CRYPTO, 'verify', { data, signature, publicKey: pubKeyPem });
    }

    async trustPeer(deviceId, pubKeyPem, label = "") {
        this._trustStore[deviceId] = { pubKeyPem, label, addedAt: new Date().toISOString() };
        await this._saveTrustStore();
        return true;
    }

    async _saveTrustStore() {
        await kernel.request(CAP_FS, 'writeFile', { 
            filePath: this._paths.trustStore, 
            data: JSON.stringify(this._trustStore, null, 2) 
        });
    }
}

module.exports = new IdentityKernel();
