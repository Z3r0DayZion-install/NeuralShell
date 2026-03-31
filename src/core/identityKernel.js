const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { kernel, CAP_PROC } = require("../kernel");

const IDENTITY_ENVELOPE_PREFIX = "omega-id-v2";
const IDENTITY_ENVELOPE_AAD = Buffer.from("NeuralShell.identity.v2", "utf8");
const PEER_STORE_PREFIX = "omega-peers-v1";
const PEER_STORE_AAD = Buffer.from("NeuralShell.peers.v1", "utf8");

let keyPair = null;
let hardwareFingerprint = null;
const peers = new Map();

/**
 * Get audit chain instance if available.
 * @returns {Object|null} Audit chain instance or null
 */
function getAuditChain() {
  try {
    const auditChain = require('./auditChain');
    return auditChain;
  } catch {
    return null;
  }
}

function getIdentityPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "identity.omega");
    }
  } catch {
    // Electron may be unavailable in tests and CLI scripts.
  }
  return path.join(process.cwd(), "identity.omega");
}

function getPeerStorePath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "trusted-peers.omega");
    }
  } catch {
    // Electron may be unavailable in tests and CLI scripts.
  }
  return path.join(process.cwd(), "trusted-peers.omega");
}

/**
 * Parse IOPlatformSerialNumber from ioreg output.
 * @param {string} output - Raw ioreg output
 * @returns {string} Trimmed serial number or empty string
 */
function parseIOPlatformSerialNumber(output) {
  const match = output.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

/**
 * Parse IOPlatformUUID from ioreg output.
 * @param {string} output - Raw ioreg output
 * @returns {string} Trimmed UUID or empty string
 */
function parseIOPlatformUUID(output) {
  const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

/**
 * Parse Serial Number from system_profiler output.
 * @param {string} output - Raw system_profiler output
 * @returns {string} Trimmed serial number or empty string
 */
function parseSystemProfilerSerial(output) {
  const match = output.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
  return match ? match[1].trim() : '';
}

/**
 * Extract macOS hardware identifiers via IOKit and system_profiler.
 * @returns {Promise<string>} 64-character hex SHA-256 hash
 */
async function getMacOSHardwareId() {
  const auditChain = getAuditChain();
  let platformSerial = '';
  let hardwareUUID = '';
  
  // Step 1: Try ioreg for IOPlatformSerialNumber
  try {
    const serialOutput = await kernel.request(CAP_PROC, 'execute', {
      command: 'ioreg',
      args: ['-l']
    });
    platformSerial = parseIOPlatformSerialNumber(serialOutput);
  } catch (err) {
    if (auditChain) {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'warning',
        method: 'ioreg-serial',
        message: `ioreg serial extraction failed: ${err.message}`
      });
    }
  }
  
  // Step 2: Try ioreg for IOPlatformUUID
  try {
    const uuidOutput = await kernel.request(CAP_PROC, 'execute', {
      command: 'ioreg',
      args: ['-rd1', '-c', 'IOPlatformExpertDevice']
    });
    hardwareUUID = parseIOPlatformUUID(uuidOutput);
  } catch (err) {
    if (auditChain) {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'warning',
        method: 'ioreg-uuid',
        message: `ioreg UUID extraction failed: ${err.message}`
      });
    }
  }
  
  // Step 3: Fallback to system_profiler if serial is missing
  if (!platformSerial) {
    try {
      const profilerOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'system_profiler',
        args: ['SPHardwareDataType']
      });
      platformSerial = parseSystemProfilerSerial(profilerOutput);
      
      if (platformSerial && auditChain) {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'darwin',
          status: 'info',
          method: 'system_profiler-fallback',
          message: 'Used system_profiler fallback for serial number'
        });
      }
    } catch (err) {
      if (auditChain) {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'darwin',
          status: 'warning',
          method: 'system_profiler-fallback',
          message: `system_profiler fallback failed: ${err.message}`
        });
      }
    }
  }
  
  // Step 4: Determine mode and construct composite identifier
  let compositeIdentifier = '';
  let mode = 'success';
  
  if (platformSerial && hardwareUUID) {
    compositeIdentifier = `${platformSerial}:${hardwareUUID}`;
    mode = 'success';
  } else if (hardwareUUID) {
    compositeIdentifier = hardwareUUID;
    mode = 'degraded';
    if (auditChain) {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'degraded',
        method: 'uuid-only',
        message: 'Hardware binding degraded: serial unavailable, using UUID only'
      });
    }
  } else if (platformSerial) {
    compositeIdentifier = platformSerial;
    mode = 'degraded';
    if (auditChain) {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'degraded',
        method: 'serial-only',
        message: 'Hardware binding degraded: UUID unavailable, using serial only'
      });
    }
  } else {
    // Hard failure
    if (auditChain) {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'failed',
        method: 'none',
        message: 'Hardware binding failed: no identifiers available'
      });
    }
    throw new Error('Hardware binding failed on macOS: No identifiers available');
  }
  
  // Step 5: Generate SHA-256 fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(compositeIdentifier)
    .digest('hex');
  
  // Step 6: Log success and cache
  if (auditChain) {
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: mode,
      method: 'complete',
      identifiers: {
        serial: !!platformSerial,
        uuid: !!hardwareUUID
      },
      message: `Hardware fingerprint generated (${mode} mode)`
    });
  }
  
  hardwareFingerprint = fingerprint;
  return fingerprint;
}

