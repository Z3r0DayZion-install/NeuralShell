class ModeRouter {
  constructor(options = {}) {
    this.modes = options.modes || this.getDefaultModes();
    this.defaultMode = options.defaultMode || 'balanced';
    this.strictModeEndpoint = options.strictEndpoint || null;
    this.balancedModeEndpoint = options.balancedEndpoint || null;
    this.creativeModeEndpoint = options.creativeEndpoint || null;
    this.uncensoredModeEndpoint = options.uncensoredEndpoint || null;
  }

  getDefaultModes() {
    return {
      strict: {
        name: 'Strict',
        description: 'Full content filtering - safe for work',
        blockedTerms: ['illegal', 'harmful', 'explicit', 'violence', 'hate'],
        endpoints: [],
        temperature: 0.7,
        maxTokens: 4096
      },
      balanced: {
        name: 'Balanced',
        description: 'Light filtering - most use cases',
        blockedTerms: ['illegal', 'harmful'],
        endpoints: [],
        temperature: 0.8,
        maxTokens: 8192
      },
      creative: {
        name: 'Creative',
        description: 'Minimal filtering - creative writing',
        blockedTerms: ['illegal'],
        endpoints: [],
        temperature: 1.0,
        maxTokens: 16384
      },
      uncensored: {
        name: 'Uncensored',
        description: 'No content filtering - use responsibly',
        blockedTerms: [],
        endpoints: [],
        temperature: 1.2,
        maxTokens: 32768
      }
    };
  }

  setModeEndpoint(mode, endpoint) {
    if (this.modes[mode]) {
      this.modes[mode].endpoints = [endpoint];
    }
  }

  setEndpointsForMode(mode, endpoints) {
    if (this.modes[mode]) {
      this.modes[mode].endpoints = endpoints;
    }
  }

  getMode(mode) {
    return this.modes[mode] || this.modes[this.defaultMode];
  }

  selectEndpoint(mode) {
    const modeConfig = this.getMode(mode);

    if (modeConfig.endpoints && modeConfig.endpoints.length > 0) {
      const idx = Math.floor(Math.random() * modeConfig.endpoints.length);
      return modeConfig.endpoints[idx];
    }

    return null;
  }

  checkContent(mode, content) {
    const modeConfig = this.getMode(mode);

    for (const term of modeConfig.blockedTerms) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        return {
          allowed: false,
          reason: `Content blocked by ${mode} mode`,
          blockedTerm: term
        };
      }
    }

    return { allowed: true };
  }

  getAllModes() {
    return Object.entries(this.modes).map(([key, mode]) => ({
      id: key,
      name: mode.name,
      description: mode.description,
      hasEndpoints: mode.endpoints?.length > 0
    }));
  }
}

export { ModeRouter };
