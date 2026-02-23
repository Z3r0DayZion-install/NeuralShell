const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const Auth = require('../src/router/auth');

describe('Auth', () => {
  let auth;

  beforeEach(() => {
    auth = new Auth();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(auth.config).toBeDefined();
      expect(auth.providers).toBeDefined();
    });
  });

  describe('OAuth2', () => {
    it('should generate OAuth2 URL', () => {
      const url = auth.generateOAuth2URL('google', { redirectUri: 'http://localhost/callback' });
      expect(url).toContain('accounts.google.com');
    });

    it('should handle OAuth2 callback', async () => {
      const tokens = await auth.handleOAuth2Callback('google', { code: 'test-code' });
      expect(tokens).toBeDefined();
    });
  });

  describe('JWT', () => {
    it('should generate JWT token', () => {
      const token = auth.generateJWT({ userId: '123' }, '1h');
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify JWT token', () => {
      const token = auth.generateJWT({ userId: '123' }, '1h');
      const decoded = auth.verifyJWT(token);
      expect(decoded.userId).toBe('123');
    });

    it('should reject invalid JWT', () => {
      expect(() => auth.verifyJWT('invalid-token')).toThrow();
    });

    it('should reject expired JWT', () => {
      const token = auth.generateJWT({ userId: '123' }, '-1s');
      expect(() => auth.verifyJWT(token)).toThrow('Token expired');
    });
  });

  describe('API Keys', () => {
    it('should generate API key', () => {
      const apiKey = auth.generateAPIKey('user-1');
      expect(apiKey).toBeDefined();
      expect(apiKey.length).toBeGreaterThan(20);
    });

    it('should validate API key', () => {
      const apiKey = auth.generateAPIKey('user-1');
      const valid = auth.validateAPIKey(apiKey);
      expect(valid).toBe(true);
    });

    it('should reject invalid API key', () => {
      const valid = auth.validateAPIKey('invalid-key');
      expect(valid).toBe(false);
    });

    it('should revoke API key', () => {
      const apiKey = auth.generateAPIKey('user-1');
      auth.revokeAPIKey(apiKey);
      const valid = auth.validateAPIKey(apiKey);
      expect(valid).toBe(false);
    });
  });

  describe('Password', () => {
    it('should hash password', async () => {
      const hash = await auth.hashPassword('testpassword');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('testpassword');
    });

    it('should verify password', async () => {
      const hash = await auth.hashPassword('testpassword');
      const valid = await auth.verifyPassword('testpassword', hash);
      expect(valid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await auth.hashPassword('testpassword');
      const valid = await auth.verifyPassword('wrongpassword', hash);
      expect(valid).toBe(false);
    });
  });

  describe('Session', () => {
    it('should create session', () => {
      const session = auth.createSession({ userId: '123' });
      expect(session).toBeDefined();
      expect(session.token).toBeDefined();
    });

    it('should validate session', () => {
      const session = auth.createSession({ userId: '123' });
      const valid = auth.validateSession(session.token);
      expect(valid).toBe(true);
    });

    it('should destroy session', () => {
      const session = auth.createSession({ userId: '123' });
      auth.destroySession(session.token);
      const valid = auth.validateSession(session.token);
      expect(valid).toBe(false);
    });
  });

  describe('OIDC', () => {
    it('should generate OIDC config', () => {
      const config = auth.getOIDCConfig('test-issuer');
      expect(config).toBeDefined();
      expect(config.issuer).toBe('test-issuer');
    });
  });

  describe('middleware', () => {
    it('should create auth middleware', () => {
      const middleware = auth.middleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });
});
