const assert = require("node:assert/strict");
const {
  validateSettings
} = require("../src/core/ipcValidators");

function run() {
  const ok = validateSettings({
    safetyPolicy: "strict",
    personalityProfile: "engineer",
    rgbTargets: ["keyboard", "mouse"],
    rgbProvider: "openrgb",
    rgbPort: 6742
  });
  assert.equal(ok.safetyPolicy, "strict");
  assert.equal(ok.personalityProfile, "engineer");
  assert.deepEqual(ok.rgbTargets, ["keyboard", "mouse"]);

  assert.throws(() => validateSettings({ safetyPolicy: "aggressive" }), /invalid/i);
  assert.throws(() => validateSettings({ rgbTargets: "keyboard" }), /array/i);
  assert.throws(() => validateSettings({ rgbPort: 70000 }), /out of range/i);

  console.log("Security guards test passed.");
}

run();
