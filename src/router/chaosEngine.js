import crypto from 'crypto';

class ChaosEngine {
  constructor(options = {}) {
    this.enabled = options.enabled || false;
    this.experiments = new Map();
    this.activeInjections = new Map();
    this.listeners = new Set();
  }

  createExperiment(config) {
    const experiment = {
      id: crypto.randomUUID(),
      name: config.name,
      description: config.description || '',
      type: config.type,
      target: config.target,
      parameters: config.parameters,
      probability: config.probability || 1,
      duration: config.duration,
      enabled: false,
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      stats: {
        injections: 0,
        successes: 0,
        failures: 0
      }
    };

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  enableExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return false;
    }

    experiment.enabled = true;
    experiment.startedAt = Date.now();
    this.emit('experiment:started', experiment);

    if (experiment.duration) {
      setTimeout(() => {
        this.disableExperiment(experimentId);
      }, experiment.duration);
    }

    return true;
  }

  disableExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return false;
    }

    experiment.enabled = false;
    experiment.endedAt = Date.now();
    this.emit('experiment:ended', experiment);

    return true;
  }

  shouldInject(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.enabled) {
      return false;
    }

    return Math.random() < experiment.probability;
  }

  async inject(experimentIdOrType, context = {}) {
    // Support direct type injection for API
    let experiment;
    let experimentId;

    if (typeof experimentIdOrType === 'string' && !this.experiments.has(experimentIdOrType)) {
      // It's a type (e.g. 'latency'), find or create a temp experiment
      const type = experimentIdOrType;
      experimentId = `temp-${type}-${Date.now()}`;
      experiment = {
        id: experimentId,
        type: type,
        target: 'all',
        enabled: true,
        stats: { injections: 0, successes: 0, failures: 0 },
        parameters: { min: 500, max: 2000 } // Default params
      };
      this.experiments.set(experimentId, experiment);
    } else {
      experimentId = experimentIdOrType;
      experiment = this.experiments.get(experimentId);
    }

    if (!experiment || !experiment.enabled) {
      return null;
    }

    const injection = {
      id: crypto.randomUUID(),
      experimentId,
      target: experiment.target,
      injectedAt: Date.now(),
      context
    };

    this.activeInjections.set(injection.id, injection);
    experiment.stats.injections++;
    this.emit('injection:started', injection);

    try {
      switch (experiment.type) {
      case 'latency':
        await this.injectLatency(experiment.parameters);
        break;
      case 'error':
        await this.injectError(experiment.parameters);
        break;
      case 'failure':
        await this.injectFailure(experiment.parameters);
        break;
      case 'blackhole':
        await this.injectBlackhole(experiment.target);
        break;
      case 'partition':
        await this.injectPartition(experiment.parameters);
        break;
      case 'cpu':
        await this.injectCpuPressure(experiment.parameters);
        break;
      case 'memory':
        await this.injectMemoryPressure(experiment.parameters);
        break;
      case 'dns':
        await this.injectDnsFailure(experiment.parameters);
        break;
      default:
        console.warn(`Unknown experiment type: ${experiment.type}`);
      }

      experiment.stats.successes++;
      this.emit('injection:success', injection);

    } catch (err) {
      experiment.stats.failures++;
      this.emit('injection:failed', { injection, error: err.message });
    }

    return injection;
  }

  async injectLatency(params) {
    const ms = params.ms || params.min + Math.random() * (params.max - params.min);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async injectError(params) {
    const error = new Error(params.message || 'Chaos injection error');
    error.code = params.code || 'CHAOS_ERROR';
    error.statusCode = params.statusCode || 500;
    throw error;
  }

  async injectFailure(params) {
    throw {
      failed: true,
      statusCode: params.statusCode || 503,
      message: params.message || 'Service temporarily unavailable (chaos)',
      chaos: true
    };
  }

  async injectBlackhole(target) {
    console.log(`[CHAOS] Blackholing traffic to ${target}`);
  }

  async injectPartition(params) {
    console.log(`[CHAOS] Network partition: ${params.type}`);
  }

  async injectCpuPressure(params) {
    const load = params.load || 80;
    const duration = params.duration || 5000;
    const end = Date.now() + duration;

    while (Date.now() < end) {
      for (let i = 0; i < 10000000; i++) {
        Math.sqrt(i);
      }
    }
  }

  async injectMemoryPressure(params) {
    const size = params.size || 100 * 1024 * 1024;
    const leak = Buffer.alloc(size);
    console.log(`[CHAOS] Memory pressure: allocated ${size} bytes`);
  }

  async injectDnsFailure(params) {
    throw {
      code: 'ENOTFOUND',
      chaos: true,
      message: params.message || 'DNS lookup failed (chaos)'
    };
  }

  resolve(injectionId) {
    const injection = this.activeInjections.get(injectionId);
    if (!injection) {
      return false;
    }

    this.activeInjections.delete(injectionId);
    this.emit('injection:resolved', injection);

    return true;
  }

  getExperiments() {
    return Array.from(this.experiments.values());
  }

  getExperiment(id) {
    return this.experiments.get(id);
  }

  getActiveInjections() {
    return Array.from(this.activeInjections.values());
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

class ChaosScenarios {
  static latencySpike(experimentName, target, params = {}) {
    return {
      name: experimentName,
      description: 'Inject latency spike',
      type: 'latency',
      target,
      parameters: {
        ms: params.ms || null,
        min: params.min || 1000,
        max: params.max || 5000
      },
      probability: params.probability || 0.3,
      duration: params.duration
    };
  }

  static randomError(experimentName, target, params = {}) {
    return {
      name: experimentName,
      description: 'Random error injection',
      type: 'error',
      target,
      parameters: {
        message: params.message || 'Random error',
        code: params.code || 'RANDOM_ERROR',
        statusCode: params.statusCode || 500
      },
      probability: params.probability || 0.1,
      duration: params.duration
    };
  }

  static serviceDown(experimentName, target) {
    return {
      name: experimentName,
      description: 'Simulate service failure',
      type: 'failure',
      target,
      parameters: {
        statusCode: 503,
        message: 'Service down (chaos)'
      },
      probability: 0.05,
      duration: 30000
    };
  }

  static networkPartition(experimentName) {
    return {
      name: experimentName,
      description: 'Network partition simulation',
      type: 'partition',
      target: 'all',
      parameters: {
        type: 'partial',
        packetLoss: 50
      },
      probability: 0.1,
      duration: 15000
    };
  }
}

export { ChaosEngine, ChaosScenarios };
