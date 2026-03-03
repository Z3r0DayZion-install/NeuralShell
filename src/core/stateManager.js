const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * StateManager persists application state between runs. The state includes
 * selected model, UI settings, chat history and token counts. Call
 * `load()` at startup to initialise the in-memory state from disk. All
 * modifications to the state should be made via the provided getters
 * and setters to ensure that changes are persisted immediately.
 */
class StateManager {
  constructor() {
    this.currentStateVersion = 2;
    // Derive a path in the user data directory for storing state
    const filename = 'state.json';
    this.stateFile = path.join(app.getPath('userData'), filename);
    // Default state values
    this.defaultState = {
      stateVersion: this.currentStateVersion,
      model: 'llama3',
      theme: 'dark',
      chat: [],
      tokens: 0,
      xp: 0,
      tier: 0,
      settings: {
        ollamaBaseUrl: 'http://127.0.0.1:11434',
        timeoutMs: 15000,
        retryCount: 2,
        theme: 'dark',
        clockEnabled: true,
        clock24h: false,
        clockUtcOffset: 'local',
        personalityProfile: 'balanced',
        safetyPolicy: 'balanced',
        rgbEnabled: false,
        rgbProvider: 'none',
        rgbHost: '127.0.0.1',
        rgbPort: 6742,
        rgbTargets: [],
        tokenBudget: 0,
        autosaveEnabled: false,
        autosaveIntervalMin: 5,
        autosaveName: 'autosave',
        connectOnStartup: true,
        allowRemoteBridge: false,
        activeProfileId: 'default',
        connectionProfiles: [
          {
            id: 'default',
            name: 'Default',
            baseUrl: 'http://127.0.0.1:11434',
            timeoutMs: 15000,
            retryCount: 2,
            defaultModel: 'llama3'
          }
        ]
      }
    };
    this.state = { ...this.defaultState };
  }

  migrateState(parsed) {
    const input = parsed && typeof parsed === "object" ? { ...parsed } : {};
    const migrated = {
      ...this.defaultState,
      ...input,
      settings: {
        ...this.defaultState.settings,
        ...((input && input.settings) || {})
      }
    };

    const fromVersion = Number(input.stateVersion || 1);
    if (fromVersion < 2) {
      const baseUrl = String(migrated.settings.ollamaBaseUrl || "http://127.0.0.1:11434");
      const timeoutMs = Number(migrated.settings.timeoutMs || 15000);
      const retryCount = Number(migrated.settings.retryCount || 2);
      const inputProfiles = Array.isArray(input.settings && input.settings.connectionProfiles)
        ? input.settings.connectionProfiles
        : [];
      if (!inputProfiles.length) {
        migrated.settings.connectionProfiles = [{
          id: "default",
          name: "Default",
          baseUrl,
          timeoutMs,
          retryCount,
          defaultModel: String(migrated.model || "llama3")
        }];
      }
      if (!migrated.settings.activeProfileId) {
        migrated.settings.activeProfileId = migrated.settings.connectionProfiles[0].id;
      }
      if (typeof migrated.settings.connectOnStartup !== "boolean") {
        migrated.settings.connectOnStartup = true;
      }
      if (typeof migrated.settings.allowRemoteBridge !== "boolean") {
        migrated.settings.allowRemoteBridge = false;
      }
    }
    if (typeof migrated.settings.clockEnabled !== "boolean") {
      migrated.settings.clockEnabled = true;
    }
    if (typeof migrated.settings.clock24h !== "boolean") {
      migrated.settings.clock24h = false;
    }
    if (typeof migrated.settings.clockUtcOffset !== "string" || !migrated.settings.clockUtcOffset.trim()) {
      migrated.settings.clockUtcOffset = "local";
    }
    if (typeof migrated.settings.personalityProfile !== "string" || !migrated.settings.personalityProfile.trim()) {
      migrated.settings.personalityProfile = "balanced";
    }
    if (typeof migrated.settings.safetyPolicy !== "string" || !migrated.settings.safetyPolicy.trim()) {
      migrated.settings.safetyPolicy = "balanced";
    }
    if (typeof migrated.settings.rgbEnabled !== "boolean") {
      migrated.settings.rgbEnabled = false;
    }
    if (typeof migrated.settings.rgbProvider !== "string" || !migrated.settings.rgbProvider.trim()) {
      migrated.settings.rgbProvider = "none";
    }
    if (typeof migrated.settings.rgbHost !== "string" || !migrated.settings.rgbHost.trim()) {
      migrated.settings.rgbHost = "127.0.0.1";
    }
    if (!Number.isFinite(Number(migrated.settings.rgbPort))) {
      migrated.settings.rgbPort = 6742;
    } else {
      migrated.settings.rgbPort = Math.floor(Number(migrated.settings.rgbPort));
    }
    if (!Array.isArray(migrated.settings.rgbTargets)) {
      migrated.settings.rgbTargets = [];
    } else {
      migrated.settings.rgbTargets = migrated.settings.rgbTargets
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 50);
    }

    migrated.stateVersion = this.currentStateVersion;
    return migrated;
  }

  /**
   * Load the persisted state from disk. If the file does not exist or
   * cannot be parsed the default state is kept. Errors are silently
   * ignored so that startup is never prevented.
   */
  load() {
    try {
      const raw = fs.readFileSync(this.stateFile, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = this.migrateState(parsed);
    } catch {
      // Use defaults if reading or parsing fails
      this.state = { ...this.defaultState };
    }
  }

  /**
   * Persist the current state to disk. Errors are silently ignored so
   * that a failed write does not crash the application.
   */
  save() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch {
      // Ignore write errors
    }
  }

  /**
   * Get a property from the state.
   *
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a property in the state and persist the change.
   *
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    this.state[key] = value;
    this.save();
  }

  /**
   * Retrieve the entire state object. Returns a shallow copy to prevent
   * accidental external mutation.
   *
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Merge the provided properties into the state and persist. Only
   * properties defined on the provided object are updated.
   *
   * @param {Object} updates
   */
  setState(updates) {
    this.state = {
      ...this.state,
      ...updates,
      stateVersion: this.currentStateVersion,
      settings: {
        ...(this.state.settings || this.defaultState.settings),
        ...((updates && updates.settings) || {})
      }
    };
    this.save();
  }
}

module.exports = new StateManager();
