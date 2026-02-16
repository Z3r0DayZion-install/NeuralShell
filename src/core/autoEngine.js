"use strict";

class AutonomousEngine {
  constructor(onTick, timers = globalThis) {
    this.onTick = typeof onTick === "function" ? onTick : () => {};
    this.timers = timers;
    this.timerId = null;
    this.sequence = 0;
    this.config = null;
  }

  start(config) {
    const goal = typeof config?.goal === "string" ? config.goal.trim() : "";
    const intervalSec = Number(config?.intervalSec);
    if (!goal) throw new Error("Goal is required");
    if (!Number.isFinite(intervalSec) || intervalSec < 5 || intervalSec > 3600) {
      throw new Error("Interval must be between 5 and 3600 seconds");
    }

    this.stop();
    this.config = { goal, intervalSec };
    this.sequence = 0;
    this.emitTick();
    this.timerId = this.timers.setInterval(() => this.emitTick(), intervalSec * 1000);
    return this.status();
  }

  stop() {
    if (this.timerId) {
      this.timers.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.config = null;
    return this.status();
  }

  status() {
    return {
      running: Boolean(this.timerId),
      goal: this.config?.goal || "",
      intervalSec: this.config?.intervalSec || 0,
      sequence: this.sequence
    };
  }

  emitTick() {
    if (!this.config) return;
    this.sequence += 1;
    this.onTick({
      sequence: this.sequence,
      goal: this.config.goal,
      at: new Date().toISOString()
    });
  }
}

module.exports = { AutonomousEngine };
