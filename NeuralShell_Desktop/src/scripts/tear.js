(function initTear(globalObj) {
  "use strict";

  function bytesToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function sha256Hex(text) {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function deriveKeys(password, saltBytes) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
      baseKey,
      512
    );
    const m = new Uint8Array(bits);
    const aesKey = await crypto.subtle.importKey("raw", m.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"]);
    const hmacKey = await crypto.subtle.importKey("raw", m.slice(32, 64), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    return { aesKey, hmacKey };
  }

  async function encryptPayload(payloadText, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const { aesKey, hmacKey } = await deriveKeys(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(payloadText));
    const payloadEnc = bytesToBase64(encrypted);
    const saltB64 = bytesToBase64(salt);
    const ivB64 = bytesToBase64(iv);
    const sigRaw = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(`${saltB64}.${ivB64}.${payloadEnc}`));
    return {
      payloadEnc,
      crypto: {
        alg: "AES-GCM-256+HMAC-SHA256",
        kdf: "PBKDF2",
        iterations: 210000,
        salt: saltB64,
        iv: ivB64,
        signature: bytesToBase64(sigRaw)
      },
      integrity: {
        alg: "SHA-256",
        payloadHash: await sha256Hex(payloadText),
        payloadLength: payloadText.length
      }
    };
  }

  async function decryptEnvelope(envelope, password) {
    const salt = base64ToBytes(envelope.crypto.salt);
    const iv = base64ToBytes(envelope.crypto.iv);
    const cipher = base64ToBytes(envelope.payloadEnc);
    const signature = base64ToBytes(envelope.crypto.signature);
    const { aesKey, hmacKey } = await deriveKeys(password, salt);
    const signed = `${envelope.crypto.salt}.${envelope.crypto.iv}.${envelope.payloadEnc}`;
    const ok = await crypto.subtle.verify("HMAC", hmacKey, signature, new TextEncoder().encode(signed));
    if (!ok) throw new Error("TEAR signature check failed");
    const plainRaw = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, cipher);
    const payloadText = new TextDecoder().decode(plainRaw);
    if (envelope.integrity?.payloadHash) {
      const digest = await sha256Hex(payloadText);
      if (digest !== envelope.integrity.payloadHash) throw new Error("TEAR payload hash mismatch");
    }
    return payloadText;
  }

  async function createEnvelope(payloadObj, secret, hint = "") {
    const payloadText = JSON.stringify(payloadObj);
    if (secret) {
      const encrypted = await encryptPayload(payloadText, secret);
      return {
        format: "TEAR",
        version: "2.1.0",
        exportedAt: new Date().toISOString(),
        app: "NeuralShell Desktop",
        encrypted: true,
        hint: hint || "",
        payloadEnc: encrypted.payloadEnc,
        crypto: encrypted.crypto,
        integrity: encrypted.integrity
      };
    }
    return {
      format: "TEAR",
      version: "2.1.0",
      exportedAt: new Date().toISOString(),
      app: "NeuralShell Desktop",
      encrypted: false,
      hint: hint || "",
      payload: payloadObj,
      integrity: {
        alg: "SHA-256",
        payloadHash: await sha256Hex(payloadText),
        payloadLength: payloadText.length
      }
    };
  }

  async function parseEnvelope(envelope, secret) {
    if (!envelope || envelope.format !== "TEAR") return envelope;
    if (envelope.encrypted) {
      if (!secret) throw new Error("TEAR secret required");
      const text = await decryptEnvelope(envelope, secret);
      return JSON.parse(text);
    }
    if (envelope.integrity?.payloadHash) {
      const digest = await sha256Hex(JSON.stringify(envelope.payload));
      if (digest !== envelope.integrity.payloadHash) throw new Error("TEAR payload hash mismatch");
    }
    return envelope.payload;
  }

  globalObj.NeuralTear = { createEnvelope, parseEnvelope };
})(window);
