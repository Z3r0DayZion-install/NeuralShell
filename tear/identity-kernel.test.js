const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const identityKernelPath = path.resolve(__dirname, "../src/core/identityKernel.js");

function hardwareFingerprintFor(cpuId, baseboard, biosSerial, systemUUID) {
  // Match new Windows composite format with all 4 sources
  const cpu = String(cpuId || '').trim();
  const board = String(baseboard || '').trim();
  const bios = String(biosSerial || '').trim();
  const uuid = String(systemUUID || '').trim();
  
  // Build composite with all available identifiers (matching getWindowsHardwareId logic)
  const parts = [];
  if (cpu) parts.push(`cpu:${cpu}`);
  if (board) parts.push(`board:${board}`);
  if (bios) parts.push(`bios:${bios}`);
  if (uuid) parts.push(`uuid:${uuid}`);
  
  const composite = parts.join('|');
  return crypto
    .createHash("sha256")
    .update(composite)
    .digest("hex");
}

function harnessFallbackFingerprintFor(platformLabel = process.platform, arch = process.arch, host = os.hostname()) {
  const syntheticId = [
    "harness",
    String(host || ""),
    String(platformLabel || ""),
    String(arch || "")
  ].join(":");
  return crypto
    .createHash("sha256")
    .update(`fallback:${syntheticId}`)
    .digest("hex");
}

