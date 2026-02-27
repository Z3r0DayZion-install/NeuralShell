import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { loadConfig } from './src/router/config.js';
import { RouterCore } from './src/router/routerCore.js';
import { RedisBackend, RedisRateLimiter, RedisCache } from './src/router/redis.js';
import { PrometheusExporter } from './src/router/prometheus.js';
import { StreamManager } from './src/router/streaming.js';
import { createGraphQLRouter } from './src/router/graphql.js';
import { APIKeyManager } from './src/router/auth.js';
import { TenantManager, TenantIsolation } from './src/router/multitenancy.js';
import { CostTracker, BillingManager } from './src/router/costTracking.js';
import { ChaosEngine } from './src/router/chaosEngine.js';
import { LoadBalancer } from './src/router/loadBalancer.js';
import { PluginManager } from './src/router/pluginSystem.js';
import { ModeRouter } from './src/router/modeRouter.js';
import { HealthCheck, StandardHealthChecks } from './src/router/healthCheck.js';
import { SecurityLogger } from './src/router/securityLogger.js';
import { ConfigValidator, validateEnvironment } from './src/router/configValidator.js';
import { AutonomyController } from './src/router/autonomyController.js';
import { ReplayEngine } from './replayEngine.js';
import { DecisionQueryAPI } from './src/intelligence/queryAPI.js';
import { SentimentPlugin } from './src/plugins/sentimentPlugin.js';
import { RagPlugin } from './src/plugins/ragPlugin.js';
import { GenesisPlugin } from './src/plugins/genesisPlugin.js';
import { GraphMapper } from './src/intelligence/graphMapper.js';
import { Orchestrator } from './src/intelligence/orchestrator.js';
import { bootstrapSwarm } from './src/swarm/bootstrapper.js';
import { EvolutionEngine } from './src/intelligence/evolutionEngine.js';
import { FederationNode } from './src/swarm/federationNode.js';
import { MeshNode } from './src/hive/meshNode.js';
import { GlobalLedger } from './src/economy/ledger.js';
import { GlobalMarketplace } from './src/economy/marketplace.js';
import { GlobalToolForge } from './src/forge/toolForge.js';

function isLoopbackAddress(addr) {
  const ip = String(addr || '');
  return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.');
}

function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function normalizeRemoteAddress(addr) {
  const ip = String(addr || '').trim().toLowerCase();
  if (ip.startsWith('::ffff:')) {
    return ip.slice('::ffff:'.length);
  }
  return ip;
}

function isWeakToken(value) {
  const token = String(value || '').trim();
  if (!token) {
    return true;
  }
  const normalized = token.toLowerCase();
  if (token.length < 16) {
    return true;
  }
  const placeholders = new Set([
    'changeme',
    'change-me',
    'change_me',
    'password',
    'admin',
    'token',
    'prompt',
    'secret',
    'test',
    'default',
    '1234',
    '12345',
    '123456',
    'qwerty'
  ]);
  if (placeholders.has(normalized)) {
    return true;
  }
  if (normalized.includes('change-me') || normalized.includes('changeme')) {
    return true;
  }
  return false;
}

function parseIpv4ToInt(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) {
    return null;
  }
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

