let xp = 0;
let tier = 1;

function recalcTier() {
  tier = Math.max(1, Math.floor(xp / 100) + 1);
}

function getStatus() {
  return {
    xp,
    tier,
    nextTierAt: tier * 100
  };
}

function addXP(amount) {
  const delta = Number(amount);
  if (!Number.isFinite(delta)) {
    throw new Error("XP amount must be numeric.");
  }

  const previousTier = tier;
  xp = Math.max(0, xp + Math.floor(delta));
  recalcTier();

  return {
    xp,
    tier,
    leveledUp: tier > previousTier
  };
}

module.exports = {
  getStatus,
  addXP
};