/**
 * Validate Windows hardware identifier quality.
 * @param {string} value - Identifier value to validate
 * @returns {boolean} True if valid, false if invalid
 */
function isValidWindowsIdentifier(value) {
  const trimmed = String(value || '').trim();
  
  // Reject empty
  if (!trimmed) return false;
  
  // Reject too short (less than 3 chars to allow short but valid IDs)
  if (trimmed.length < 3) return false;
  
  // Reject common placeholders (case-insensitive)
  const placeholders = [
    'to be filled by o.e.m.',
    'default string',
    'not applicable',
    'n/a',
    'none',
    'unknown',
    'system manufacturer',
    'system product name',
    'system serial number',
    'chassis serial number',
    'asset tag',
    'oem',
    'base board serial number',
    'base board asset tag'
  ];
  
  const lowerValue = trimmed.toLowerCase();
  for (const placeholder of placeholders) {
    if (lowerValue === placeholder || lowerValue.includes(placeholder)) {
      return false;
    }
  }
  
  // Reject all zeros or all Fs (common defaults)
  if (/^0+$/.test(trimmed) || /^f+$/i.test(trimmed)) return false;
  
  // Reject all whitespace
  if (!/\S/.test(trimmed)) return false;
  
  return true;
}

/**
 * Parse PowerShell Get-CimInstance output.
 * @param {string} output - Raw PowerShell output
 * @returns {string} Extracted value or empty string
 */
function parsePowerShellOutput(output) {
  const lines = String(output || '').split('\n');
  // PowerShell Select-Object -ExpandProperty returns just the value
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('PS ')) {
      return trimmed;
    }
  }
  return '';
}

/**
 * Parse wmic output to extract value.
 * @param {string} output - Raw wmic output
 * @returns {string} Extracted value or empty string
 */
function parseWmicOutput(output) {
  const lines = String(output || '').split('\n');
  // Skip header line, take first data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) return line;
  }
  return '';
}

/**
 * Extract Windows hardware identifiers via Get-CimInstance (primary) or wmic (fallback).
 * @returns {Promise<string>} 64-character hex SHA-256 hash
 */
