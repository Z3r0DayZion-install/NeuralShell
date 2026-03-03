import crypto from 'crypto';

class TenantManager {
  constructor(options = {}) {
    this.tenants = new Map();
    this.defaults = {
      quota: options.defaultQuota || 10000,
      rateLimit: options.defaultRateLimit || 100,
      maxConcurrent: options.defaultMaxConcurrent || 10,
      allowedOrigins: options.defaultAllowedOrigins || [],
      features: options.defaultFeatures || {
        streaming: true,
        caching: true,
        analytics: true,
        customEndpoints: false
      }
    };
    this.listeners = new Set();
  }

  createTenant(tenantData) {
    const id = tenantData.id || crypto.randomUUID();

    const tenant = {
      id,
      name: tenantData.name || 'Unnamed Tenant',
      slug: tenantData.slug || this.generateSlug(tenantData.name || id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      quota: tenantData.quota || this.defaults.quota,
      usage: 0,
      rateLimit: tenantData.rateLimit || this.defaults.rateLimit,
      maxConcurrent: tenantData.maxConcurrent || this.defaults.maxConcurrent,
      allowedOrigins: tenantData.allowedOrigins || this.defaults.allowedOrigins,
      blocked: false,
      features: { ...this.defaults.features, ...tenantData.features },
      metadata: tenantData.metadata || {},
      endpoints: tenantData.endpoints || [],
      apiKeys: [],
      billing: {
        plan: tenantData.billing?.plan || 'free',
        stripeCustomerId: tenantData.billing?.stripeCustomerId || null,
        stripeSubscriptionId: tenantData.billing?.stripeSubscriptionId || null,
        currentPeriodEnd: tenantData.billing?.currentPeriodEnd || null
      }
    };

    this.tenants.set(id, tenant);
    this.emit('tenant:created', tenant);

    return tenant;
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }

  getTenant(id) {
    return this.tenants.get(id);
  }

  getTenantBySlug(slug) {
    for (const tenant of this.tenants.values()) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  updateTenant(id, updates) {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      return null;
    }

    Object.assign(tenant, updates, { updatedAt: Date.now() });
    this.emit('tenant:updated', tenant);

    return tenant;
  }

  deleteTenant(id) {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      return false;
    }

    this.tenants.delete(id);
    this.emit('tenant:deleted', tenant);

    return true;
  }

  blockTenant(id, reason = 'Policy violation') {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      return false;
    }

    tenant.blocked = true;
    tenant.blockedAt = Date.now();
    tenant.blockReason = reason;
    this.emit('tenant:blocked', tenant);

    return true;
  }

  unblockTenant(id) {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      return false;
    }

    tenant.blocked = false;
    tenant.unblockedAt = Date.now();
    this.emit('tenant:unblocked', tenant);

    return true;
  }

  incrementUsage(tenantId, amount = 1) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.usage += amount;

    if (tenant.usage > tenant.quota) {
      this.emit('tenant:quota_exceeded', tenant);
    }

    return tenant.usage;
  }

  resetUsage(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.usage = 0;
    this.emit('tenant:usage_reset', tenant);

    return true;
  }

  checkQuota(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' };
    }

    if (tenant.blocked) {
      return { allowed: false, reason: tenant.blockReason || 'Tenant blocked' };
    }

    if (tenant.usage >= tenant.quota) {
      return { allowed: false, reason: 'Quota exceeded' };
    }

    return {
      allowed: true,
      remaining: tenant.quota - tenant.usage,
      quota: tenant.quota,
      usage: tenant.usage
    };
  }

  listTenants(filter = {}) {
    let results = Array.from(this.tenants.values());

    if (filter.blocked !== undefined) {
      results = results.filter(t => t.blocked === filter.blocked);
    }

    if (filter.plan) {
      results = results.filter(t => t.billing.plan === filter.plan);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.slug.includes(search) ||
        t.id.includes(search)
      );
    }

    return results;
  }

  addApiKey(tenantId, keyData) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    const apiKey = {
      id: crypto.randomUUID(),
      key: `ns_${tenant.slug}_${crypto.randomBytes(16).toString('hex')}`,
      name: keyData.name || 'API Key',
      scopes: keyData.scopes || ['prompt'],
      rateLimit: keyData.rateLimit || tenant.rateLimit,
      createdAt: Date.now(),
      expiresAt: keyData.expiresAt || null,
      lastUsedAt: null,
      revokedAt: null
    };

    tenant.apiKeys.push(apiKey);
    this.emit('tenant:api_key_added', { tenant, apiKey });

    return apiKey;
  }

  revokeApiKey(tenantId, keyId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    const apiKey = tenant.apiKeys.find(k => k.id === keyId);
    if (!apiKey) {
      return false;
    }

    apiKey.revokedAt = Date.now();
    this.emit('tenant:api_key_revoked', { tenant, apiKey });

    return true;
  }

  getTenantStats(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      },
      usage: {
        current: tenant.usage,
        quota: tenant.quota,
        percentUsed: `${((tenant.usage / tenant.quota) * 100).toFixed(2) }%`
      },
      limits: {
        rateLimit: tenant.rateLimit,
        maxConcurrent: tenant.maxConcurrent
      },
      billing: tenant.billing,
      apiKeys: tenant.apiKeys.length,
      endpoints: tenant.endpoints.length,
      features: tenant.features,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  on(event, listener) {
    this.listeners.add({ event, listener });
    return () => this.listeners.delete({ event, listener });
  }

  emit(event, data) {
    for (const { event: e, listener } of this.listeners) {
      if (e === event || e === '*') {
        listener(event, data);
      }
    }
  }
}

class TenantIsolation {
  constructor(tenantManager) {
    this.tenantManager = tenantManager;
    this.contexts = new Map();
  }

  createContext(tenantId, request) {
    const tenant = this.tenantManager.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const quotaCheck = this.tenantManager.checkQuota(tenantId);
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.reason);
    }

    const context = {
      tenantId,
      tenant,
      request,
      startTime: Date.now(),
      tokensUsed: 0,
      requestsMade: 0,
      blocked: false
    };

    this.contexts.set(tenantId, context);
    return context;
  }

  getContext(tenantId) {
    return this.contexts.get(tenantId);
  }

  isolateEndpoint(endpoint, tenant) {
    const isolated = { ...endpoint };

    if (tenant.endpoints.length > 0) {
      const tenantEndpointNames = tenant.endpoints.map(e => e.name);
      if (!tenantEndpointNames.includes(endpoint.name)) {
        return null;
      }
    }

    return isolated;
  }

  isolateConfig(config, tenant) {
    return {
      ...config,
      rateLimit: tenant.rateLimit,
      maxConcurrent: tenant.maxConcurrent,
      features: tenant.features
    };
  }

  checkFeature(tenantId, feature) {
    const tenant = this.tenantManager.getTenant(tenantId);
    if (!tenant) {
      return false;
    }
    return tenant.features[feature] === true;
  }

  enforceRateLimit(context) {
    const { tenant, requestsMade } = context;

    if (requestsMade >= tenant.maxConcurrent) {
      context.blocked = true;
      throw new Error('Concurrent request limit exceeded');
    }

    context.requestsMade++;
    return true;
  }

  finalizeContext(tenantId) {
    const context = this.contexts.get(tenantId);
    if (!context) {
      return;
    }

    this.tenantManager.incrementUsage(tenantId, context.tokensUsed);
    this.contexts.delete(tenantId);
  }
}

export { TenantManager, TenantIsolation };
