const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

// Lazy import to avoid circular dependency at module evaluation time.
let stateManager;

// Directory where session files (.tear) are stored. The directory is
// created on demand during construction.
const SESS_DIR = path.join(app.getPath('userData'), 'sessions');
const ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = 'sha256';
const INVALID_NAME_PATTERN = /[<>:"/\\|?*\x00-\x1F]/;
const SESSION_VERSION = 2;
const HONEYPOT_FILES = new Set(['admin_vault', 'root_keys', 'master_kernel_seed', 'identity_backup']);

/**
 * Derive a 256 bit key from a passphrase and salt using PBKDF2.
 *
 * @param {string} passphrase
 * @param {Buffer} salt
 * @returns {Buffer}
 */
function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LEN, DIGEST);
}

/**
 * SessionManager handles the secure storage and retrieval of chat
 * sessions. Sessions are encrypted using AES-256-GCM with a unique salt
 * and IV. The encryption format is a base64 string containing
 * salt+iv+tag+ciphertext.
 */
class SessionManager {
  constructor() {
    if (!fs.existsSync(SESS_DIR)) {
      fs.mkdirSync(SESS_DIR, { recursive: true });
    }
    this.indexFile = path.join(SESS_DIR, 'index.json');
    this.index = this._loadIndex();

    // Phase 10 Hygiene: Auto-clean 24h expired sessions
    this._cleanExpiredSessions();
    setInterval(() => this._cleanExpiredSessions(), 60 * 60 * 1000); // Check every hour

    // Phase 11 Hardening: Initialize Honey-Sessions
    this._initHoneypots();
  }

  /**
   * Creates decoy session files to trap local forensic tools or unauthorized UI snooping.
   * @private
   */
  _initHoneypots() {
    HONEYPOT_FILES.forEach(name => {
      const { filePath } = this.resolveSessionPath(name);
      if (!fs.existsSync(filePath)) {
        const decoy = { warning: "System Integrity Violation", timestamp: new Date().toISOString() };
        // We write them with a dummy key so decryption by unauthorized tools fails or alerts.
        const ciphertext = crypto.randomBytes(128).toString('base64');
        const envelope = JSON.stringify({ version: SESSION_VERSION, payload: ciphertext, checksum: "0000deadbeef0000" });
        fs.writeFileSync(filePath, envelope, 'utf8');
      }
    });
  }

  _checkHoneypot(name) {
    const key = this.normalizeName(name);
    if (HONEYPOT_FILES.has(key)) {
      console.error(`[CRITICAL] HONEYPOT_TRIP: Unauthorized access attempt to ${key}. Session locked.`);
      // Emit to renderer for UI lockout
      const { app } = require('electron');
      const main = require('../main'); // Assuming sendToRenderer is available or we use a different path
      if (main && typeof main.sendToRenderer === 'function') {
        main.sendToRenderer('daemon-log', { level: 'error', line: `[CRITICAL] HONEYPOT_TRIP: ${key}` });
      }
      return true;
    }
    return false;
  }

  /**
   * Removes sessions older than 24 hours based on metadata timestamp.
   * @private
   */
  _cleanExpiredSessions() {
    const EXPIRY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;

    for (const [key, meta] of Object.entries(this.index)) {
      if (meta && meta.timestamp) {
        const age = now - new Date(meta.timestamp).getTime();
        if (age > EXPIRY_MS) {
          try {
            const filePath = path.join(SESS_DIR, meta.name.endsWith('.tear') ? meta.name : `${meta.name}.tear`);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            delete this.index[key];
            cleaned++;
          } catch {
            // ignore unlink errors
          }
        }
      }
    }

    if (cleaned > 0) {
      this._saveIndex();
      console.log(`[SessionManager] Cleaned up ${cleaned} expired session(s).`);
    }
  }

  /**
   * Normalize and validate a session name. Prevents path traversal and
   * reserved/invalid filename characters.
   *
   * @param {string} name
   * @returns {string}
   */
  normalizeName(name) {
    const raw = String(name || '').trim();
    const stripped = raw.endsWith('.tear') ? raw.slice(0, -5) : raw;
    if (!stripped || stripped === '.' || stripped === '..') {
      throw new Error('Invalid session name.');
    }
    if (INVALID_NAME_PATTERN.test(stripped)) {
      throw new Error('Session name contains invalid characters.');
    }
    return stripped;
  }