async function getWindowsHardwareId() {
  const auditChain = getAuditChain();
  let cpuId = '';
  let baseboardSerial = '';
  let biosSerial = '';
  let systemUUID = '';
  let backend = 'unknown';
  
  // Try PowerShell Get-CimInstance first (primary path)
  let useCIM = true;
  try {
    // Test if PowerShell is available
    await kernel.request(CAP_PROC, 'execute', {
      command: 'powershell',
      args: ['-Command', 'Get-CimInstance Win32_Processor | Select-Object -ExpandProperty ProcessorId']
    });
    backend = 'cim';
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'info',
          backend: 'cim',
          message: 'Using Get-CimInstance (primary)'
        });
      } catch (err) {
        console.error('Audit chain write failed:', err.message);
      }
    }
  } catch (err) {
    // PowerShell/CIM failed, fall back to wmic
    useCIM = false;
    backend = 'wmic';
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'info',
          backend: 'wmic',
          message: 'Using wmic (fallback - CIM failed)'
        });
      } catch (err) {
        console.error('Audit chain write failed:', err.message);
      }
    }
  }
  
  // Step 1: Try CPU ProcessorId
  try {
    let cpuOutput;
    if (useCIM) {
      cpuOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'powershell',
        args: ['-Command', 'Get-CimInstance Win32_Processor | Select-Object -ExpandProperty ProcessorId']
      });
      const parsed = parsePowerShellOutput(cpuOutput);
      if (isValidWindowsIdentifier(parsed)) {
        cpuId = parsed;
      }
    } else {
      cpuOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'wmic',
        args: ['cpu', 'get', 'processorid']
      });
      const parsed = parseWmicOutput(cpuOutput);
      if (isValidWindowsIdentifier(parsed)) {
        cpuId = parsed;
      }
    }
  } catch (err) {
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'warning',
          method: `${backend}-cpu`,
          message: `CPU extraction failed: ${err.message}`
        });
      } catch (err2) {
        console.error('Audit chain write failed:', err2.message);
      }
    }
  }
  
  // Step 2: Try Baseboard SerialNumber
  try {
    let baseboardOutput;
    if (useCIM) {
      baseboardOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'powershell',
        args: ['-Command', 'Get-CimInstance Win32_BaseBoard | Select-Object -ExpandProperty SerialNumber']
      });
      const parsed = parsePowerShellOutput(baseboardOutput);
      if (isValidWindowsIdentifier(parsed)) {
        baseboardSerial = parsed;
      }
    } else {
      baseboardOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'wmic',
        args: ['baseboard', 'get', 'serialnumber']
      });
      const parsed = parseWmicOutput(baseboardOutput);
      if (isValidWindowsIdentifier(parsed)) {
        baseboardSerial = parsed;
      }
    }
  } catch (err) {
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'warning',
          method: `${backend}-baseboard`,
          message: `Baseboard extraction failed: ${err.message}`
        });
      } catch (err2) {
        console.error('Audit chain write failed:', err2.message);
      }
    }
  }
  
  // Step 3: Try BIOS SerialNumber
  try {
    let biosOutput;
    if (useCIM) {
      biosOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'powershell',
        args: ['-Command', 'Get-CimInstance Win32_BIOS | Select-Object -ExpandProperty SerialNumber']
      });
      const parsed = parsePowerShellOutput(biosOutput);
      if (isValidWindowsIdentifier(parsed)) {
        biosSerial = parsed;
      }
    } else {
      biosOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'wmic',
        args: ['bios', 'get', 'serialnumber']
      });
      const parsed = parseWmicOutput(biosOutput);
      if (isValidWindowsIdentifier(parsed)) {
        biosSerial = parsed;
      }
    }
  } catch (err) {
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'warning',
          method: `${backend}-bios`,
          message: `BIOS extraction failed: ${err.message}`
        });
      } catch (err2) {
        console.error('Audit chain write failed:', err2.message);
      }
    }
  }
  
  // Step 4: Try System UUID
  try {
    let uuidOutput;
    if (useCIM) {
      uuidOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'powershell',
        args: ['-Command', 'Get-CimInstance Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID']
      });
      const parsed = parsePowerShellOutput(uuidOutput);
      if (isValidWindowsIdentifier(parsed)) {
        systemUUID = parsed;
      }
    } else {
      uuidOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'wmic',
        args: ['csproduct', 'get', 'uuid']
      });
      const parsed = parseWmicOutput(uuidOutput);
      if (isValidWindowsIdentifier(parsed)) {
        systemUUID = parsed;
      }
    }
  } catch (err) {
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'warning',
          method: `${backend}-uuid`,
          message: `UUID extraction failed: ${err.message}`
        });
      } catch (err2) {
        console.error('Audit chain write failed:', err2.message);
      }
    }
  }
  
  // Step 5: Determine mode and construct composite identifier
  const availableIdentifiers = [];
  if (cpuId) availableIdentifiers.push(`cpu:${cpuId}`);
  if (baseboardSerial) availableIdentifiers.push(`board:${baseboardSerial}`);
  if (biosSerial) availableIdentifiers.push(`bios:${biosSerial}`);
  if (systemUUID) availableIdentifiers.push(`uuid:${systemUUID}`);
  
  let compositeIdentifier = '';
  let mode = 'unknown';
  
  if (availableIdentifiers.length >= 2) {
    // Success mode: At least 2 valid identifiers
    compositeIdentifier = availableIdentifiers.join('|');
    mode = 'success';
  } else if (availableIdentifiers.length === 1) {
    // Degraded mode: Only 1 valid identifier
    compositeIdentifier = availableIdentifiers[0];
    mode = 'degraded';
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'degraded',
          backend: backend,
          method: 'single-identifier',
          message: `Hardware binding degraded: only one valid identifier available (${availableIdentifiers[0].split(':')[0]})`
        });
      } catch (err) {
        console.error('Audit chain write failed:', err.message);
      }
    }
  } else {
    // Hard failure: No valid identifiers
    if (auditChain) {
      try {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'win32',
          status: 'failed',
          backend: backend,
          method: 'none',
          message: 'Hardware binding failed: no valid hardware identifiers available'
        });
      } catch (err) {
        console.error('Audit chain write failed:', err.message);
      }
    }
    throw new Error('Hardware binding failed on Windows: No valid hardware identifiers available');
  }
  
  // Step 6: Generate SHA-256 fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(compositeIdentifier)
    .digest('hex');
  
  // Step 7: Log success and cache
  if (auditChain) {
    try {
      auditChain.append({
        event: 'hardware-binding',
        platform: 'win32',
        status: mode,
        backend: backend,
        method: 'complete',
        identifiers: {
          cpu: !!cpuId,
          baseboard: !!baseboardSerial,
          bios: !!biosSerial,
          uuid: !!systemUUID,
          count: availableIdentifiers.length
        },
        message: `Hardware fingerprint generated (${mode} mode, ${backend} backend, ${availableIdentifiers.length} identifiers)`
      });
    } catch (err) {
      console.error('Audit chain write failed:', err.message);
    }
  }
  
  hardwareFingerprint = fingerprint;
  return fingerprint;
}