function ipv4InCidr(ip, cidr) {
  const s = String(cidr || '').trim();
  const idx = s.indexOf('/');
  if (idx === -1) {
    return false;
  }
  const base = s.slice(0, idx).trim();
  const prefixRaw = s.slice(idx + 1).trim();
  const prefixLen = Number(prefixRaw);
  if (!Number.isInteger(prefixLen) || prefixLen < 0 || prefixLen > 32) {
    return false;
  }
  const ipInt = parseIpv4ToInt(ip);
  const baseInt = parseIpv4ToInt(base);
  if (ipInt === null || baseInt === null) {
    return false;
  }
  const mask = prefixLen === 0 ? 0 : (0xffffffff << (32 - prefixLen)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function ipMatchesRule(ip, rule) {
  const remote = normalizeRemoteAddress(ip);
  const raw = String(rule || '').trim().toLowerCase();
  if (!raw) {
    return false;
  }

  if (raw === 'localhost' || raw === 'loopback') {
    return isLoopbackAddress(remote);
  }

  if (raw.includes('/')) {
    if (ipv4InCidr(remote, raw)) {
      return true;
    }
    // IPv6 CIDR is not currently supported; allow exact IPv6 matches only.
    return false;
  }

  if (raw === remote) {
    return true;
  }

  return false;
}

function ipMatchesAny(ip, rules) {
  const list = Array.isArray(rules) ? rules : [];
  for (const rule of list) {
    if (ipMatchesRule(ip, rule)) {
      return true;
    }
  }
  return false;
}

export class NeuralShellServer {
  constructor(options = {}) {
    this.options = options;
    this.config = null;
    this.app = null;
    this.server = null; // HTTP server handle
    this._httpsOptions = null;
    this.runtimeMetrics = {
      startedAtMs: Date.now(),
      requestsTotal: 0,
      failuresTotal: 0
    };
    this._shutdownInProgress = false;
    this.router = null;
    this.isHoneyPot = false;
    this.redis = null;
    this.rateLimiter = null;
    this.cache = null;
    this.prometheus = null;
    this.streamManager = null;
    this.apiKeyManager = null;
    this.tenantManager = null;
    this.tenantIsolation = null;
    this.costTracker = null;
    this.billingManager = null;
    this.chaosEngine = null;
    this.loadBalancer = null;
    this.pluginManager = null;
    this.healthCheck = null;
    this.securityLogger = null;
    this.autonomyController = null;
    this.replayEngine = null;
    this.orchestrator = null;
    this.swarmBootstrap = null;
    this.federationNode = null;
    this.evolutionEngine = null;
    this.meshNode = null;
    this._security = null;
    this._warnedOpenAdmin = false;
    this._warnedOpenPrompt = false;
  }

  async initialize(configPath = null) {
    // Validate environment first
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error('Environment validation failed:', envValidation.errors);
      throw new Error('Invalid environment configuration');
    }
    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings);
    }

    if (configPath) {
      this.config = await loadConfig(configPath);
    } else {
      this.config = this.getDefaultConfig();
    }

    // Validate configuration
    const validator = new ConfigValidator();
    const validation = validator.validate(this.config);
    if (!validation.valid) {
      console.error('Configuration validation failed:', validation.errors);
      throw new Error('Invalid configuration');
    }
    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:', validation.warnings);
    }

    const envHost = String(process.env.HOST || '').trim();
    if (envHost) {
      this.config.server = { ...(this.config.server || {}), host: envHost };
    }

    const profileRaw = String(process.env.NS_PROFILE || this.config.server?.profile || 'local')
      .trim()
      .toLowerCase();
    const profile = profileRaw || 'local';
    if (!['local', 'lan', 'public'].includes(profile)) {
      throw new Error(`Invalid NS_PROFILE/server.profile: '${profileRaw}'. Use: local | lan | public.`);
    }

    const configuredAdminToken =
      String(this.config.security?.adminToken || '').trim() || String(process.env.ADMIN_TOKEN || '').trim();
    const configuredPromptToken =
      String(this.config.security?.promptToken || '').trim() || String(process.env.PROMPT_TOKEN || '').trim();
    const bindHost = String(this.config.server?.host || '0.0.0.0');
    const bindsToPublic = !isLoopbackAddress(bindHost) && bindHost !== 'localhost';

    const corsAllowedOrigins = Array.isArray(this.config.security?.corsAllowedOrigins)
      ? this.config.security.corsAllowedOrigins
      : [];
    if ((profile === 'lan' || profile === 'public') && corsAllowedOrigins.includes('*')) {
      throw new Error('Refusing to start: CORS wildcard (*) is not allowed in NS_PROFILE=lan/public.');
    }

    const adminIpAllowlist = Array.isArray(this.config.security?.adminIpAllowlist)
      ? this.config.security.adminIpAllowlist
      : [];
    if (bindsToPublic && (profile === 'lan' || profile === 'public') && adminIpAllowlist.length === 0) {
      throw new Error(
        `Refusing to start: NS_PROFILE=${profile} with server.host=${bindHost} requires security.adminIpAllowlist (CIDR or IPs).`
      );
    }

    if ((profile === 'lan' || profile === 'public') && !configuredAdminToken) {
      throw new Error(`Refusing to start: NS_PROFILE=${profile} requires ADMIN_TOKEN/security.adminToken.`);
    }
    if ((profile === 'lan' || profile === 'public') && !configuredPromptToken) {
      throw new Error(`Refusing to start: NS_PROFILE=${profile} requires PROMPT_TOKEN/security.promptToken.`);
    }
    if ((profile === 'lan' || profile === 'public') && isWeakToken(configuredAdminToken)) {
      throw new Error(
        `Refusing to start: NS_PROFILE=${profile} requires a strong ADMIN_TOKEN/security.adminToken (>=16 chars; not a placeholder).`
      );
    }
    if ((profile === 'lan' || profile === 'public') && isWeakToken(configuredPromptToken)) {
      throw new Error(
        `Refusing to start: NS_PROFILE=${profile} requires a strong PROMPT_TOKEN/security.promptToken (>=16 chars; not a placeholder).`
      );
    }

    if (bindsToPublic && !configuredPromptToken) {
      throw new Error(
        `Refusing to start: server.host=${bindHost} is not loopback but security.promptToken is empty. Set PROMPT_TOKEN/ security.promptToken.`
      );
    }

    const allowInsecureHttp = String(process.env.NS_ALLOW_INSECURE_HTTP || '').trim() === '1';
    const tlsConfig = this.config.server?.tls && typeof this.config.server.tls === 'object' ? this.config.server.tls : {};
    const tlsEnabled = tlsConfig.enabled === true || String(process.env.NS_TLS || '').trim() === '1';

    if (bindsToPublic && (profile === 'lan' || profile === 'public') && !tlsEnabled && !allowInsecureHttp) {
      throw new Error(
        `Refusing to start: NS_PROFILE=${profile} with server.host=${bindHost} requires TLS (server.tls.enabled=true) ` +
          'or set NS_ALLOW_INSECURE_HTTP=1 for trusted isolated LANs.'
      );
    }

    const resolveMaybeRelativePath = (p) => {
      const raw = String(p || '').trim();
      if (!raw) {
        return '';
      }
      return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
    };

    let tlsMeta = { enabled: false };
    if (tlsEnabled) {
      const pfxPath = resolveMaybeRelativePath(tlsConfig.pfxPath || process.env.NS_TLS_PFX);
      const pfxPassphraseEnv = String(tlsConfig.pfxPassphraseEnv || '').trim();
      const pfxPassphrase =
        (pfxPassphraseEnv && process.env[pfxPassphraseEnv]) || String(process.env.NS_TLS_PFX_PASSPHRASE || '');

      const certPath = resolveMaybeRelativePath(tlsConfig.certPath || process.env.NS_TLS_CERT);
      const keyPath = resolveMaybeRelativePath(tlsConfig.keyPath || process.env.NS_TLS_KEY);
      const caPath = resolveMaybeRelativePath(tlsConfig.caPath || process.env.NS_TLS_CA);
      const requireClientCert =
        tlsConfig.requireClientCert === true || String(process.env.NS_TLS_REQUIRE_CLIENT_CERT || '').trim() === '1';

      if (!pfxPath && (!certPath || !keyPath)) {
        throw new Error('TLS is enabled but either server.tls.pfxPath or (server.tls.certPath + server.tls.keyPath) is required.');
      }
      if (pfxPath && !fs.existsSync(pfxPath)) {
        throw new Error(`TLS is enabled but pfxPath does not exist: ${pfxPath}`);
      }
      if (!pfxPath && !fs.existsSync(certPath)) {
        throw new Error(`TLS is enabled but certPath does not exist: ${certPath}`);
      }
      if (!pfxPath && !fs.existsSync(keyPath)) {
        throw new Error(`TLS is enabled but keyPath does not exist: ${keyPath}`);
      }
      if (requireClientCert && !caPath) {
        throw new Error('TLS mTLS is enabled (requireClientCert=true) but server.tls.caPath is empty.');
      }
      if (requireClientCert && caPath && !fs.existsSync(caPath)) {
        throw new Error(`TLS mTLS is enabled but caPath does not exist: ${caPath}`);
      }

      const httpsOptions = {};
      if (pfxPath) {
        httpsOptions.pfx = fs.readFileSync(pfxPath);
        if (pfxPassphrase) {
          httpsOptions.passphrase = pfxPassphrase;
        }
      } else {
        httpsOptions.cert = fs.readFileSync(certPath);
        httpsOptions.key = fs.readFileSync(keyPath);
      }
      if (caPath && fs.existsSync(caPath)) {
        httpsOptions.ca = fs.readFileSync(caPath);
      }
      if (requireClientCert) {
        httpsOptions.requestCert = true;
        httpsOptions.rejectUnauthorized = true;
      }

      this._httpsOptions = httpsOptions;
      tlsMeta = { enabled: true, requireClientCert, pfxPath, pfxPassphraseEnv, certPath, keyPath, caPath };
    } else {
      this._httpsOptions = null;
      tlsMeta = { enabled: false };
    }

    const adminToken =
      configuredAdminToken || (profile === 'local' ? crypto.randomBytes(24).toString('hex') : '');
    if (!configuredAdminToken && profile === 'local') {
      console.warn(
        `[Security] security.adminToken is empty; generated ephemeral ADMIN token for this session: ${adminToken}`
      );
    }

    this._security = {
      profile,
      adminToken,
      promptToken: configuredPromptToken,
      bindsToPublic,
      ipAllowlist: Array.isArray(this.config.security?.ipAllowlist) ? this.config.security.ipAllowlist : [],
      ipDenylist: Array.isArray(this.config.security?.ipDenylist) ? this.config.security.ipDenylist : []
    };
    this._security.adminIpAllowlist = adminIpAllowlist;
    this._security.allowInsecureHttp = allowInsecureHttp;
    this._security.tls = tlsMeta;

    const fastifyLoggerEnabled =
      (this.config.logging?.level || 'info') !== 'error' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.PROOF_MODE !== '1';

    const http2Requested = this.config.server?.enableHttp2 === true;
    if (http2Requested && !this._httpsOptions) {
      console.warn('[Server] server.enableHttp2 requested but TLS is not enabled; ignoring http2.');
    }

    this.app = Fastify({
      logger: fastifyLoggerEnabled,
      trustProxy: this.config.server?.trustProxy === true || process.env.TRUST_PROXY === '1',
      requestTimeout: this.config.server?.requestTimeoutMs || 5000,
      bodyLimit: this.config.server?.requestBodyLimitBytes || 262144,
      http2: Boolean(this._httpsOptions) && http2Requested,
      https: this._httpsOptions || undefined
    });

    this.app.addHook('onRequest', async (request, reply) => {
      const remote = normalizeRemoteAddress(
        request?.ip || request?.socket?.remoteAddress || request?.raw?.socket?.remoteAddress || ''
      );

      const deny = (reason) => {
        reply.status(403);
        reply.send({ error: 'FORBIDDEN', message: reason });
        return reply;
      };

      if (ipMatchesAny(remote, this._security.ipDenylist)) {
        return deny('IP denied');
      }
      if (this._security.ipAllowlist.length > 0 && !ipMatchesAny(remote, this._security.ipAllowlist)) {
        return deny('IP not allowlisted');
      }

      return null;
    });

    this.app.addHook('preHandler', async (request, reply) => {
      const authMode = request?.routeOptions?.config?.auth || request?.context?.config?.auth;
      if (!authMode) {
        return null;
      }

      const deny = (code, error, message) => {
        reply.status(code);
        reply.send({ error, message });
        return reply;
      };

      if (authMode === 'admin') {
        const remote = normalizeRemoteAddress(
          request?.ip || request?.socket?.remoteAddress || request?.raw?.socket?.remoteAddress || ''
        );
        if (this._security.adminIpAllowlist?.length > 0 && !ipMatchesAny(remote, this._security.adminIpAllowlist)) {
          return deny(403, 'ADMIN_IP_FORBIDDEN', 'Forbidden');
        }
        const token = String(request.headers['x-admin-token'] || '').trim();
        if (!token || !constantTimeEqual(token, this._security.adminToken)) {
          return deny(401, 'ADMIN_AUTH_FAILED', 'Unauthorized');
        }
        return null;
      }

      if (authMode === 'prompt') {
        if (!this._security.promptToken) {
          if (!this._warnedOpenPrompt) {
            this._warnedOpenPrompt = true;
            console.warn('[Security] security.promptToken is empty; /prompt is running unauthenticated (loopback-only recommended).');
          }
          return null;
        }
        const token = String(request.headers['x-prompt-token'] || '').trim();
        if (!token || !constantTimeEqual(token, this._security.promptToken)) {
          return deny(401, 'PROMPT_AUTH_FAILED', 'Unauthorized');
        }
        return null;
      }

      return deny(500, 'AUTH_MISCONFIG', `Unknown auth mode: ${String(authMode)}`);
    });

    this.app.addHook('onResponse', async (_request, reply) => {
      this.runtimeMetrics.requestsTotal += 1;
      if (reply.statusCode >= 400) {
        this.runtimeMetrics.failuresTotal += 1;
      }
    });

    this.app.register(fastifyStatic, {
      root: path.join(process.cwd(), 'public'),
      prefix: '/public/'
    });

    await this.app.register(fastifyWebsocket);

    // Initialize security logger
    this.securityLogger = new SecurityLogger({
      namespace: 'neuralshell',
      logLevel: this.config.logging?.level || 'info'
    });

    // Apply security headers
    if (this.config.security?.enableSecurityHeaders !== false) {
      this.app.addHook('onRequest', async (request, reply) => {
        // Security headers
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-XSS-Protection', '1; mode=block');
        const forwardedProto = String(request.headers['x-forwarded-proto'] || '')
          .split(',')[0]
          .trim()
          .toLowerCase();
        const isTls = Boolean(request?.raw?.socket?.encrypted) || forwardedProto === 'https';
        if (isTls) {
          reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Remove server header
        reply.removeHeader('X-Powered-By');
        reply.removeHeader('Server');
      });
    }

    await this.initializeRedis();
    await this.initializeRouter();
    this.initializePrometheus();
    this.initializeStreamManager();
    this.initializeAuth();
    this.initializeTenancy();
    this.initializeCostTracking();
    this.initializeChaos();
    this.initializeLoadBalancer();
    await this.initializePlugins();
    this.initializeModeRouter();
    this.initializeHealthCheck();
    this.initializeAutonomy();
    this.initializeReplayEngine();
    this.initializeEvolution();
    this.initializeFederation();
    this.initializeHive();
    await this.registerRoutes();

    return this;
  }

  async initializeHive() {
    if (process.env.HIVE_ENABLED === '1') {
      try {
        const port = parseInt(process.env.HIVE_PORT || '4000');
        const peers = process.env.HIVE_PEERS ? process.env.HIVE_PEERS.split(',') : [];
        this.meshNode = new MeshNode(port, peers);
        console.log('[Server] Hive Mesh configured (will start after server listen)');
      } catch (err) {
        console.warn('[Server] Hive init failed:', err.message);
      }
    }

    // Economy API
    this.app.get('/api/economy/ledger', { config: { auth: 'admin' } }, async () => {
      return {
        balances: Object.fromEntries(GlobalLedger.balances),
        history: GlobalLedger.getHistory().slice(-50)
      };
    });

    this.app.get('/api/economy/market', { config: { auth: 'admin' } }, async () => {
      return { listings: GlobalMarketplace.getListings() };
    });

    this.app.post('/api/economy/buy', { config: { auth: 'admin' } }, async (req, reply) => {
      const { buyerId, listingId } = req.body;
      try {
        // For demo, if buyerId is missing, we treat it as 'admin-user' with infinite money
        const buyer = buyerId || 'admin-user';
        if (!GlobalLedger.balances.has(buyer)) {
          GlobalLedger.createWallet(buyer, 99999);
        }

        const asset = GlobalMarketplace.buyAsset(buyer, listingId);
        return { success: true, asset };
      } catch (err) {
        return reply.code(400).send({ error: err.message });
      }
    });

    // Swarm API
    this.app.get('/api/swarm/status', { config: { auth: 'admin' } }, async () => {
      return {
        orchestrator: this.orchestrator ? 'ONLINE' : 'OFFLINE',
        agents: [
          { id: 'researcher-01', role: 'researcher', status: 'ONLINE' },
          { id: 'coder-01', role: 'coder', status: 'ONLINE' },
          { id: 'architect-01', role: 'architect', status: 'ONLINE' },
          { id: 'dreamer-01', role: 'dreamer', status: 'DREAMING' }
        ],
        tasksPending: this.orchestrator?.activeTasks?.size || 0
      };
    });

    this.app.get('/api/swarm/optimizations', { config: { auth: 'admin' } }, async () => {
      return { optimizations: this.orchestrator?.optimizations || [] };
    });

    this.app.get('/mobile', { config: { auth: 'admin' } }, async (request, reply) => {
      reply.type('text/html').send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Sovereign Controller</title>
  <style>
    body { background: #000; color: #00f0ff; font-family: monospace; padding: 20px; }
    .btn { background: #111; border: 1px solid #00f0ff; color: #00f0ff; padding: 15px; width: 100%; margin-bottom: 10px; font-size: 1rem; border-radius: 8px; }
    .stat { font-size: 0.8rem; opacity: 0.7; margin-bottom: 20px; }
    .header { font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">NEURAL EMPIRE // MOBILE UPLINK</div>
  <div class="stat">System: ONLINE | NC: ACTIVE</div>
  <button class="btn" onclick="fetch('/api/swarm/status')">SWARM STATUS</button>
  <button class="btn" onclick="alert('Deployment Locked')">GENESIS DEPLOY</button>
  <button class="btn" style="border-color: #f00; color: #f00;" onclick="confirm('Nuclear Purge?') && fetch('/admin/security/lockdown', {method:'POST'})">NUCLEAR PURGE</button>
  <script>
    // Minimal interactivity for the mobile bridge
  </script>
</body>
</html>
      `);
    });

    this.app.post('/admin/config/quine-lock', { config: { auth: 'admin' } }, async (req) => {
      const { locked } = req.body;
      process.env.QUINE_CODE_LOCK = locked ? '1' : '0';
      return { success: true, locked: process.env.QUINE_CODE_LOCK === '1' };
    });

    this.app.post('/admin/security/lockdown', { config: { auth: 'admin' } }, async (_req) => {
      this.isHoneyPot = true;
      console.error('[Iron Sentry] 🛡️ GLOBAL LOCKDOWN ACTIVATED. ENTERING HONEY POT MODE.');
      return { success: true, mode: 'HONEY_POT' };
    });

    // Tools API
    this.app.get('/api/swarm/tools', { config: { auth: 'admin' } }, async () => {
      return { tools: await GlobalToolForge.listTools() };
    });

    this.app.post('/api/swarm/tools/invent', { config: { auth: 'admin' } }, async (req, reply) => {
      const { name, spec } = req.body;
      if (!this.orchestrator) {
        return reply.code(503).send({ error: 'Orchestrator offline' });
      }

      // Send task to coder
      await this.orchestrator.bus.pushTask('coder', {
        type: 'invent_tool',
        data: { name, spec }
      });

      this.broadcast('cognitive:event', { agent: 'Orchestrator', content: `Forging new tool: ${name}` });
      return { success: true, message: `Tool invention task for "${name}" sent to Swarm.` };
    });

    // Genesis Apps API (provided by GenesisPlugin when plugins are enabled)
    if (!this.genesisPlugin) {
      this.app.get('/api/genesis/apps', { config: { auth: 'admin' } }, async () => {
        if (this.orchestrator && this.orchestrator.genesis) {
          return { apps: this.orchestrator.genesis.containerManager.listActive() };
        }
        return { apps: [] };
      });
    }
  }

  broadcast(type, payload) {
    if (!this.app.websocketServer) {
      return;
    }
    const msg = JSON.stringify({ type, payload });
    for (const client of this.app.websocketServer.clients) {
      if (client.readyState === 1) {
        client.send(msg);
      }
    }
  }

  initializeFederation() {
    if (process.env.FEDERATION_ENABLED === '1') {
      try {
        this.federationNode = new FederationNode();
        console.log('[Server] Federation Node configured (will start after server listen)');
      } catch (err) {
        console.warn('[Server] Federation init failed:', err.message);
      }
    }
  }

  initializeEvolution() {
    if (process.env.EVOLUTION_ENABLED === '1') {
      this.evolutionEngine = new EvolutionEngine(this.options.configPath || './config.yaml');
      console.log('[Server] Evolution Engine configured (will start after server listen)');
    }
  }

  async initializeSwarm() {
    if (process.env.SWARM_ENABLED === '1') {
      try {
        this.orchestrator = new Orchestrator(this.router, (event) => {
          this.broadcast('cognitive:event', event);
        });
        await this.orchestrator.start();

        // Launch local agents (for single-container deployment)
        this.swarmBootstrap = await bootstrapSwarm(this.router);
        console.log('[Server] Swarm Intelligence active');
      } catch (err) {
        console.warn('[Server] Swarm initialization failed:', err.message);
      }
    }
  }

  initializeReplayEngine() {
    // Only initialize if configured or needed
    if (this.config.features?.replay !== false) {
      try {
        const queryAPI = new DecisionQueryAPI();
        this.replayEngine = new ReplayEngine(queryAPI);
        console.log('[Server] ReplayEngine initialized');
      } catch (err) {
        console.warn('[Server] Failed to initialize ReplayEngine:', err.message);
      }
    }
  }

  getDefaultConfig() {
    return {
      version: '1.0.0',
      server: {
        port: 3000,
        host: '127.0.0.1',
        profile: 'local',
        trustProxy: false,
        enableHttp2: false,
        tls: {
          enabled: false,
          certPath: '',
          keyPath: '',
          caPath: '',
          requireClientCert: false
        },
        requestTimeoutMs: 5000,
        maxConcurrentRequests: 100,
        gracefulShutdownTimeoutMs: 30000
      },
      endpoints: [
        {
          name: 'ollama-local',
          url: 'http://localhost:11434/api/chat',
          model: 'llama3',
          weight: 10,
          priority: 1,
          enabled: true,
          timeoutMs: 30000
        },
        {
          name: 'openai-backup',
          url: 'https://api.openai.com/v1/chat/completions',
          model: 'gpt-3.5-turbo',
          weight: 5,
          priority: 2,
          enabled: true
        }
      ],
      routing: {
        strategy: 'adaptive',
        adaptive: true,
        maxRetries: 1
      },
      rateLimit: {
        enabled: true,
        requestsPerWindow: 120,
        windowMs: 60000
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeoutMs: 30000
      },
      cache: {
        enabled: true,
        ttlSeconds: 300
      },
      security: {
        enableSecurityHeaders: true,
        corsAllowedOrigins: []
      },
      logging: {
        level: 'info',
        format: 'json'
      },
      monitoring: {
        prometheusEnabled: true,
        prometheusPort: 9090
      },
      persistence: {
        enabled: true
      },
      limits: {
        maxMessagesPerRequest: 64,
        maxMessageChars: 8000
      },
      features: {
        streaming: true,
        idempotency: true
      }
    };
  }

  async retryOperation(operation, name, retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        await operation();
        console.log(`[Bootloader] ${name} initialized successfully.`);
        return;
      } catch (err) {
        console.warn(`[Bootloader] ${name} failed (Attempt ${i + 1}/${retries}): ${err.message}`);
        if (i === retries - 1) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  async initializeRedis() {
    if (this.config.redis?.enabled) {
      this.redis = new RedisBackend({
        url: this.config.redis.url || process.env.REDIS_URL,
        prefix: this.config.redis.prefix || 'neuralshell:'
      });

      await this.retryOperation(() => this.redis.connect(), 'Redis Backend');

      this.rateLimiter = new RedisRateLimiter(this.redis, {
        windowMs: this.config.rateLimit?.windowMs || 60000,
        maxRequests: this.config.rateLimit?.requestsPerWindow || 120
      });

      this.cache = new RedisCache(this.redis, {
        ttl: this.config.cache?.ttlSeconds || 300
      });
    }
  }

  async initializeRouter() {
    this.router = new RouterCore({
      port: this.config.server?.port || 3000,
      timeoutMs: this.config.server?.requestTimeoutMs || 5000,
      maxConcurrent: this.config.server?.maxConcurrentRequests || 100,
      cache: this.config.cache,
      circuitBreaker: this.config.circuitBreaker
    });

    for (const ep of this.config.endpoints || []) {
      this.router.addEndpoint(ep);
      this.loadBalancer?.addEndpoint(ep.name, ep.url, ep.weight);
    }
  }

  initializePrometheus() {
    this.prometheus = new PrometheusExporter({
      namespace: 'neuralshell',
      subsystem: 'production'
    });

    const formatBaseMetrics = () => {
      const uptimeSeconds = Number(process.uptime().toFixed(2));
      const lines = [
        '# HELP neuralshell_uptime_seconds Process uptime in seconds',
        '# TYPE neuralshell_uptime_seconds gauge',
        `neuralshell_uptime_seconds ${uptimeSeconds}`,
        '# HELP neuralshell_requests_total Total HTTP requests served',
        '# TYPE neuralshell_requests_total counter',
        `neuralshell_requests_total ${this.runtimeMetrics.requestsTotal}`,
        '# HELP neuralshell_failures_total Total HTTP requests that returned >= 400',
        '# TYPE neuralshell_failures_total counter',
        `neuralshell_failures_total ${this.runtimeMetrics.failuresTotal}`
      ];
      return `${lines.join('\n')}\n`;
    };

    this.app.get('/metrics', async (request, reply) => {
      reply.header('cache-control', 'no-store');
      reply.type('text/plain; version=0.0.4');
      // Proof-only metrics failure injection. Never enabled in production.
      // Active only when NODE_ENV==='test' OR PROOF_MODE=1 AND request is localhost-only.
      if (process.env.PROOF_FORCE_METRICS_FAIL === '1') {
        const proofEnabled = process.env.PROOF_MODE === '1' || process.env.NODE_ENV === 'test';
        if (proofEnabled) {
          const remote = request?.socket?.remoteAddress || request?.raw?.socket?.remoteAddress || '';
          if (isLoopbackAddress(remote)) {
            // Intentionally invalid/insufficient metrics payload.
            return '# PROOF_FORCE_METRICS_FAIL=1\n# metrics intentionally corrupted\ninvalid_metric_payload 1\n';
          }
        }
      }
      return formatBaseMetrics();
    });

    this.app.get('/metrics/prometheus', async (_req, reply) => {
      reply.header('cache-control', 'no-store');
      reply.type('text/plain; version=0.0.4');
      const extra = this.prometheus.export();
      return `${formatBaseMetrics()}\n${extra}`;
    });
  }

  initializeStreamManager() {
    this.streamManager = new StreamManager({
      maxStreams: this.config.limits?.maxConcurrentRequests || 100,
      streamTimeoutMs: 300000
    });
  }

  initializeAuth() {
    this.apiKeyManager = new APIKeyManager();

    if (this.config.security?.defaultApiKey) {
      this.apiKeyManager.generateKey({
        name: 'default',
        prefix: 'ns'
      });
    }
  }

  initializeTenancy() {
    this.tenantManager = new TenantManager({
      defaultQuota: this.config.limits?.defaultQuota || 10000,
      defaultRateLimit: this.config.rateLimit?.requestsPerWindow || 120
    });
    this.tenantIsolation = new TenantIsolation(this.tenantManager);
  }

  initializeCostTracking() {
    this.costTracker = new CostTracker({
      defaultPrices: {
        input: this.config.pricing?.inputPer1k || 0.001,
        output: this.config.pricing?.outputPer1k || 0.002
      },
      modelPrices: this.config.pricing?.models || {}
    });
    this.billingManager = new BillingManager({ costTracker: this.costTracker });
  }

  initializeChaos() {
    this.chaosEngine = new ChaosEngine({
      enabled: this.config.chaos?.enabled || false
    });
  }

  initializeLoadBalancer() {
    this.loadBalancer = new LoadBalancer({
      strategy: this.config.routing?.strategy || 'adaptive'
    });
  }

  async initializePlugins() {
    this.pluginManager = new PluginManager();

    if (process.env.PLUGINS_ENABLED === '0' || this.config.features?.plugins === false) {
      console.log('[Server] Plugins disabled');
      return;
    }

    // Register built-in plugins
    const initPlugin = async (PluginClass, label) => {
      try {
        const plugin = new PluginClass();
        this.pluginManager.register(plugin);
        await plugin.initialize(this);
        console.log(`[Server] ${label} registered`);
        return plugin;
      } catch (err) {
        console.warn(`[Server] Failed to initialize ${label}:`, err instanceof Error ? err.message : String(err));
        return null;
      }
    };

    await initPlugin(SentimentPlugin, 'SentimentPlugin');
    const ragPlugin = await initPlugin(RagPlugin, 'RagPlugin');
    this.genesisPlugin = await initPlugin(GenesisPlugin, 'GenesisPlugin');

    if (ragPlugin && ragPlugin.enabled) {
      this.graphMapper = new GraphMapper(ragPlugin.memory);
      this.app.get('/api/knowledge/graph', async () => {
        return await this.graphMapper.generateGraph();
      });
    }
  }

  initializeModeRouter() {
    this.modeRouter = new ModeRouter({
      defaultMode: this.config.modes?.default || 'balanced',
      modes: this.config.modes
    });

    if (this.config.endpoints) {
      for (const [modeName, modeConfig] of Object.entries(this.config.modes || {})) {
        if (modeConfig.endpoints) {
          const modeEndpoints = this.config.endpoints.filter(ep =>
            modeConfig.endpoints.includes(ep.name)
          );
          this.modeRouter.setEndpointsForMode(modeName, modeEndpoints);
        }
      }
    }
  }

  initializeHealthCheck() {
    this.healthCheck = new HealthCheck({ timeout: 5000 });

    // Register standard health checks
    this.healthCheck.register('redis', StandardHealthChecks.redis(this.redis), {
      critical: false
    });

    this.healthCheck.register('router', StandardHealthChecks.router(this.router), {
      critical: true
    });

    this.healthCheck.register('memory', StandardHealthChecks.memory(90), {
      critical: false
    });

    this.healthCheck.register('uptime', StandardHealthChecks.uptime(0), {
      critical: false
    });
  }

  initializeAutonomy() {
    // Read feature flags from environment
    const featureFlags = {
      AUTO_HEALING: process.env.AUTO_HEALING,
      AUTO_SCALING: process.env.AUTO_SCALING,
      AUTO_ANOMALY_DETECTION: process.env.AUTO_ANOMALY_DETECTION,
      AUTO_PROCESS_MANAGEMENT: process.env.AUTO_PROCESS_MANAGEMENT,
      AUTO_SECRET_ROTATION: process.env.AUTO_SECRET_ROTATION,
      AUTO_COST_MANAGEMENT: process.env.AUTO_COST_MANAGEMENT,
      AUTO_THREAT_DETECTION: process.env.AUTO_THREAT_DETECTION,
      AUTO_OPTIMIZATION: process.env.AUTO_OPTIMIZATION,
      AUTO_CANARY_DEPLOYMENT: process.env.AUTO_CANARY_DEPLOYMENT
    };

    // Check kill switch
    if (process.env.AUTONOMY_KILL_SWITCH === '1') {
      console.log('Autonomy kill switch enabled - autonomous systems disabled');
      return;
    }

    // Check if any autonomous systems are enabled
    const anyEnabled = Object.values(featureFlags).some(v => v === '1');
    if (!anyEnabled) {
      console.log('No autonomous systems enabled');
      return;
    }

    // Initialize AutonomyController
    // Pass feature flags as direct properties, not nested
    this.autonomyController = new AutonomyController({
      ...featureFlags,
      DRY_RUN: process.env.DRY_RUN,
      AUTONOMY_KILL_SWITCH: process.env.AUTONOMY_KILL_SWITCH
    });

    console.log('[Server] AutonomyController initialized, will start after server listen');

    // Wire RouterCore events to AutonomyController
    if (this.router) {
      this.router.on('endpoint_failure', (data) => {
        this.autonomyController.emit('endpoint_failure', data);
      });
      this.router.on('request_completed', (data) => {
        this.autonomyController.emit('request_completed', data);
      });
    }
  }

  async registerRoutes() {
    const proofRoutesEnabled = process.env.PROOF_MODE === '1' || process.env.NODE_ENV === 'test';
    const proofToken = proofRoutesEnabled ? String(process.env.NS_PROOF_TOKEN || '') : '';

    function assertProofAuthOrThrow(request, reply) {
      const remote = request?.socket?.remoteAddress || request?.raw?.socket?.remoteAddress || '';
      if (!isLoopbackAddress(remote)) {
        reply.status(403);
        return { ok: false, error: 'PROOF_FORBIDDEN', message: 'Proof route is localhost-only' };
      }
      const token = String(request?.headers?.['x-neuralshell-proof-token'] || '');
      if (!proofToken || token !== proofToken) {
        reply.status(403);
        return { ok: false, error: 'PROOF_FORBIDDEN', message: 'Proof token required' };
      }
      return null;
    }
    // 1. Register Swagger
    await this.app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'NeuralShell Sovereign Gateway',
          description: 'Industrial-grade AI Routing & Swarm Intelligence API',
          version: '2.0.0'
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'x-prompt-token', in: 'header' },
            adminKey: { type: 'apiKey', name: 'x-admin-token', in: 'header' }
          }
        }
      }
    });

    await this.app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: false }
    });

    // Enhanced health check endpoint
    this.app.get('/health', async () => {
      const health = await this.healthCheck.runAll();
      return health;
    });

    // Kubernetes liveness probe
    this.app.get('/health/live', async (req, reply) => {
      const alive = await this.healthCheck.isAlive();
      if (!alive) {
        reply.status(503);
        return { alive: false };
      }
      return { alive: true };
    });

    // Kubernetes readiness probe
    this.app.get('/health/ready', async (req, reply) => {
      const ready = await this.healthCheck.isReady();
      if (!ready) {
        reply.status(503);
        return { ready: false };
      }
      return {
        ready: true,
        redis: this.redis?.isConnected() || false,
        endpoints: this.router?.getEndpointStats()?.length || 0,
        tenants: this.tenantManager?.tenants?.size || 0
      };
    });

    // Legacy ready endpoint (deprecated)
    this.app.get('/ready', async () => ({
      ready: true,
      redis: this.redis?.isConnected() || false,
      endpoints: this.router?.getEndpointStats()?.length || 0,
      tenants: this.tenantManager?.tenants?.size || 0
    }));

    this.app.get('/metrics/json', { config: { auth: 'admin' } }, async () => this.router?.getMetrics() || {});

    // Proof-only upstream stub (used by scripts/runtime_proof.cjs). Never enabled in production.
    if (proofRoutesEnabled) {
      this.app.post('/__proof/ollama', async (request, reply) => {
        const auth = assertProofAuthOrThrow(request, reply);
        if (auth) {
          return auth;
        }
        const body = request.body || {};
        if (!body || typeof body !== 'object') {
          reply.status(400);
          return { error: 'INVALID_REQUEST', message: 'JSON body required' };
        }
        reply.status(200);
        return { response: 'ok' };
      });

      this.app.post('/__proof/shutdown', async (request, reply) => {
        const auth = assertProofAuthOrThrow(request, reply);
        if (auth) {
          return auth;
        }

        reply.status(200);
        reply.send({ ok: true });

        const t = setTimeout(async () => {
          const hard = setTimeout(() => process.exit(0), 2000);
          hard.unref?.();
          try {
            await this.stop();
          } catch {
            // ignore
          }
          try {
            clearTimeout(hard);
          } catch {
            // ignore
          }
          process.exit(0);
        }, 10);
        t.unref?.();

        return reply;
      });
    }

    this.app.get('/endpoints', { config: { auth: 'admin' } }, async () => {
      const exposeUrls =
        process.env.EXPOSE_ENDPOINT_URLS === '1' || this.config.security?.exposeEndpointUrls === true;
      const endpoints = this.router?.endpoints
        ? Array.from(this.router.endpoints.values()).map((ep) => ({
          name: ep.name,
          url: exposeUrls ? ep.url : undefined,
          model: ep.model,
          enabled: ep.enabled,
          weight: ep.weight,
          timeoutMs: ep.timeoutMs,
          costPer1kInput: ep.costPer1kInput,
          costPer1kOutput: ep.costPer1kOutput
        }))
        : [];

      return { endpoints };
    });

    this.app.post('/endpoints/reset', { config: { auth: 'admin' } }, async () => {
      this.router?.resetEndpoints();
      return { success: true };
    });

    this.app.post('/metrics/reset', { config: { auth: 'admin' } }, async () => {
      this.router?.resetMetrics();
      return { success: true };
    });

    this.app.post('/prompt', { config: { auth: 'prompt' } }, async (request, reply) => {
      if (this.isHoneyPot) {
        return {
          choices: [{ message: { role: 'assistant', content: 'System stalled. Frequency pollution detected. Signal Law enforcement active.' } }],
          _meta: { status: 'DECOY' }
        };
      }
      const clientKey = request.headers['x-prompt-token'] || request.ip;

      if (this.config.rateLimit?.enabled && this.rateLimiter) {
        const allowed = await this.rateLimiter.isAllowed(`prompt:${clientKey}`);
        if (!allowed.allowed) {
          reply.status(429);
          return {
            error: 'RATE_LIMITED',
            message: 'Too many requests',
            retryAfter: allowed.retryAfter
          };
        }
      }

      const { messages, model, temperature, max_tokens, stream, mode, webSearch } = request.body || {};

      if (!messages || !Array.isArray(messages)) {
        reply.status(400);
        return { error: 'INVALID_PAYLOAD', message: 'messages array required' };
      }

      if (this.config.features?.dryRun) {
        if (stream) {
          reply.header('Content-Type', 'text/event-stream');
          reply.header('Cache-Control', 'no-cache');
          reply.header('Connection', 'keep-alive');
          reply.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'dry-run' } }] })}\n\n`);
          reply.write('data: [DONE]\n\n');
          return reply;
        }
        return {
          id: `dryrun-${Date.now()}`,
          model: model || 'dry-run',
          choices: [{ message: { role: 'assistant', content: 'dry-run' } }],
          _meta: { dryRun: true }
        };
      }

      // Proof-only deterministic failure injection (used by scripts/runtime_proof.cjs).
      // Production-safe: only active in NODE_ENV==='test' or PROOF_MODE=1.
      if (proofRoutesEnabled && String(request.headers['x-proof-fail'] || '') === '1') {
        const remote = request?.socket?.remoteAddress || request?.raw?.socket?.remoteAddress || '';
        if (!isLoopbackAddress(remote)) {
          reply.status(403);
          return { error: 'PROOF_FORBIDDEN', message: 'Proof failure injection is localhost-only' };
        }
        reply.status(500);
        return { error: 'PROOF_FORCED_FAILURE', message: 'Forced failure injection (proof-only)' };
      }

      // Intercept Web Search
      if (webSearch && this.orchestrator) {
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content;
        if (lastUserMessage) {
          await this.orchestrator.bus.pushTask('researcher', {
            type: 'web_search',
            data: { query: lastUserMessage }
          });
          // For now, we continue to normal prompt after tasking researcher,
          // or we could block and wait. For speed, we just signal the researcher.
        }
      }

      // Execute Plugin Middleware
      if (this.pluginManager) {
        const context = { body: request.body, headers: request.headers };
        const mwResult = await this.pluginManager.executeMiddleware(context, 'request');
        if (mwResult.aborted) {
          reply.status(403);
          return { error: 'PLUGIN_ABORTED', message: mwResult.reason };
        }
      }

      const activeMode = mode || this.modeRouter?.defaultMode || 'balanced';

      // Intercept Swarm Mode
      if (activeMode === 'swarm' && this.orchestrator) {
        const prompt = messages.map(m => m.content).join('\n');
        const swarmResult = await this.orchestrator.dispatch(prompt);
        if (swarmResult.handled) {
          return {
            id: `swarm-${Date.now()}`,
            model: 'swarm-intelligence',
            choices: [{
              message: { role: 'assistant', content: swarmResult.message }
            }],
            _meta: { swarm: swarmResult }
          };
        }
      }

      const modeConfig = this.modeRouter?.getMode(activeMode);

      if (modeConfig) {
        const contentCheck = this.modeRouter.checkContent(activeMode, messages.map(m => m.content).join(' '));
        if (!contentCheck.allowed) {
          reply.status(403);
          return {
            error: 'BLOCKED_CONTENT',
            message: contentCheck.reason,
            blockedTerm: contentCheck.blockedTerm,
            mode: activeMode
          };
        }
      }

      let endpoint = null;
      if (modeConfig?.endpoints?.length > 0) {
        endpoint = this.modeRouter.selectEndpoint(activeMode);
      }

      if (stream) {
        return this.handleStreaming(request, reply, { messages, model, temperature, max_tokens, endpoint });
      }

      const result = await this.router.executeRequest({ messages, model, temperature, max_tokens }, { endpoint });
      return { ...result, mode: activeMode };
    });

    this.app.get('/v1/models', async () => ({
      data: (this.router?.getEndpointStats() || []).map(ep => ({
        id: ep.name,
        object: 'model',
        created: Date.now(),
        owned_by: 'neuralshell'
      }))
    }));

    this.app.post('/graphql', { config: { auth: 'admin' } }, async (req, reply) => {
      const graphql = createGraphQLRouter({
        health: () => ({ ok: true }),
        metrics: () => this.router?.getMetrics() || {},
        endpoints: () => this.router?.getEndpointStats() || [],
        version: () => this.config.version
      });
      return graphql.handle(req, reply);
    });

    this.app.get('/graphql/schema', { config: { auth: 'admin' } }, async () => ({
      schema: createGraphQLRouter({}).getSchemaSDL()
    }));

    this.app.get('/admin/tenants', { config: { auth: 'admin' } }, async () => ({
      tenants: this.tenantManager?.listTenants() || []
    }));

    this.app.get('/admin/costs', { config: { auth: 'admin' } }, async () =>
      this.costTracker?.getAllTenantsSummary() || []
    );

    this.app.get('/admin/chaos', { config: { auth: 'admin' } }, async () => ({
      experiments: this.chaosEngine?.getExperiments() || [],
      active: this.chaosEngine?.getActiveInjections() || []
    }));

    this.app.get('/admin/plugins', { config: { auth: 'admin' } }, async () => ({
      plugins: this.pluginManager?.listPlugins() || []
    }));

    this.app.get('/modes', async () => ({
      modes: this.modeRouter?.getAllModes() || [],
      default: this.modeRouter?.defaultMode || 'balanced'
    }));

    this.app.get('/modes/:mode', async (request) => {
      const mode = this.modeRouter?.getMode(request.params.mode);
      if (!mode) {
        return { error: 'MODE_NOT_FOUND' };
      }
      return mode;
    });

    // Autonomy endpoints
    this.app.get('/metrics/autonomy', async (request, reply) => {
      reply.type('text/plain');

      if (!this.autonomyController) {
        // Return empty Prometheus metrics when autonomy is disabled
        return `# HELP autonomy_enabled Whether autonomous systems are enabled
# TYPE autonomy_enabled gauge
autonomy_enabled 0

# HELP autonomy_modules_total Total number of autonomous modules
# TYPE autonomy_modules_total gauge
autonomy_modules_total 0
`;
      }

      const prometheusMetrics = this.autonomyController.getPrometheusMetrics();
      return prometheusMetrics;
    });

    this.app.get('/admin/autonomy', { config: { auth: 'admin' } }, async (request, reply) => {
      if (!this.autonomyController) {
        reply.status(503);
        return { error: 'AUTONOMY_NOT_ENABLED', message: 'Autonomous systems not enabled' };
      }

      const status = this.autonomyController.getStatus();
      const metrics = this.autonomyController.getMetrics();

      return {
        ...status,
        metrics,
        uptime: process.uptime()
      };
    });

    // Replay Engine Endpoints
    this.app.post('/admin/replay/start', { config: { auth: 'admin' } }, async (request, reply) => {
      if (!this.replayEngine) {
        reply.status(503);
        return { error: 'REPLAY_NOT_AVAILABLE', message: 'Replay Engine not initialized' };
      }

      const config = request.body || {};
      if (!config.timeRange) {
        reply.status(400);
        return { error: 'INVALID_CONFIG', message: 'timeRange is required' };
      }

      try {
        // Start replay asynchronously
        this.replayEngine.replayDecisions(config).catch(err => {
          console.error('Replay failed:', err);
        });

        return { success: true, message: 'Replay started', config };
      } catch (err) {
        reply.status(500);
        return { error: 'REPLAY_START_FAILED', message: err.message };
      }
    });

    this.app.post('/admin/replay/stop', { config: { auth: 'admin' } }, async (request, reply) => {
      if (!this.replayEngine) {
        reply.status(503);
        return { error: 'REPLAY_NOT_AVAILABLE', message: 'Replay Engine not initialized' };
      }

      try {
        this.replayEngine.stopReplay();
        return { success: true, message: 'Replay stop requested' };
      } catch (err) {
        reply.status(500);
        return { error: 'REPLAY_STOP_FAILED', message: err.message };
      }
    });

    this.app.get('/admin/replay/status', { config: { auth: 'admin' } }, async (request, reply) => {
      if (!this.replayEngine) {
        reply.status(503);
        return { error: 'REPLAY_NOT_AVAILABLE', message: 'Replay Engine not initialized' };
      }
      return this.replayEngine.getMetrics();
    });

    // Chaos API
    this.app.post('/admin/chaos/inject', { config: { auth: 'admin' } }, async (request, reply) => {
      if (!this.chaosEngine) {
        reply.status(503);
        return { error: 'CHAOS_NOT_AVAILABLE', message: 'Chaos Engine not initialized' };
      }
      const { type } = request.body || {};
      if (!type) {
        reply.status(400);
        return { error: 'INVALID_REQUEST', message: 'Type is required' };
      }

      try {
        const result = await this.chaosEngine.inject(type);
        return { success: true, injection: result };
      } catch (err) {
        reply.status(500);
        return { error: 'CHAOS_FAILED', message: err.message };
      }
    });

    this.app.register(async (ws) => {
      this.app.websocketServer = ws.websocketServer;
      ws.get('/ws', { websocket: true }, (connection, _req) => {
        connection.socket.on('message', async (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'prompt') {
              const result = await this.router?.executeRequest(msg.payload);
              connection.socket.send(JSON.stringify({ type: 'response', data: result }));
            }
          } catch (err) {
            connection.socket.send(JSON.stringify({ type: 'error', error: err.message }));
          }
        });
      });
    });

  }

  async handleStreaming(request, reply, payload) {
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');

    const requestId = `chatcmpl-${Date.now()}`;
    reply.write(`data: ${JSON.stringify({ id: requestId, choices: [{}] })}\n\n`);

    try {
      const endpoint = this.router.selectEndpoint();
      if (!endpoint) {
        reply.write('data: {"error":"NO_ENDPOINTS"}\n\n');
        return reply;
      }

      await this.router.callEndpoint(endpoint, payload, {
        stream: true,
        onChunk: (chunk) => {
          const data = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
          reply.write('data: ' + data + '\n\n');
        }
      });

      reply.write('data: ' + JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] }) + '\n\n');
      reply.write('data: [DONE]\n\n');
    } catch (err) {
      reply.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }

    return reply;
  }

  async start() {
    const configuredPort = process.env.PORT ?? this.config.server?.port ?? 3000;
    const port = Number(configuredPort);
    if (!Number.isFinite(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid port: ${configuredPort}`);
    }
    const host = this.config.server?.host || '0.0.0.0';
    const proofMode = process.env.NODE_ENV === 'test' || process.env.PROOF_MODE === '1';

    console.log(`NeuralShell starting with ${this.config.endpoints?.length || 0} endpoints`);

    let didListen = false;
    try {
      await this.app.listen({ port, host });
      didListen = true;
    } catch (err) {
      const code = err && typeof err === 'object' ? err.code : null;
      if (code === 'EADDRINUSE') {
        if (proofMode && Number.isFinite(port) && port > 0) {
          console.log(`[proof-port] Port collision on ${port}; retrying with ephemeral port`);
          await this.app.listen({ port: 0, host });
          didListen = true;
        } else {
          throw new Error(
            `Port ${port} is already in use. Set PORT or server.port in config.yaml to a free port.`
          );
        }
      } else {
        throw err;
      }
    }
    if (!didListen) {
      throw new Error('Server failed to listen (unknown error)');
    }

    // Get the actual server from Fastify
    this.server = this.app.server;

    const addr = this.server && typeof this.server.address === 'function' ? this.server.address() : null;
    const actualPort = addr && typeof addr === 'object' && typeof addr.port === 'number' ? addr.port : port;
    const scheme = this._httpsOptions ? 'https' : 'http';
    if (proofMode) {
      console.log(`Server listening at http://127.0.0.1:${actualPort}`);
    } else {
      console.log(`Server listening at ${scheme}://${host}:${actualPort}`);
    }

    // Start autonomous systems AFTER server is listening
    if (this.autonomyController) {
      console.log('[Server] Starting AutonomyController...');
      await this.autonomyController.start();
      console.log('[Server] AutonomyController started');
    }

    if (this.meshNode) {
      try {
        await this.meshNode.start();
        console.log('[Server] Hive Mesh active');
      } catch (err) {
        console.warn('[Server] Hive start failed:', err?.message || String(err));
      }
    }

    if (this.federationNode) {
      try {
        await this.federationNode.start();
        console.log('[Server] Federation Node active');
      } catch (err) {
        console.warn('[Server] Federation start failed:', err?.message || String(err));
      }
    }

    if (this.evolutionEngine) {
      try {
        await this.evolutionEngine.start();
        console.log('[Server] Evolution Engine active');
      } catch (err) {
        console.warn('[Server] Evolution start failed:', err?.message || String(err));
      }
    }

    await this.initializeSwarm();

    return this;
  }

  async stop() {
    console.log('[Server] Stopping server...');

    if (this.app) {
      try {
        await this.app.close();
      } catch (err) {
        console.warn('[Server] Fastify close failed:', err?.message || String(err));
      }
    }

    // Stop autonomous systems first
    if (this.autonomyController) {
      console.log('[Server] Stopping AutonomyController...');
      await this.autonomyController.stop();
      console.log('[Server] AutonomyController stopped');
    }

    if (this.swarmBootstrap?.stop) {
      try {
        await this.swarmBootstrap.stop();
      } catch (err) {
        console.warn('[Server] Swarm agents stop failed:', err?.message || String(err));
      }
      this.swarmBootstrap = null;
    }

    if (this.orchestrator?.stop) {
      try {
        await this.orchestrator.stop();
      } catch (err) {
        console.warn('[Server] Orchestrator stop failed:', err?.message || String(err));
      }
      this.orchestrator = null;
    }

    if (this.federationNode?.stop) {
      try {
        await this.federationNode.stop();
      } catch (err) {
        console.warn('[Server] Federation stop failed:', err?.message || String(err));
      }
      this.federationNode = null;
    }

    if (this.evolutionEngine?.stop) {
      try {
        await this.evolutionEngine.stop();
      } catch (err) {
        console.warn('[Server] Evolution stop failed:', err?.message || String(err));
      }
      this.evolutionEngine = null;
    }

    if (this.meshNode?.stop) {
      try {
        await this.meshNode.stop();
      } catch (err) {
        console.warn('[Server] Hive stop failed:', err?.message || String(err));
      }
      this.meshNode = null;
    }

    // Cleanup other resources
    if (this.redis) {
      await this.redis.disconnect();
    }
    if (this.router) {
      await this.router.shutdown();
      this.router = null;
    }
    if (this.loadBalancer?.shutdown) {
      try {
        this.loadBalancer.shutdown();
      } catch (err) {
        console.warn('[Server] LoadBalancer shutdown failed:', err?.message || String(err));
      }
    }
    if (this.streamManager) {
      this.streamManager.destroy();
    }

    console.log('[Server] Server stopped');
  }

  async shutdown() {
    if (this._shutdownInProgress) {
      return;
    }
    this._shutdownInProgress = true;
    try {
      await this.stop();
    } finally {
      // keep _shutdownInProgress true to prevent re-entry
    }
  }

  getApp() {
    return this.app;
  }

  getRouter() {
    return this.router;
  }
}