function encryptLegacyIdentityPem(pem, hardwareFingerprint) {
  const key = crypto.createHash("sha256").update(String(hardwareFingerprint)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(String(pem || ""), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

async function withMockedIdentity(userDataPath, fn, options = {}) {
  const cpuId = String(options.cpuId || "CPU-TEST-001");
  const baseboard = String(options.baseboard || "BOARD-TEST-001");
  const biosSerial = String(options.biosSerial || "BIOS-TEST-001");
  const systemUUID = String(options.systemUUID || "UUID-TEST-001");
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "electron") {
      return {
        app: {
          getPath(_name) {
            return userDataPath;
          }
        }
      };
    }
    if (request === "../kernel") {
      return {
        CAP_PROC: "proc",
        kernel: {
          request: async (_capability, action, payload) => {
            assert.equal(action, "execute");
            const command = String(payload && payload.command);
            const args = Array.isArray(payload && payload.args) ? payload.args : [];
            if (command !== "wmic") {
              throw new Error(`Unexpected command: ${command}`);
            }
            // Return wmic output format: header line + data line
            const argsStr = args.join(" ").toLowerCase();
            if (argsStr === "cpu get processorid") {
              return `ProcessorId\n${cpuId}\n`;
            }
            if (argsStr === "baseboard get serialnumber") {
              return `SerialNumber\n${baseboard}\n`;
            }
            if (argsStr === "bios get serialnumber") {
              return `SerialNumber\n${biosSerial}\n`;
            }
            if (argsStr === "csproduct get uuid") {
              return `UUID\n${systemUUID}\n`;
            }
            throw new Error(`Unexpected args: ${args.join(" ")}`);
          }
        }
      };
    }
    if (request === "./auditChain") {
      // Mock audit chain for tests
      return {
        append: () => {} // No-op for tests
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[identityKernelPath];
  try {
    const identityKernel = require(identityKernelPath);
    if (identityKernel && typeof identityKernel.setHarnessFallbackEnabled === "function") {
      identityKernel.setHarnessFallbackEnabled(true);
    }
    const expectedHardwareFingerprint = process.platform === "win32"
      ? hardwareFingerprintFor(cpuId, baseboard, biosSerial, systemUUID)
      : harnessFallbackFingerprintFor();
    return await fn({
      identityPath: path.join(userDataPath, "identity.omega"),
      peerStorePath: path.join(userDataPath, "trusted-peers.omega"),
      hardwareFingerprint: expectedHardwareFingerprint
    });
  } finally {
    Module._load = originalLoad;
    delete require.cache[identityKernelPath];
  }
}

test("IdentityKernel persists rotated keypairs across reloads", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-identity-rotate-"));
  const options = { cpuId: "CPU-ROTATE-001", baseboard: "BOARD-ROTATE-001" };
  try {
    const firstPass = await withMockedIdentity(tempRoot, async ({ identityPath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const originalPem = identityKernel.getPublicKeyPem();
      const originalFingerprint = identityKernel.getFingerprint();
      const rotated = identityKernel.rotate();
      const rotatedPem = identityKernel.getPublicKeyPem();
      const raw = fs.readFileSync(identityPath, "utf8");

      assert.notEqual(rotatedPem, originalPem);
      assert.notEqual(rotated.fingerprint, originalFingerprint);
      assert.ok(raw.startsWith("omega-id-v2:"));

      return { originalPem, rotatedPem };
    }, options);

    await withMockedIdentity(tempRoot, async () => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const reloadedPem = identityKernel.getPublicKeyPem();

      assert.equal(reloadedPem, firstPass.rotatedPem);
      assert.notEqual(reloadedPem, firstPass.originalPem);
    }, options);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("IdentityKernel migrates legacy encrypted identities to the authenticated format", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-identity-migrate-"));
  const options = { cpuId: "CPU-MIGRATE-001", baseboard: "BOARD-MIGRATE-001" };
  try {
    await withMockedIdentity(tempRoot, async ({ identityPath, hardwareFingerprint }) => {
      const legacyPair = crypto.generateKeyPairSync("ed25519");
      const privatePem = legacyPair.privateKey.export({ type: "pkcs8", format: "pem" });
      const publicPem = legacyPair.publicKey
        .export({ type: "spki", format: "pem" })
        .toString("utf8");

      fs.writeFileSync(
        identityPath,
        encryptLegacyIdentityPem(privatePem, hardwareFingerprint),
        "utf8"
      );

      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();

      const migratedPem = identityKernel.getPublicKeyPem();
      const raw = fs.readFileSync(identityPath, "utf8");

      assert.equal(migratedPem, publicPem);
      assert.ok(raw.startsWith("omega-id-v2:"));
    }, options);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("IdentityKernel quarantines tampered authenticated identities and regenerates a fresh keypair", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-identity-tamper-"));
  const options = { cpuId: "CPU-TAMPER-001", baseboard: "BOARD-TAMPER-001" };
  try {
    const originalPem = await withMockedIdentity(tempRoot, async ({ identityPath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const publicPem = identityKernel.getPublicKeyPem();
      const raw = fs.readFileSync(identityPath, "utf8");
      const tampered = raw.replace(/([0-9a-f])(?=[0-9a-f]*$)/i, (char) =>
        char.toLowerCase() === "a" ? "b" : "a"
      );
      fs.writeFileSync(identityPath, tampered, "utf8");
      return publicPem;
    }, options);

    await withMockedIdentity(tempRoot, async ({ identityPath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const regeneratedPem = identityKernel.getPublicKeyPem();
      const files = fs.readdirSync(tempRoot);
      const raw = fs.readFileSync(identityPath, "utf8");

      assert.notEqual(regeneratedPem, originalPem);
      assert.ok(raw.startsWith("omega-id-v2:"));
      assert.ok(
        files.some((name) => name.startsWith("identity.omega.lock-failure.") && name.endsWith(".bak")),
        "Expected a quarantine backup after tamper detection."
      );
    }, options);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("IdentityKernel persists trusted peers across reloads and revocations", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-identity-peers-"));
  const options = { cpuId: "CPU-PEERS-001", baseboard: "BOARD-PEERS-001" };
  const trustedPeerPem = crypto.generateKeyPairSync("ed25519").publicKey
    .export({ type: "spki", format: "pem" })
    .toString("utf8");
  try {
    await withMockedIdentity(tempRoot, async ({ peerStorePath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();

      const trusted = identityKernel.trustPeer("peer-alpha", trustedPeerPem, "Alpha Node");
      const peers = identityKernel.listPeers();
      const raw = fs.readFileSync(peerStorePath, "utf8");

      assert.equal(trusted.ok, true);
      assert.equal(peers.length, 1);
      assert.equal(peers[0].deviceId, "peer-alpha");
      assert.equal(peers[0].label, "Alpha Node");
      assert.ok(raw.startsWith("omega-peers-v1:"));
    }, options);

    await withMockedIdentity(tempRoot, async () => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const peers = identityKernel.listPeers();

      assert.equal(peers.length, 1);
      assert.equal(peers[0].deviceId, "peer-alpha");
      assert.equal(peers[0].fingerprint.length, 64);

      identityKernel.revokePeer("peer-alpha");
      assert.deepEqual(identityKernel.listPeers(), []);
    }, options);

    await withMockedIdentity(tempRoot, async () => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      assert.deepEqual(identityKernel.listPeers(), []);
    }, options);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("IdentityKernel quarantines tampered peer stores and recovers with an empty trust list", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-identity-peers-tamper-"));
  const options = { cpuId: "CPU-PEER-TAMPER-001", baseboard: "BOARD-PEER-TAMPER-001" };
  const trustedPeerPem = crypto.generateKeyPairSync("ed25519").publicKey
    .export({ type: "spki", format: "pem" })
    .toString("utf8");
  try {
    await withMockedIdentity(tempRoot, async ({ peerStorePath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      identityKernel.trustPeer("peer-tamper", trustedPeerPem, "Tamper Node");

      const raw = fs.readFileSync(peerStorePath, "utf8");
      const tampered = raw.replace(/([0-9a-f])(?=[0-9a-f]*$)/i, (char) =>
        char.toLowerCase() === "a" ? "b" : "a"
      );
      fs.writeFileSync(peerStorePath, tampered, "utf8");
    }, options);

    await withMockedIdentity(tempRoot, async ({ peerStorePath }) => {
      const identityKernel = require("../src/core/identityKernel");
      await identityKernel.init();
      const peers = identityKernel.listPeers();
      const files = fs.readdirSync(tempRoot);

      assert.deepEqual(peers, []);
      assert.ok(
        files.some((name) => name.startsWith("trusted-peers.omega.lock-failure.") && name.endsWith(".bak")),
        "Expected a quarantine backup after peer store tamper detection."
      );
      assert.ok(!fs.existsSync(peerStorePath), "Tampered peer store should be quarantined instead of reused.");
    }, options);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