/**
 * Gather immutable hardware IDs via the OMEGA-gated execution broker.
 */
async function getHardwareId() {
  if (hardwareFingerprint) return hardwareFingerprint;
  
  // Platform detection
  if (process.platform === 'darwin') {
    return await getMacOSHardwareId();
  }
  
  // Windows backend (hardened)
  if (process.platform === 'win32') {
    return await getWindowsHardwareId();
  }
  
  // Linux backend (future - hard failure for now)
  throw new Error('Hardware binding not yet implemented for Linux');
}

function getHardwareEncryptionKey() {
  if (!hardwareFingerprint) {
    throw new Error('Hardware fingerprint not initialized. Call init() first.');
  }
  return crypto.createHash("sha256").update(hardwareFingerprint).digest();
}

function getHardwareFingerprint() {
  if (!hardwareFingerprint) {
    throw new Error('Hardware fingerprint not initialized. Call init() first.');
  }
  return hardwareFingerprint;
}

function encryptPrivateKeyPem(pem) {
  return encryptEnvelope(pem, IDENTITY_ENVELOPE_PREFIX, IDENTITY_ENVELOPE_AAD);
}

function encryptEnvelope(value, prefix, aad) {
  const key = getHardwareEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([
    cipher.update(String(value || ""), "utf8"),
    cipher.final()
  ]);
  return [
    prefix,
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex")
  ].join(":");
}

function decryptAuthenticatedPayload(payload) {
  return decryptEnvelope(payload, IDENTITY_ENVELOPE_PREFIX, IDENTITY_ENVELOPE_AAD);
}

function decryptEnvelope(payload, prefix, aad) {
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== prefix) {
    throw new Error("Invalid encrypted envelope.");
  }
  const [, ivHex, tagHex, encryptedHex] = parts;
  const key = getHardwareEncryptionKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

