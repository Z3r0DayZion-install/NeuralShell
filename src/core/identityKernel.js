"use strict";

/**
 * IdentityKernel — Phase 4/5: Identity Layer + Hardware-Bound Key Storage
 *
 * Manages a persistent ECDSA P-256 keypair for this device.
 * Signs and verifies data payloads to establish trust across the Sovereign Mesh.
 *
 * Phase 5 upgrade: The private key is AES-256-GCM wrapped using a key derived
 * from a hardware fingerprint (CPU + motherboard serial). Copying identity.key.json
 * to another machine renders it undecryptable — the key is tethered to this hardware.
 */

const crypto = require("crypto");
const { app } = require("electron");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const TRUST_STORE_PATH = path.join(app.getPath("userData"), "identity-trust-store.json");
const KEY_STORE_PATH = path.join(app.getPath("userData"), "identity.key.json");
const HW_SALT = "neurallink-identity-hw-v1";

// ---------------------------------------------------------------
// Hardware fingerprinting  (Windows — falls back gracefully)
// ---------------------------------------------------------------

function _queryWmic(path, field) {
    try {
        const out = execSync(`wmic ${path} get ${field} /value`, { timeout: 3000 })
            .toString()
            .split("\n")
            .find(l => l.startsWith(`${field}=`));
        return (out || "").split("=")[1]?.trim() || "";
    } catch {
        return "";
    }
}

/**
 * Collects immutable hardware identifiers and returns a stable fingerprint string.
 * On non-Windows or if wmic is unavailable, falls back to a deterministic hostname
 * + userData path hash so the system still starts (degraded portability protection).
 */
function _getHardwareFingerprint() {
    const cpu = _queryWmic("cpu", "ProcessorId");
    const board = _queryWmic("baseboard", "SerialNumber");
    const bios = _queryWmic("bios", "SerialNumber");

    // At least one must be non-empty for real hardware binding
    if (!cpu && !board && !bios) {
        // Fallback: derive from machine-specific userData path — weaker but non-empty
        const fallback = app.getPath("userData") + require("os").hostname();
        return crypto.createHash("sha256").update(fallback).digest("hex");
    }
    return crypto.createHash("sha256").update(`${cpu}|${board}|${bios}`).digest("hex");
}

/**
 * Derive a 32-byte AES wrapping key from the hardware fingerprint.
 * Uses PBKDF2-SHA256 with a fixed salt — iterations are low because
 * the fingerprint itself is high entropy; this just ensures uniform key length.
 */
function _deriveWrappingKey(fingerprint) {
    return crypto.pbkdf2Sync(fingerprint, HW_SALT, 100_000, 32, "sha256");
}

// ---------------------------------------------------------------
// Encrypt / Decrypt PEM at rest
// ---------------------------------------------------------------

