"use strict";

/**
 * DaemonWatchdog — IPC Resilience Layer
 *
 * Spawns neural-linkd.exe, watches for crashes, and auto-restarts with
 * exponential backoff. Pushes status events to the Electron BrowserWindow
 * so the UI can reflect the daemon's actual state rather than silently failing.
 */

const { kernel, CAP_PROC } = require("../kernel");
const path = require("path");
const fs = require("fs");
const EventEmitter = require("events");

const DAEMON_EXE = "neural-linkd.exe";
const MAX_RESTARTS = 5;       // After this many rapid restarts, stop retrying
const RAPID_WINDOW_MS = 10_000;  // Restarts within this window count as "rapid"
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

class DaemonWatchdog extends EventEmitter {
    constructor(options = {}) {
        super();
        this.exePath = options.exePath || DAEMON_EXE;
        this.args = options.args || [];
        this._proc = null;
        this._restarts = 0;
        this._backoffMs = BASE_BACKOFF_MS;
        this._lastStart = 0;
        this._stopped = false;
        this._timer = null;
    }

    // ---------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------

    /** Start the daemon and begin watching it. */
    start() {
        this._stopped = false;
        this._spawn();
    }

    /** Permanently stop the watchdog and kill the managed process. */
    stop() {
        this._stopped = true;
        if (this._timer) clearTimeout(this._timer);
        if (this._proc) this._proc.kill("SIGTERM");
        this._proc = null;
    }

    /** Returns true if the daemon process is currently running. */
    isAlive() {
        return this._proc !== null && !this._proc.killed;
    }

    // ---------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------

    _spawn() {
        if (this._stopped) return;

        const now = Date.now();
        if (now - this._lastStart < RAPID_WINDOW_MS) {
            this._restarts++;
        } else {
            this._restarts = 1;
            this._backoffMs = BASE_BACKOFF_MS;
        }
        this._lastStart = now;

        if (this._restarts > MAX_RESTARTS) {
            const msg = `[DaemonWatchdog] Daemon crashed ${this._restarts} times in ${RAPID_WINDOW_MS}ms — giving up.`;
            console.error(msg);
            this.emit("fatal", { message: msg });
            return;
        }

        let exeResolved = this.exePath;

        // In packaged builds, look in resources/app.asar.unpacked/bin/
        if (!fs.existsSync(exeResolved)) {
            const { app } = require("electron");
            const candidates = [
                path.join(path.dirname(app.getPath("exe")), "resources", "app.asar.unpacked", "bin", DAEMON_EXE),
                path.join(app.getAppPath(), "..", "bin", DAEMON_EXE),
                DAEMON_EXE  // PATH fallback
            ];
            exeResolved = candidates.find(c => {
                try { return fs.existsSync(c); } catch { return false; }
            }) || DAEMON_EXE;
        }

        console.log(`[DaemonWatchdog] Spawning: ${exeResolved} (attempt ${this._restarts})`);

        try {
            // Using kernel broker for isolated spawning
            // In a fully integrated Omega build, the daemon would be spawned via the pre-registered 'neural-linkd:start' task.
            // Since DaemonWatchdog tries to resolve the path dynamically, we'll use the kernel spawnDaemon.
            // Note: The ExecutionBroker is hardcoded to the bin path, so we just invoke the task.
            kernel.request(CAP_PROC, 'spawnDaemon', { taskId: 'neural-linkd:start' })
                .then(proc => {
                    this._proc = proc;
                    this.emit("started", { pid: this._proc.pid, attempt: this._restarts });

                    this._proc.on("stdout", line => {
                        console.log(`[neural-linkd] ${line.trimEnd()}`);
                        this.emit("daemon-log", { level: "info", line: line.trimEnd() });
                    });

                    this._proc.on("stderr", line => {
                        console.error(`[neural-linkd:err] ${line.trimEnd()}`);
                        this.emit("daemon-log", { level: "error", line: line.trimEnd() });
                    });

                    this._proc.on("exit", (code, signal) => {
                        console.warn(`[DaemonWatchdog] Daemon exited — code=${code} signal=${signal}`);
                        this._proc = null;
                        this.emit("stopped", { code, signal });
                        this._scheduleRestart();
                    });

                    this._proc.on("error", err => {
                        console.error("[DaemonWatchdog] Process error:", err.message);
                        this.emit("error", { error: err.message });
                    });
                })
                .catch(err => {
                    console.error("[DaemonWatchdog] Failed to spawn via kernel:", err.message);
                    this.emit("spawn-failed", { error: err.message });
                    this._scheduleRestart();
                });
        } catch (err) {
            console.error("[DaemonWatchdog] Sync error during spawn:", err.message);
            this.emit("spawn-failed", { error: err.message });
            this._scheduleRestart();
            return;
        }
    }

    _scheduleRestart() {
        if (this._stopped) return;

        // Exponential backoff, capped at MAX_BACKOFF_MS
        const delay = Math.min(this._backoffMs, MAX_BACKOFF_MS);
        this._backoffMs = Math.min(this._backoffMs * 2, MAX_BACKOFF_MS);

        console.log(`[DaemonWatchdog] Restarting in ${delay}ms…`);
        this.emit("restart-scheduled", { delayMs: delay, attempt: this._restarts + 1 });

        this._timer = setTimeout(() => {
            this._timer = null;
            this._spawn();
        }, delay);
    }
}

module.exports = { DaemonWatchdog };
