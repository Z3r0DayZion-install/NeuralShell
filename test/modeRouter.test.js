const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const ModeRouter = require('../src/router/modeRouter');

describe('ModeRouter', () => {
  let modeRouter;

  beforeEach(() => {
    modeRouter = new ModeRouter();
  });

  describe('constructor', () => {
    it('should initialize with default modes', () => {
      expect(modeRouter.modes).toBeDefined();
      expect(modeRouter.modes.strict).toBeDefined();
      expect(modeRouter.modes.balanced).toBeDefined();
      expect(modeRouter.modes.creative).toBeDefined();
      expect(modeRouter.modes.uncensored).toBeDefined();
    });

    it('should have default mode as balanced', () => {
      expect(modeRouter.defaultMode).toBe('balanced');
    });
  });

  describe('route', () => {
    it('should route to strict mode provider', async () => {
      const result = await modeRouter.route('test prompt', { mode: 'strict' });
      expect(result).toBeDefined();
      expect(result.mode).toBe('strict');
    });

    it('should route to balanced mode provider', async () => {
      const result = await modeRouter.route('test prompt', { mode: 'balanced' });
      expect(result).toBeDefined();
      expect(result.mode).toBe('balanced');
    });

    it('should route to creative mode provider', async () => {
      const result = await modeRouter.route('test prompt', { mode: 'creative' });
      expect(result).toBeDefined();
      expect(result.mode).toBe('creative');
    });

    it('should route to uncensored mode provider', async () => {
      const result = await modeRouter.route('test prompt', { mode: 'uncensored' });
      expect(result).toBeDefined();
      expect(result.mode).toBe('uncensored');
    });

    it('should use default mode when not specified', async () => {
      const result = await modeRouter.route('test prompt');
      expect(result).toBeDefined();
    });

    it('should throw error for invalid mode', async () => {
      await expect(modeRouter.route('test', { mode: 'invalid' }))
        .rejects.toThrow('Invalid mode');
    });
  });

  describe('getModeConfig', () => {
    it('should return strict mode config', () => {
      const config = modeRouter.getModeConfig('strict');
      expect(config).toBeDefined();
      expect(config.filters).toBeDefined();
    });

    it('should return balanced mode config', () => {
      const config = modeRouter.getModeConfig('balanced');
      expect(config).toBeDefined();
    });

    it('should return creative mode config', () => {
      const config = modeRouter.getModeConfig('creative');
      expect(config).toBeDefined();
    });

    it('should return uncensored mode config', () => {
      const config = modeRouter.getModeConfig('uncensored');
      expect(config).toBeDefined();
    });
  });

  describe('addMode', () => {
    it('should add custom mode', () => {
      const customMode = {
        name: 'custom',
        providers: ['custom-provider'],
        filters: { maxTokens: 10000 },
        temperature: 0.7
      };
      modeRouter.addMode('custom', customMode);
      expect(modeRouter.modes.custom).toBeDefined();
    });
  });

  describe('removeMode', () => {
    it('should remove custom mode', () => {
      modeRouter.addMode('temp', { providers: ['test'] });
      modeRouter.removeMode('temp');
      expect(modeRouter.modes.temp).toBeUndefined();
    });

    it('should not remove default modes', () => {
      expect(() => modeRouter.removeMode('strict')).toThrow('Cannot remove default mode');
    });
  });

  describe('getAvailableModes', () => {
    it('should return all available modes', () => {
      const modes = modeRouter.getAvailableModes();
      expect(modes).toContain('strict');
      expect(modes).toContain('balanced');
      expect(modes).toContain('creative');
      expect(modes).toContain('uncensored');
    });
  });

  describe('applyFilters', () => {
    it('should apply strict filters', () => {
      const filtered = modeRouter.applyFilters('test prompt', 'strict');
      expect(filtered).toBeDefined();
    });

    it('should apply balanced filters', () => {
      const filtered = modeRouter.applyFilters('test prompt', 'balanced');
      expect(filtered).toBeDefined();
    });
  });

  describe('selectProvider', () => {
    it('should select provider based on mode', async () => {
      const provider = await modeRouter.selectProvider('strict');
      expect(provider).toBeDefined();
    });
  });
});
