"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");
const secretVault = require("./secretVault");
const identityKernel = require("./identityKernel");

/**
 * VaultBundler handles the creation of encrypted "Sovereign Bundles"
 * for secure transport across the NeuralLink™ mesh.
 */
class VaultBundler {
    constructor() {
        this.bundleDir = path.join(path.dirname(secretVault.filePath), "bundles");
        if (!fs.existsSync(this.bundleDir)) {
            fs.mkdirSync(this.bundleDir, { recursive: true });
        }
    }

    /**
     * Creates a signed, encrypted bundle of a session file.
     * If a passphrase is provided, the session is decrypted first so the bundle
     * contains the verified plaintext (ownership handover prep).
     * @param {string} sessionName 
     * @param {string} sessionPath 
     * @param {string} [passphrase]
     * @returns {Promise<string>} Path to the generated .nlb (NeuralLink Bundle)
     */
    async createSessionBundle(sessionName, sessionPath, passphrase) {
        let payload;
        if (passphrase) {
            const sessionManager = require("./sessionManager");
            const data = sessionManager.loadSession(sessionName, passphrase);
            // We bundle the JSON string of the chat data
            payload = JSON.stringify(data);
        } else {
            // Legacy / No-handover: just bundle the raw .tear file (still encrypted with sender's key)
            payload = fs.readFileSync(sessionPath, "utf8");
        }

        const bundleId = crypto.randomBytes(8).toString("hex");
        const bundlePath = path.join(this.bundleDir, `${sessionName}_${bundleId}.nlb`);

        // ECDSA P-256 signature over the payload (Phase 4: Identity Layer)
        const signature = identityKernel.sign(payload);
        const senderPubKey = identityKernel.getPublicKeyPem();

        const manifest = {
            id: bundleId,
            type: "session",
            name: sessionName,
            timestamp: new Date().toISOString(),
            algo: "ecdsa-p256-sha256",
            senderPubKey,
            signature,
            isPlaintext: !!passphrase // Flag for the recipient
        };

        const bundleContent = JSON.stringify(manifest) + "\n" + payload;
        fs.writeFileSync(bundlePath, bundleContent, "utf8");

        return bundlePath;
    }

    /**
     * Triggers the NeuralLink transport CLI for a specific bundle.
     * @param {string} bundlePath 
     * @param {string} peerId 
     */
    async sendBundle(bundlePath, peerId) {
        return new Promise((resolve, reject) => {
            // Using the CLI path from previous context
            const CLI_PATH = "neural-link.exe";
            exec(`${CLI_PATH} send "${bundlePath}" --to ${peerId}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    /**
     * Verifies a bundle and imports it into the local session manager.
     * If the bundle is plaintext and a targetPassphrase is provided, it re-encrypts.
     * @param {string} bundlePath 
     * @param {string} [targetPassphrase]
     * @returns {Promise<object>} Result of the import
     */
    async verifyAndImportSession(bundlePath, targetPassphrase) {
        const content = fs.readFileSync(bundlePath, "utf8");
        const lines = content.split("\n");
        if (lines.length < 2) throw new Error("Invalid bundle format.");

        const manifest = JSON.parse(lines[0]);
        const payload = lines.slice(1).join("\n");

        // Phase 4: ECDSA verification
        if (!manifest.senderPubKey || !manifest.signature) {
            throw new Error("Bundle missing identity fields — produced by an older version.");
        }

        // Trust gate: sender must be in the local trust store OR be self (local key)
        const isSelf = manifest.senderPubKey.trim() === identityKernel.getPublicKeyPem().trim();
        if (!isSelf && !identityKernel.isTrustedKey(manifest.senderPubKey)) {
            throw new Error("Sovereign Integrity Check Failed: Sender is not trusted.");
        }

        // Cryptographic signature check
        const sigValid = identityKernel.verify(payload, manifest.signature, manifest.senderPubKey);
        if (!sigValid) {
            throw new Error("Sovereign Integrity Check Failed: Signature mismatch.");
        }

        const sessionManager = require("./sessionManager");
        const importName = `${manifest.name}_imported`;

        if (manifest.isPlaintext && targetPassphrase) {
            // HIGH LEVERAGE: Re-encrypt for the local vault
            const data = JSON.parse(payload);
            sessionManager.saveSession(importName, data, targetPassphrase);
        } else {
            // Fallback: save raw payload as .tear (recipient still needs sender's original passphrase)
            const targetPath = sessionManager.resolveSessionPath(importName).filePath;
            fs.writeFileSync(targetPath, payload, "utf8");
            sessionManager.repairIndex();
        }

        return {
            ok: true,
            name: manifest.name,
            id: manifest.id,
            reEncrypted: !!(manifest.isPlaintext && targetPassphrase)
        };
    }
}

module.exports = new VaultBundler();
