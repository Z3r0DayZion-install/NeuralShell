const { EventEmitter } = require("events");

class DaemonWatchdog extends EventEmitter {
  constructor() {
    super();
    this._alive = false;
    this._proc = null;
  }

  start() {
    if (this._alive) return;
    this._alive = true;
    this._proc = { pid: process.pid };
    queueMicrotask(() => {
      this.emit("started", {
        pid: process.pid,
        mode: "embedded"
      });
    });
  }

  stop() {
    if (!this._alive) return;
    this._alive = false;
    this._proc = null;
    this.emit("stopped", {
      reason: "manual-stop"
    });
  }

  isAlive() {
    return this._alive;
  }
}

module.exports = {
  DaemonWatchdog
};