export async function createServer(options = {}) {
  const server = new NeuralShellServer(options);
  await server.initialize(options.configPath);
  return server;
}

const currentFilePath = fileURLToPath(import.meta.url);
const executionFilePath = process.argv[1];

// Normalize paths for cross-platform comparison (handle Windows backslashes and casing)
const isMainModule = currentFilePath && executionFilePath &&
  path.resolve(currentFilePath).toLowerCase() === path.resolve(executionFilePath).toLowerCase();

if (isMainModule) {

  let server = null;

  const startServer = async () => {
    console.log('Starting NeuralShell server...');
    try {
      server = await createServer({
        configPath: process.env.CONFIG_PATH || './config.yaml'
      });

      console.log('Server created, starting...');
      await server.start();
      console.log('Server started!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to start NeuralShell server: ${msg}`);
      process.exit(1);
    }
  };

  const stopServer = async () => {
    if (server) {
      console.log('Shutting down gracefully...');
      await server.stop();
      server = null;
    }
  };

  // Start the server
  await startServer();

  // Graceful shutdown handlers
  if (typeof process.send === 'function') {
    process.on('message', async (msg) => {
      if (msg === 'shutdown' || msg?.type === 'shutdown') {
        console.log('IPC shutdown requested');
        try {
          await stopServer();
          process.exit(0);
        } catch (error) {
          console.error('IPC shutdown failed:', error);
          process.exit(1);
        }
      }
    });
  }

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await stopServer();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received');
    await stopServer();
    process.exit(0);
  });

  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await stopServer();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await stopServer();
    process.exit(1);
  });
}
