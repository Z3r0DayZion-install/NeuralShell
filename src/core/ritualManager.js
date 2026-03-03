const stateManager = require('./stateManager');
const xpManager = require('./xpManager');

/**
 * RitualManager handles the "Ritual" system — automated tasks,
 * scheduled actions, and behavioral triggers. Rituals can award
 * XP, trigger UI effects, or execute LLM prompts.
 */
class RitualManager {
  constructor() {
    this.rituals = [
      { id: 'unlockFounder', name: 'Unlock Founder Mode', xpAward: 500 },
      { id: 'obeyProtocol', name: 'Obey Protocol', xpAward: 100 },
      { id: 'mindFlush', name: 'MindFlush', xpAward: 200 }
    ];
    this.scheduledRituals = [];
    this.autoTriggers = {
      time: null,
      file: null,
      xp: null,
      active: false
    };
  }

  /**
   * Execute a ritual by ID.
   * @param {string} id 
   * @returns {Object} Result of the ritual execution
   */
  execute(id) {
    const ritual = this.rituals.find(r => r.id === id);
    if (!ritual) {
      return { success: false, error: 'Ritual not found' };
    }

    const res = xpManager.addXP(ritual.xpAward);
    return {
      success: true,
      ritual: ritual.name,
      xpAwarded: ritual.xpAward,
      newTotalXP: res.xp,
      newTier: res.tier,
      leveledUp: res.leveledUp
    };
  }

  /**
   * Schedule a ritual for later.
   * @param {string} ritualId 
   * @param {number} timestamp 
   */
  schedule(ritualId, timestamp) {
    const delay = timestamp - Date.now();
    if (delay <= 0) return { success: false, error: 'Invalid time' };

    const timer = setTimeout(() => {
      this.execute(ritualId);
      this.scheduledRituals = this.scheduledRituals.filter(r => r.timer !== timer);
    }, delay);

    this.scheduledRituals.push({ ritualId, timestamp, timer });
    return { success: true, timestamp };
  }

  /**
   * Set an automatic trigger based on criteria.
   * @param {Object} criteria {time, file, xp}
   */
  setAutoTrigger(criteria) {
    this.autoTriggers = { ...this.autoTriggers, ...criteria, active: true };
    return { success: true, triggers: this.autoTriggers };
  }

  /**
   * Check XP triggers when XP changes.
   * @param {number} xp 
   */
  checkXPTrigger(xp) {
    if (this.autoTriggers.active && this.autoTriggers.xp && xp >= this.autoTriggers.xp) {
      // Trigger a default "Milestone reached" ritual or similar
      this.execute('obeyProtocol');
      this.autoTriggers.xp = null; // Clear trigger after use
    }
  }

  /**
   * Get all available rituals.
   */
  getRituals() {
    return this.rituals;
  }

  /**
   * Get scheduled rituals.
   */
  getScheduled() {
    return this.scheduledRituals.map(r => ({ ritualId: r.ritualId, timestamp: r.timestamp }));
  }
}

module.exports = new RitualManager();