function _encryptPem(pemString, wrappingKey) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", wrappingKey, iv);
    const enc = Buffer.concat([cipher.update(pemString, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        enc: enc.toString("base64"),
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        alg: "aes-256-gcm"
    };
}

function _decryptPem(stored, wrappingKey) {
    const iv = Buffer.from(stored.iv, "base64");
    const tag = Buffer.from(stored.tag, "base64");
    const enc = Buffer.from(stored.enc, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", wrappingKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ---------------------------------------------------------------
// IdentityKernel class
// ---------------------------------------------------------------

class IdentityKernel {
    constructor() {
        this._privateKey = null;
        this._publicKey = null;
        this._trustStore = {};
        this._wrappingKey = null; // cached for rotate()
    }

    // ---------------------------------------------------------------
    // Boot
    // ---------------------------------------------------------------

    init() {
        const fp = _getHardwareFingerprint();
        this._wrappingKey = _deriveWrappingKey(fp);

        if (fs.existsSync(KEY_STORE_PATH)) {
            try {
                const raw = JSON.parse(fs.readFileSync(KEY_STORE_PATH, "utf8"));

                let privateKeyPem;
                if (raw.enc) {
                    // Phase 5 format: hardware-wrapped
                    privateKeyPem = _decryptPem(raw, this._wrappingKey);
                } else if (raw.privateKeyPem) {
                    // Legacy plaintext format — re-encrypt immediately
                    privateKeyPem = raw.privateKeyPem;
                    this._saveKey(privateKeyPem);
                } else {
                    throw new Error("Unrecognized key format");
                }

                this._privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: "pem" });
                this._publicKey = crypto.createPublicKey(this._privateKey);
            } catch (err) {
                // Corrupt or hardware-mismatched — regenerate
                console.error("[IdentityKernel] Key load failed, regenerating:", err.message);
                this._generate();
            }
        } else {
            this._generate();
        }

        // Load trust store
        if (fs.existsSync(TRUST_STORE_PATH)) {
            try {
                this._trustStore = JSON.parse(fs.readFileSync(TRUST_STORE_PATH, "utf8"));
            } catch {
                this._trustStore = {};
            }
        }
    }

    _generate() {
        const { privateKey: privPem, publicKey } = crypto.generateKeyPairSync("ec", {
            namedCurve: "prime256v1",
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
            publicKeyEncoding: { type: "spki", format: "pem" }
        });
        this._saveKey(privPem);
        this._privateKey = crypto.createPrivateKey({ key: privPem, format: "pem" });
        this._publicKey = crypto.createPublicKey({ key: publicKey, format: "pem" });
    }

    /**
     * Encrypts the private key PEM with the hardware wrapping key and writes to disk.
     * @param {string} privateKeyPem
     */
    _saveKey(privateKeyPem) {
        const wrapped = _encryptPem(privateKeyPem, this._wrappingKey);
        wrapped.createdAt = new Date().toISOString();
        wrapped.hwBound = true;
        fs.writeFileSync(KEY_STORE_PATH, JSON.stringify(wrapped, null, 2), { mode: 0o600 });
    }

    // ---------------------------------------------------------------
    // Public-key access
    // ---------------------------------------------------------------

    getPublicKeyPem() {
        return this._publicKey.export({ type: "spki", format: "pem" });
    }

    getFingerprint() {
        const pem = this.getPublicKeyPem();
        const hash = crypto.createHash("sha256").update(pem).digest("hex").toUpperCase();
        return hash.match(/.{2}/g).slice(0, 8).join(":");
    }

    // ---------------------------------------------------------------
    // Sign / Verify
    // ---------------------------------------------------------------

    sign(data) {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), "utf8");
        return crypto.sign("sha256", buf, this._privateKey).toString("base64");
    }

    verify(data, signatureB64, pubKeyPem) {
        try {
            const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), "utf8");
            const sig = Buffer.from(signatureB64, "base64");
            const pubKey = crypto.createPublicKey({ key: pubKeyPem, format: "pem" });
            return crypto.verify("sha256", buf, pubKey, sig);
        } catch {
            return false;
        }
    }

    // ---------------------------------------------------------------
    // Trust store
    // ---------------------------------------------------------------

    trustPeer(deviceId, pubKeyPem, label = "") {
        if (!deviceId || !pubKeyPem) throw new Error("deviceId and pubKeyPem are required.");
        this._trustStore[deviceId] = {
            pubKeyPem,
            label: String(label || deviceId),
            addedAt: new Date().toISOString()
        };
        this._saveTrustStore();
        return true;
    }

    revokePeer(deviceId) {
        delete this._trustStore[deviceId];
        this._saveTrustStore();
        return true;
    }

    listPeers() {
        return Object.entries(this._trustStore).map(([deviceId, entry]) => ({
            deviceId,
            label: entry.label,
            addedAt: entry.addedAt,
            fingerprint: (() => {
                try {
                    const hash = crypto.createHash("sha256").update(entry.pubKeyPem).digest("hex").toUpperCase();
                    return hash.match(/.{2}/g).slice(0, 8).join(":");
                } catch { return "unknown"; }
            })()
        }));
    }

    getPeerPublicKey(deviceId) {
        return this._trustStore[deviceId]?.pubKeyPem ?? null;
    }

    isTrustedKey(pubKeyPem) {
        return Object.values(this._trustStore).some(e => e.pubKeyPem.trim() === pubKeyPem.trim());
    }

    rotate() {
        this._generate();
        return { fingerprint: this.getFingerprint(), rotatedAt: new Date().toISOString() };
    }

    _saveTrustStore() {
        fs.writeFileSync(TRUST_STORE_PATH, JSON.stringify(this._trustStore, null, 2), { mode: 0o600 });
    }
}

module.exports = new IdentityKernel();
