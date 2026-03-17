const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const identityKernelPath = path.resolve(__dirname, "../src/core/identityKernel.js");

function hardwareFingerprintFor(cpuId, baseboard) {
  return crypto
    .createHash("sha256")
    .update(String(cpuId).trim() + String(baseboard).trim())
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
            if (args.join(" ").toLowerCase() === "cpu get processorid") {
              return cpuId;
            }
            if (args.join(" ").toLowerCase() === "baseboard get serialnumber") {
              return baseboard;
            }
            throw new Error(`Unexpected args: ${args.join(" ")}`);
          }
        }
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[identityKernelPath];
  try {
    return await fn({
      identityPath: path.join(userDataPath, "identity.omega"),
      peerStorePath: path.join(userDataPath, "trusted-peers.omega"),
      hardwareFingerprint: hardwareFingerprintFor(cpuId, baseboard)
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
