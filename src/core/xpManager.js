/**
 * NeuralShell XP Manager — HARDWARE-BOUND PROGRESSION
 */

const stateManager = require("./stateManager");
const identityKernel = require("./identityKernel");

function getStatus() {
  const state = stateManager.getState();
  const xp = state.xp || 0;
  const tier = Math.max(1, Math.floor(xp / 100) + 1);
  
  return {
    xp,
    tier,
    nextTierAt: tier * 100,
    nodeId: identityKernel.getFingerprint().substring(0, 12)
  };
}

function addXP(amount) {
  const delta = Number(amount);
  if (!Number.isFinite(delta)) {
    throw new Error("XP amount must be numeric.");
  }

  // Hardware Verification
  const currentFingerprint = identityKernel.getFingerprint();
  const stateNodeId = stateManager.get("nodeId");
  
  if (stateNodeId && stateNodeId !== currentFingerprint) {
    throw new Error("HARDWARE_MISMATCH: XP progression is locked to the original physical hardware.");
  }

  const currentXP = stateManager.get("xp") || 0;
  const previousTier = Math.max(1, Math.floor(currentXP / 100) + 1);
  
  const nextXP = Math.max(0, currentXP + Math.floor(delta));
  const nextTier = Math.max(1, Math.floor(nextXP / 100) + 1);

  stateManager.set("xp", nextXP);

  return {
    xp: nextXP,
    tier: nextTier,
    leveledUp: nextTier > previousTier
  };
}

module.exports = {
  getStatus,
  addXP
};
