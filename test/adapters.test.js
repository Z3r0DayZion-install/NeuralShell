const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const Adapters = require('../src/router/adapters');

describe('Adapters', () => {
  let adapters;

  beforeEach(() => {
    adapters = new Adapters();
  });

  describe('constructor', () => {
    it('should initialize with all providers', () => {
      expect(adapters.providers).toBeDefined();
      expect(adapters.providers.openai).toBeDefined();
      expect(adapters.providers.anthropic).toBeDefined();
      expect(adapters.providers.google).toBeDefined();
      expect(adapters.providers.cohere).toBeDefined();
      expect(adapters.providers.mistral).toBeDefined();
      expect(adapters.providers.azure).toBeDefined();
      expect(adapters.providers.bedrock).toBeDefined();
      expect(adapters.providers.ollama).toBeDefined();
      expect(adapters.providers.localai).toBeDefined();
      expect(adapters.providers.togetherai).toBeDefined();
      expect(adapters.providers.groq).toBeDefined();
      expect(adapters.providers.perplexity).toBeDefined();
    });
  });

  describe('getProvider', () => {
    it('should return OpenAI provider', () => {
      const provider = adapters.getProvider('openai');
      expect(provider).toBeDefined();
    });

    it('should return Anthropic provider', () => {
      const provider = adapters.getProvider('anthropic');
      expect(provider).toBeDefined();
    });

    it('should return Google provider', () => {
      const provider = adapters.getProvider('google');
      expect(provider).toBeDefined();
    });

    it('should throw error for unknown provider', () => {
      expect(() => adapters.getProvider('unknown')).toThrow('Unknown provider');
    });
  });

  describe('listProviders', () => {
    it('should list all available providers', () => {
      const list = adapters.listProviders();
      expect(list).toContain('openai');
      expect(list).toContain('anthropic');
      expect(list).toContain('google');
      expect(list.length).toBe(12);
    });
  });

  describe('createRequest', () => {
    it('should create OpenAI request format', () => {
      const request = adapters.createRequest('openai', { prompt: 'test', model: 'gpt-4' });
      expect(request).toBeDefined();
      expect(request.model).toBe('gpt-4');
    });

    it('should create Anthropic request format', () => {
      const request = adapters.createRequest('anthropic', { prompt: 'test', model: 'claude-3' });
      expect(request).toBeDefined();
      expect(request.model).toBe('claude-3');
    });

    it('should create Google request format', () => {
      const request = adapters.createRequest('google', { prompt: 'test', model: 'gemini-pro' });
      expect(request).toBeDefined();
    });
  });

  describe('parseResponse', () => {
    it('should parse OpenAI response', () => {
      const mockResponse = { choices: [{ message: { content: 'test response' } }] };
      const parsed = adapters.parseResponse('openai', mockResponse);
      expect(parsed).toBe('test response');
    });

    it('should parse Anthropic response', () => {
      const mockResponse = { content: [{ text: 'test response' }] };
      const parsed = adapters.parseResponse('anthropic', mockResponse);
      expect(parsed).toBe('test response');
    });
  });

  describe('getEndpoint', () => {
    it('should return OpenAI endpoint', () => {
      const endpoint = adapters.getEndpoint('openai');
      expect(endpoint).toContain('api.openai.com');
    });

    it('should return Ollama endpoint', () => {
      const endpoint = adapters.getEndpoint('ollama');
      expect(endpoint).toContain('localhost');
    });
  });

  describe('getHeaders', () => {
    it('should return OpenAI headers', () => {
      const headers = adapters.getHeaders('openai', 'test-key');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer test-key');
    });

    it('should return Anthropic headers', () => {
      const headers = adapters.getHeaders('anthropic', 'test-key');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-api-key']).toBe('test-key');
    });
  });

  describe('validateConfig', () => {
    it('should validate OpenAI config', () => {
      const config = { apiKey: 'test-key', model: 'gpt-4' };
      const valid = adapters.validateConfig('openai', config);
      expect(valid).toBe(true);
    });

    it('should reject invalid config', () => {
      const config = { model: 'gpt-4' };
      const valid = adapters.validateConfig('openai', config);
      expect(valid).toBe(false);
    });
  });

  describe('getModels', () => {
    it('should return OpenAI models', () => {
      const models = adapters.getModels('openai');
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-3.5-turbo');
    });

    it('should return Anthropic models', () => {
      const models = adapters.getModels('anthropic');
      expect(models).toContain('claude-3-opus');
      expect(models).toContain('claude-3-sonnet');
    });
  });
});