function decryptLegacyPayload(payload) {
  const parts = String(payload || "").split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const key = getHardwareEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function saveKeyPair() {
  if (!keyPair) return;
  const pem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" });
  const identityPath = getIdentityPath();
  fs.mkdirSync(path.dirname(identityPath), { recursive: true });
  fs.writeFileSync(identityPath, encryptPrivateKeyPem(pem), "utf8");
}

function quarantineIdentityFile(reason = "invalid") {
  const p = getIdentityPath();
  if (!fs.existsSync(p)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${p}.${reason}.${stamp}.bak`;
  try {
    fs.renameSync(p, backup);
    return backup;
  } catch {
    return null;
  }
}

function quarantinePeerStore(reason = "invalid") {
  const p = getPeerStorePath();
  if (!fs.existsSync(p)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${p}.${reason}.${stamp}.bak`;
  try {
    fs.renameSync(p, backup);
    return backup;
  } catch {
    return null;
  }
}

function loadKeyPair() {
  const p = getIdentityPath();
  if (!fs.existsSync(p)) return false;
  try {
    const payload = fs.readFileSync(p, "utf8");
    const isAuthenticatedEnvelope = payload.startsWith(`${IDENTITY_ENVELOPE_PREFIX}:`);
    const decrypted = isAuthenticatedEnvelope
      ? decryptAuthenticatedPayload(payload)
      : decryptLegacyPayload(payload);
    const privateKey = crypto.createPrivateKey(decrypted);
    const publicKey = crypto.createPublicKey(privateKey);
    keyPair = { privateKey, publicKey };
    if (!isAuthenticatedEnvelope) {
      saveKeyPair();
    }
    return true;
  } catch {
    quarantineIdentityFile("lock-failure");
    keyPair = null;
    return false;
  }
}

function ensureKeyPair() {
  if (!keyPair) {
    if (!loadKeyPair()) {
      keyPair = crypto.generateKeyPairSync("ed25519");
      saveKeyPair();
    }
  }
  return keyPair;
}

function normalizePeerRecord(record) {
  const raw = record && typeof record === "object" ? record : {};
  const deviceId = String(raw.deviceId || "").trim();
  const pubKeyPem = String(raw.pubKeyPem || "").trim();
  if (!deviceId || !pubKeyPem) {
    throw new Error("Invalid peer record.");
  }
  return {
    deviceId,
    label: String(raw.label || "").trim() || deviceId,
    pubKeyPem,
    fingerprint: fingerprintFromPem(pubKeyPem),
    trustedAt: String(raw.trustedAt || new Date().toISOString())
  };
}

function savePeers() {
  const peerStorePath = getPeerStorePath();
  fs.mkdirSync(path.dirname(peerStorePath), { recursive: true });
  const rows = Array.from(peers.values())
    .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
    .map((record) => normalizePeerRecord(record));
  const payload = JSON.stringify(rows, null, 2);
  fs.writeFileSync(
    peerStorePath,
    encryptEnvelope(payload, PEER_STORE_PREFIX, PEER_STORE_AAD),
    "utf8"
  );
}

function loadPeers() {
  peers.clear();
  const peerStorePath = getPeerStorePath();
  if (!fs.existsSync(peerStorePath)) {
    return false;
  }
  try {
    const payload = fs.readFileSync(peerStorePath, "utf8");
    const decrypted = decryptEnvelope(payload, PEER_STORE_PREFIX, PEER_STORE_AAD);
    const parsed = JSON.parse(decrypted);
    if (!Array.isArray(parsed)) {
      throw new Error("Trusted peer store must be an array.");
    }
    for (const entry of parsed) {
      const record = normalizePeerRecord(entry);
      peers.set(record.deviceId, record);
    }
    return true;
  } catch {
    quarantinePeerStore("lock-failure");
    peers.clear();
    return false;
  }
}

function publicKeyPem() {
  return ensureKeyPair()
    .publicKey.export({
      type: "spki",
      format: "pem"
    })
    .toString("utf8");
}

function fingerprintFromPem(pem) {
  return crypto
    .createHash("sha256")
    .update(String(pem || ""))
    .digest("hex");
}

async function init() {
  await getHardwareId();
  ensureKeyPair();
  loadPeers();
  return true;
}

function trustPeer(deviceId, pubKeyPem, label) {
  const id = String(deviceId || "").trim();
  const pem = String(pubKeyPem || "").trim();
  if (!id || !pem) {
    throw new Error("deviceId and pubKeyPem are required.");
  }

  peers.set(id, {
    deviceId: id,
    label: String(label || "").trim() || id,
    pubKeyPem: pem,
    fingerprint: fingerprintFromPem(pem),
    trustedAt: new Date().toISOString()
  });
  savePeers();

  return {
    ok: true,
    deviceId: id
  };
}

function revokePeer(deviceId) {
  const id = String(deviceId || "").trim();
  peers.delete(id);
  savePeers();
  return { ok: true, deviceId: id };
}

function listPeers() {
  return Array.from(peers.values());
}

function rotate() {
  keyPair = crypto.generateKeyPairSync("ed25519");
  saveKeyPair();
  return {
    ok: true,
    fingerprint: getFingerprint(),
    rotatedAt: new Date().toISOString()
  };
}

function getPublicKeyPem() {
  return publicKeyPem();
}

function getFingerprint() {
  if (!hardwareFingerprint) {
    hardwareFingerprint = crypto
      .createHash("sha256")
      .update(require("os").hostname())
      .digest("hex");
  }
  const keyFingerprint = fingerprintFromPem(publicKeyPem());
  // Hardware Binding: Node ID is a hash of the Cryptographic Key + the Physical Silicon ID
  return crypto.createHash("sha256")
    .update(keyFingerprint + (hardwareFingerprint || ""))
    .digest("hex");
}

/**
 * Sign a payload using the local identity (Silicon-Bound).
 */
function signPayload(payload) {
  const kp = ensureKeyPair();
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), kp.privateKey);
  return signature.toString('base64');
}

/**
 * Verify a payload's signature against a known public key.
 */
function verifyPayload(payload, signatureBase64, pubKeyPem) {
  try {
    const pubKey = crypto.createPublicKey(pubKeyPem);
    return crypto.verify(null, Buffer.from(JSON.stringify(payload)), pubKey, Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false;
  }
}

module.exports = {
  init,
  getPublicKeyPem,
  getFingerprint,
  getHardwareFingerprint,
  trustPeer,
  revokePeer,
  listPeers,
  rotate,
  signPayload,
  verifyPayload
};
