import crypto from 'crypto';
import { EventEmitter } from 'events';

class Plugin extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name;
    this.version = options.version || '1.0.0';
    this.description = options.description || '';
    this.author = options.author || '';
    this.enabled = false;
    this.config = options.config || {};
    this.priority = options.priority || 100;
    this.hooks = [];
    this.state = {};
  }

  async initialize(router) {
    this.router = router;
    this.enabled = true;
    return this;
  }

  async shutdown() {
    this.enabled = false;
    this.removeAllListeners();
  }

  registerHook(hook, handler) {
    this.hooks.push({ hook, handler });
  }

  async callHook(hook, ...args) {
    for (const { hook: h, handler } of this.hooks) {
      if (h === hook || h === '*') {
        try {
          await handler(...args);
        } catch (err) {
          console.error(`Plugin ${this.name} hook ${hook} error:`, err.message);
        }
      }
    }
  }
}

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.plugins = new Map();
    this.hooks = new Map();
    this.middleware = [];
    this.transformers = {
      request: [],
      response: []
    };
    this.routers = [];
  }

  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    this.plugins.set(plugin.name, plugin);

    for (const { hook } of plugin.hooks) {
      if (!this.hooks.has(hook)) {
        this.hooks.set(hook, []);
      }
      this.hooks.get(hook).push({
        plugin: plugin.name,
        priority: plugin.priority,
        handler: null
      });
    }

    this.emit('plugin:registered', plugin);

    return this;
  }

  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    for (const [hook, handlers] of this.hooks) {
      const index = handlers.findIndex(h => h.plugin === pluginName);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    plugin.shutdown();
    this.plugins.delete(pluginName);

    this.emit('plugin:unregistered', pluginName);

    return true;
  }

  enable(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    plugin.enabled = true;
    this.emit('plugin:enabled', pluginName);

    return true;
  }

  disable(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    plugin.enabled = false;
    this.emit('plugin:disabled', pluginName);

    return true;
  }

  getPlugin(pluginName) {
    return this.plugins.get(pluginName);
  }

  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      enabled: p.enabled,
      priority: p.priority
    }));
  }

  async executeHook(hook, ...args) {
    const handlers = this.hooks.get(hook) || [];

    handlers.sort((a, b) => b.priority - a.priority);

    for (const { plugin, handler } of handlers) {
      const p = this.plugins.get(plugin);
      if (!p || !p.enabled) {
        continue;
      }

      if (handler) {
        await handler.call(p, ...args);
      } else {
        await p.callHook(hook, ...args);
      }
    }
  }

  addMiddleware(middleware) {
    this.middleware.push({
      name: middleware.name || 'anonymous',
      priority: middleware.priority || 100,
      handler: middleware.handler,
      enabled: true
    });

    this.middleware.sort((a, b) => b.priority - a.priority);

    return this;
  }

  async executeMiddleware(context, type = 'request') {
    for (const mw of this.middleware) {
      if (!mw.enabled) {
        continue;
      }

      try {
        const result = await mw.handler(context, type);
        if (result === false) {
          return { aborted: true, reason: `Middleware ${mw.name} aborted` };
        }
      } catch (err) {
        console.error(`Middleware ${mw.name} error:`, err.message);
        return { aborted: true, reason: err.message };
      }
    }

    return { aborted: false };
  }

  addRequestTransformer(transformer) {
    this.transformers.request.push({
      name: transformer.name,
      priority: transformer.priority || 100,
      transform: transformer.transform
    });
    this.transformers.request.sort((a, b) => b.priority - a.priority);

    return this;
  }

  addResponseTransformer(transformer) {
    this.transformers.response.push({
      name: transformer.name,
      priority: transformer.priority || 100,
      transform: transformer.transform
    });
    this.transformers.response.sort((a, b) => b.priority - a.priority);

    return this;
  }

  async transformRequest(request) {
    let transformed = request;

    for (const { transform } of this.transformers.request) {
      transformed = await transform(transformed) || transformed;
    }

    return transformed;
  }

  async transformResponse(response) {
    let transformed = response;

    for (const { transform } of this.transformers.response) {
      transformed = await transform(transformed) || transformed;
    }

    return transformed;
  }

  registerRouter(name, router) {
    this.routers.push({
      name,
      router,
      enabled: true
    });

    return this;
  }

  getRouters() {
    return this.routers.filter(r => r.enabled);
  }
}

function createPlugin(name, options = {}) {
  return new Plugin({ name, ...options });
}

export { Plugin, PluginManager, createPlugin };
