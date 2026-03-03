const stateManager = require('./stateManager');

/**
 * XPManager handles experience points (XP) and rank/tier progression.
 * XP is awarded for various user actions like sending prompts, saving
 * sessions, or completing rituals.
 */
class XPManager {
  constructor() {
    this.tiers = [
      { id: 0, name: 'Tier0', minXP: 0 },
      { id: 1, name: 'Tier1', minXP: 100 },
      { id: 2, name: 'Tier2', minXP: 500 },
      { id: 3, name: 'Tier3', minXP: 1000 },
      { id: 4, name: 'Tier4', minXP: 2500 },
      { id: 5, name: 'Tier5', minXP: 5000 },
      { id: 'founder', name: 'Founder', minXP: 10000 },
      { id: 'sentinel', name: 'Sentinel', minXP: 25000 }
    ];
  }

  /**
   * Add XP to the current state and check for level ups.
   * @param {number} amount 
   * @returns {Object} Updated XP and Tier information
   */
  addXP(amount) {
    const currentXP = stateManager.get('xp') || 0;
    const newXP = currentXP + amount;
    stateManager.set('xp', newXP);

    const oldTier = stateManager.get('tier') || 0;
    const newTier = this.calculateTier(newXP);

    if (newTier !== oldTier) {
      stateManager.set('tier', newTier);
    }

    return {
      xp: newXP,
      tier: newTier,
      leveledUp: newTier !== oldTier
    };
  }

  /**
   * Calculate the tier based on XP.
   * @param {number} xp 
   * @returns {number|string} Tier ID
   */
  calculateTier(xp) {
    let bestTier = this.tiers[0].id;
    for (const tier of this.tiers) {
      if (xp >= tier.minXP) {
        bestTier = tier.id;
      } else {
        break;
      }
    }
    return bestTier;
  }

  /**
   * Get current XP and Tier.
   */
  getStatus() {
    return {
      xp: stateManager.get('xp') || 0,
      tier: stateManager.get('tier') || 0,
      tiers: this.tiers
    };
  }
}

module.exports = new XPManager();