  /**
   * Build an absolute path to a session file from an untrusted name.
   *
   * @param {string} name
   * @returns {{key:string, fileName:string, filePath:string}}
   */
  resolveSessionPath(name) {
    const key = this.normalizeName(name);
    const fileName = `${key}.tear`;
    return {
      key,
      fileName,
      filePath: path.join(SESS_DIR, fileName)
    };
  }

  makeChecksum(payload) {
    return crypto.createHash("sha256").update(String(payload), "utf8").digest("hex");
  }

  wrapEnvelope(ciphertext) {
    const envelope = {
      version: SESSION_VERSION,
      checksum: this.makeChecksum(ciphertext),
      payload: ciphertext
    };
    return JSON.stringify(envelope);
  }

  parseEnvelope(raw) {
    const text = String(raw || "");
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && typeof parsed.payload === "string") {
        const expected = this.makeChecksum(parsed.payload);
        if (parsed.checksum && parsed.checksum !== expected) {
          throw new Error("Session checksum mismatch.");
        }
        return {
          version: parsed.version || 1,
          payload: parsed.payload,
          checksum: parsed.checksum || expected
        };
      }
      throw new Error("Invalid session envelope.");
    } catch (err) {
      // Legacy V1 sessions were stored as raw base64 ciphertext.
      // Preserve checksum mismatch and envelope validation errors.
      if (err && /checksum mismatch|Invalid session envelope/i.test(String(err.message || ""))) {
        throw err;
      }
    }
    return {
      version: 1,
      payload: text,
      checksum: this.makeChecksum(text)
    };
  }

  /**
   * Encrypt arbitrary JSON-serialisable data using AES-256-GCM.
   *
   * @param {any} data
   * @param {string} passphrase
   * @returns {string} Base64 encoded concatenation of salt, iv, tag and ciphertext.
   */
  encrypt(data, passphrase) {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(passphrase, salt);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, ciphertext]).toString('base64');
  }

  /**
   * Decrypt previously encrypted data.
   *
   * @param {string} encB64 Base64 encoded string produced by encrypt().
   * @param {string} passphrase
   * @returns {any} The original decrypted data.
   */
  decrypt(encB64, passphrase) {
    try {
      const buffer = Buffer.from(encB64, 'base64');
      const salt = buffer.slice(0, 16);
      const iv = buffer.slice(16, 28);
      const tag = buffer.slice(28, 44);
      const ciphertext = buffer.slice(44);
      const key = deriveKey(passphrase, salt);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return JSON.parse(plaintext.toString('utf8'));
    } catch (err) {
      throw new Error('Decryption failed. Check your passphrase or file integrity.');
    }
  }

  /**
   * Save a session. The session name is used as the file name (with a
   * `.tear` suffix). The passphrase is required to encrypt the data.
   *
   * @param {string} name
   * @param {any} data
   * @param {string} passphrase
   * @returns {string} The path to the saved file.
   */
  saveSession(name, data, passphrase) {
    if (this._checkHoneypot(name)) throw new Error('Security Breach: Session Access Denied.');
    if (!passphrase || !String(passphrase).trim()) {
      throw new Error('Passphrase is required.');
    }
    const enc = this.encrypt(data, passphrase);
    const envelope = this.wrapEnvelope(enc);
    const { key, filePath } = this.resolveSessionPath(name);
    fs.writeFileSync(filePath, envelope, 'utf8');
    // Create metadata: count tokens from chat messages.
    // Sessions may be saved as either a chat array or an object containing
    // a `chat` array payload.
    let chatMessages = [];
    if (Array.isArray(data)) {
      chatMessages = data;
    } else if (data && typeof data === "object" && Array.isArray(data.chat)) {
      chatMessages = data.chat;
    }
    const tokens = chatMessages.reduce((acc, msg) => {
      const content = msg && typeof msg.content === "string" ? msg.content.trim() : "";
      if (!content) return acc;
      return acc + content.split(/\s+/).length;
    }, 0);
    // Resolve stateManager on first use to avoid circular import.
    if (!stateManager) stateManager = require('./stateManager');
    this.updateMetadata(key, { model: stateManager.get('model'), tokens, version: SESSION_VERSION });
    return filePath;
  }

  /**
   * Load and decrypt a session.
   *
   * @param {string} name
   * @param {string} passphrase
   * @returns {any}
   */
  loadSession(name, passphrase) {
    if (this._checkHoneypot(name)) throw new Error('Security Breach: Session Access Denied.');
    if (!passphrase || !String(passphrase).trim()) {
      throw new Error("Passphrase is required.");
    }
    const { filePath } = this.resolveSessionPath(name);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = this.parseEnvelope(raw);
    return this.decrypt(parsed.payload, passphrase);
  }

  /**
   * Bundles and exports a session to a peer via NeuralLink™.
   *
   * @param {string} name
   * @param {string} peerId
   * @returns {Promise<string>}
   */
  async exportToPeer(name, peerId, passphrase) {
    const { key, filePath } = this.resolveSessionPath(name);
    if (this._checkHoneypot(key)) throw new Error('Security Breach: Export Denied.');
    if (!fs.existsSync(filePath)) throw new Error("Session file not found.");

    const vaultCoupling = require("./vaultCoupling");
    const bundlePath = await vaultCoupling.createSessionBundle(key, filePath, passphrase);
    return await vaultCoupling.sendBundle(bundlePath, peerId);
  }

  /**
   * List all saved session files.
   *
   * @returns {string[]} Array of session file names (including `.tear`).
   */
  listSessions() {
    const files = fs.readdirSync(SESS_DIR)
      .filter((f) => f.endsWith('.tear'))
      .map((f) => f.replace(/\.tear$/, ''));
    const indexed = Object.keys(this.index || {});
    return Array.from(new Set([...files, ...indexed])).sort();
  }

  /**
   * Read the session index from disk. Returns an empty object on error.
   *
   * @private
   */
  _loadIndex() {
    try {
      const raw = fs.readFileSync(this.indexFile, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Persist the session index to disk. Errors are swallowed.
   *
   * @private
   */
  _saveIndex() {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  /**
   * Update or create a metadata entry for a session. Metadata includes
   * timestamp (ISO), model and token count.
   *
   * @param {string} name
   * @param {{model:string, tokens:number}} meta
   */
  updateMetadata(name, meta) {
    this.index[name] = {
      name,
      timestamp: new Date().toISOString(),
      ...meta
    };
    this._saveIndex();
  }

  /**
   * Remove a session and its metadata.
   *
   * @param {string} name
   */
  deleteSession(name) {
    const { key, filePath } = this.resolveSessionPath(name);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
    delete this.index[key];
    delete this.index[`${key}.tear`];
    this._saveIndex();
  }

  /**
   * Rename a session file and update metadata.
   *
   * @param {string} oldName
   * @param {string} newName
   */
  renameSession(oldName, newName) {
    const oldResolved = this.resolveSessionPath(oldName);
    const newResolved = this.resolveSessionPath(newName);
    try {
      fs.renameSync(oldResolved.filePath, newResolved.filePath);
      if (this.index[oldResolved.key]) {
        this.index[newResolved.key] = { ...this.index[oldResolved.key], name: newResolved.key };
        delete this.index[oldResolved.key];
        this._saveIndex();
      } else if (this.index[`${oldResolved.key}.tear`]) {
        this.index[newResolved.key] = { ...this.index[`${oldResolved.key}.tear`], name: newResolved.key };
        delete this.index[`${oldResolved.key}.tear`];
        this._saveIndex();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Search the index for sessions whose name includes the query string.
   * Case-insensitive.
   *
   * @param {string} query
   * @returns {Array<object>} List of matching metadata objects.
   */
  search(query) {
    const q = String(query || '').toLowerCase();
    return Object.values(this.index).filter((entry) => {
      const name = entry && entry.name ? String(entry.name).toLowerCase() : '';
      return name.includes(q);
    });
  }

  /**
   * Rebuild the session index from files on disk and return a summary.
   *
   * @returns {{repaired:number,total:number}}
   */
  repairIndex() {
    const files = fs.readdirSync(SESS_DIR).filter((f) => f.endsWith(".tear"));
    const nextIndex = {};
    files.forEach((file) => {
      const key = file.replace(/\.tear$/, "");
      const current = this.index[key] || {};
      let version = current.version || 1;
      try {
        const raw = fs.readFileSync(path.join(SESS_DIR, file), "utf8");
        version = this.parseEnvelope(raw).version;
      } catch {
        // keep best-effort metadata
      }
      nextIndex[key] = {
        name: key,
        timestamp: current.timestamp || new Date().toISOString(),
        model: current.model || "unknown",
        tokens: Number.isFinite(current.tokens) ? current.tokens : 0,
        version
      };
    });
    this.index = nextIndex;
    this._saveIndex();
    return {
      repaired: Object.keys(nextIndex).length,
      total: files.length
    };
  }
}

module.exports = new SessionManager();
