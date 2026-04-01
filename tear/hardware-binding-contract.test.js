const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const xpManagerPath = path.resolve(__dirname, "../src/core/xpManager.js");
const agentControllerPath = path.resolve(__dirname, "../src/core/agentController.js");

async function withRuntimeMocks(fn, options = {}) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-runtime-binding-"));
  const fingerprint = String(options.fingerprint || "rotated-identity-fingerprint");
  const hardwareFingerprint = String(options.hardwareFingerprint || "stable-hardware-fingerprint");
  const state = {
    nodeId: options.stateNodeId == null ? hardwareFingerprint : String(options.stateNodeId),
    xp: Number.isFinite(options.xp) ? Number(options.xp) : 0
  };
  const kernelCalls = [];
  const originalLoad = Module._load;
  const originalCwd = process.cwd();

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "./stateManager") {
      return {
        getState: () => ({ ...state }),
        get: (key) => state[key],
        set: (key, value) => {
          state[key] = value;
          return true;
        }
      };
    }
    if (request === "./identityKernel") {
      return {
        getFingerprint: () => fingerprint,
        getHardwareFingerprint: () => hardwareFingerprint
      };
    }
    if (request === "../kernel") {
      return {
        CAP_PROC: "proc",
        kernel: {
          request: async (_capability, action, payload) => {
            kernelCalls.push({ action, payload });
            if (action === "executeTask") {
              return "sandbox-ok";
            }
            return "";
          }
        }
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[xpManagerPath];
  delete require.cache[agentControllerPath];

  try {
    process.chdir(tempRoot);
    return await fn({ tempRoot, state, kernelCalls, hardwareFingerprint, fingerprint });
  } finally {
    process.chdir(originalCwd);
    Module._load = originalLoad;
    delete require.cache[xpManagerPath];
    delete require.cache[agentControllerPath];
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test("XP Manager accepts identity rotation when the stable hardware binding matches", async () => {
  await withRuntimeMocks(async ({ state, hardwareFingerprint }) => {
    const xpManager = require("../src/core/xpManager");

    const status = xpManager.getStatus();
    const result = xpManager.addXP(25);

    assert.equal(status.nodeId, hardwareFingerprint.substring(0, 12));
    assert.equal(result.xp, 25);
    assert.equal(result.tier, 1);
    assert.equal(state.xp, 25);
  }, {
    fingerprint: "identity-after-rotation",
    hardwareFingerprint: "stable-hardware-allow",
    stateNodeId: "stable-hardware-allow"
  });
});

test("XP Manager still blocks when the hardware binding changes", async () => {
  await withRuntimeMocks(async () => {
    const xpManager = require("../src/core/xpManager");
    assert.throws(
      () => xpManager.addXP(10),
      /HARDWARE_MISMATCH/i
    );
  }, {
    fingerprint: "identity-after-rotation",
    hardwareFingerprint: "stable-hardware-current",
    stateNodeId: "stable-hardware-previous"
  });
});

test("AgentController sandbox execution allows rotated identities on the same hardware", async () => {
  await withRuntimeMocks(async ({ kernelCalls, tempRoot }) => {
    const AgentController = require("../src/core/agentController");
    const controller = new AgentController({});

    const result = await controller.executeInSandbox("console.log('ok');");
    const scratchpadPath = path.join(tempRoot, "tmp", "agent-scratchpad");
    const remainingFiles = fs.existsSync(scratchpadPath)
      ? fs.readdirSync(scratchpadPath)
      : [];

    assert.equal(result.ok, true);
    assert.equal(result.output, "sandbox-ok");
    assert.equal(kernelCalls.length, 1);
    assert.equal(kernelCalls[0].action, "executeTask");
    assert.deepEqual(remainingFiles, []);
  }, {
    fingerprint: "identity-after-rotation",
    hardwareFingerprint: "stable-hardware-agent",
    stateNodeId: "stable-hardware-agent"
  });
});

test("AgentController sandbox execution still blocks on hardware mismatch", async () => {
  await withRuntimeMocks(async () => {
    const AgentController = require("../src/core/agentController");
    const controller = new AgentController({});

    await assert.rejects(
      () => controller.executeInSandbox("console.log('blocked');"),
      /OMEGA_BLOCK: Agent execution disabled/i
    );
  }, {
    fingerprint: "identity-after-rotation",
    hardwareFingerprint: "stable-hardware-agent-current",
    stateNodeId: "stable-hardware-agent-previous"
  });
});
