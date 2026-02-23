/**
 * Self-Healing Orchestrator
 * Coordinates all self-healing capabilities across the system
 */

import { EventEmitter } from 'events';

// Optional decision engine import
let getDecisionEngine = null;
try {
  const module = await import('../intelligence/decisionEngine.js');
  getDecisionEngine = module.getDecisionEngine;
} catch (err) {
  console.log('[SelfHealing] Decision engine not available (optional)');
}

export class SelfHealingOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.healingStrategies = new Map();
    this.healingHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.cooldownMs = options.cooldownMs || 5000;
    this.lastHealingAttempts = new Map();
    
    this.metrics = {
      totalHealingAttempts: 0,
      successfulHeals: 0,
      failedHeals: 0,
      preventedHeals: 0
    };

    // Initialize Decision Intelligence Engine (optional)
    this.decisionEngine = getDecisionEngine ? getDecisionEngine() : null;
    this.decisionEngineEnabled = options.decisionEngineEnabled !== false && this.decisionEngine !== null;
  }

  /**
   * Register a healing strategy
   */
  registerStrategy(name, strategy) {
    this.healingStrategies.set(name, {
      name,
      handler: strategy.handler,
      condition: strategy.condition,
      priority: strategy.priority || 5,
      maxRetries: strategy.maxRetries || 3,
      enabled: strategy.enabled !== false
    });
  }

  /**
   * Attempt to heal a detected issue
   */
  async heal(issue) {
    if (!this.enabled) {
      return { healed: false, reason: 'self_healing_disabled' };
    }

    const decisionStartTime = Date.now();

    // Check cooldown
    const lastAttempt = this.lastHealingAttempts.get(issue.type);
    if (lastAttempt && Date.now() - lastAttempt < this.cooldownMs) {
      this.metrics.preventedHeals++;
      
      // Record decision event for prevented healing
      await this.recordDecisionEvent({
        decision_type: 'healing',
        context: {
          trigger: 'issue_detected',
          metrics: { cooldown_remaining_ms: this.cooldownMs - (Date.now() - lastAttempt) },
          state: { issue_type: issue.type, cooldown_active: true }
        },
        action_taken: {
          type: 'no_action',
          parameters: { reason: 'cooldown_active' }
        },
        outcome: {
          status: 'unknown',
          duration_ms: Date.now() - decisionStartTime,
          impact: { healed: 0 }
        }
      });

      return { healed: false, reason: 'cooldown_active' };
    }

    this.metrics.totalHealingAttempts++;
    this.lastHealingAttempts.set(issue.type, Date.now());

    // Find applicable strategies
    const strategies = Array.from(this.healingStrategies.values())
      .filter(s => s.enabled && (!s.condition || s.condition(issue)))
      .sort((a, b) => b.priority - a.priority);

    if (strategies.length === 0) {
      // Record decision event for no applicable strategy
      await this.recordDecisionEvent({
        decision_type: 'healing',
        context: {
          trigger: 'issue_detected',
          metrics: { available_strategies: 0 },
          state: { issue_type: issue.type, issue_details: issue }
        },
        action_taken: {
          type: 'no_action',
          parameters: { reason: 'no_applicable_strategy' }
        },
        outcome: {
          status: 'failure',
          duration_ms: Date.now() - decisionStartTime,
          impact: { healed: 0 }
        }
      });

      return { healed: false, reason: 'no_applicable_strategy' };
    }

    // Try each strategy
    for (const strategy of strategies) {
      try {
        const result = await this.executeStrategy(strategy, issue);
        
        if (result.success) {
          this.metrics.successfulHeals++;
          this.recordHealing(issue, strategy, result);
          this.emit('healed', { issue, strategy: strategy.name, result });

          // Record successful decision event
          await this.recordDecisionEvent({
            decision_type: 'healing',
            context: {
              trigger: 'issue_detected',
              metrics: { 
                attempt_number: result.attempt,
                strategies_available: strategies.length 
              },
              state: { 
                issue_type: issue.type, 
                issue_details: issue,
                strategy_priority: strategy.priority
              }
            },
            action_taken: {
              type: strategy.name,
              parameters: { 
                max_retries: strategy.maxRetries,
                actual_attempts: result.attempt
              }
            },
            outcome: {
              status: 'success',
              duration_ms: Date.now() - decisionStartTime,
              impact: { 
                healed: 1,
                strategy_used: strategy.name
              }
            }
          });

          return { healed: true, strategy: strategy.name, result };
        }
      } catch (error) {
        this.emit('healing_error', { issue, strategy: strategy.name, error });
      }
    }

    this.metrics.failedHeals++;

    // Record failed decision event
    await this.recordDecisionEvent({
      decision_type: 'healing',
      context: {
        trigger: 'issue_detected',
        metrics: { strategies_tried: strategies.length },
        state: { issue_type: issue.type, issue_details: issue }
      },
      action_taken: {
        type: 'multiple_strategies_attempted',
        parameters: { 
          strategies: strategies.map(s => s.name)
        }
      },
      outcome: {
        status: 'failure',
        duration_ms: Date.now() - decisionStartTime,
        impact: { healed: 0, all_strategies_failed: true }
      }
    });

    return { healed: false, reason: 'all_strategies_failed' };
  }

  /**
   * Execute a healing strategy with retries
   */
  async executeStrategy(strategy, issue) {
    let lastError;
    
    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        const result = await strategy.handler(issue, attempt);
        return { success: true, attempt, ...result };
      } catch (error) {
        lastError = error;
        if (attempt < strategy.maxRetries) {
          await this.sleep(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
        }
      }
    }

    return { success: false, error: lastError?.message };
  }

  /**
   * Record healing attempt in history
   */
  recordHealing(issue, strategy, result) {
    this.healingHistory.push({
      timestamp: new Date().toISOString(),
      issue: { ...issue },
      strategy: strategy.name,
      result,
      success: result.success
    });

    // Trim history
    if (this.healingHistory.length > this.maxHistorySize) {
      this.healingHistory.shift();
    }
  }

  /**
   * Get healing statistics
   */
  getStats() {
    const recentHeals = this.healingHistory.slice(-100);
    const successRate = this.metrics.totalHealingAttempts > 0
      ? (this.metrics.successfulHeals / this.metrics.totalHealingAttempts) * 100
      : 0;

    return {
      enabled: this.enabled,
      metrics: { ...this.metrics },
      successRate: successRate.toFixed(2) + '%',
      strategies: Array.from(this.healingStrategies.keys()),
      recentHeals: recentHeals.length,
      lastHealing: this.healingHistory[this.healingHistory.length - 1] || null
    };
  }

  /**
   * Get healing history
   */
  getHistory(limit = 50) {
    return this.healingHistory.slice(-limit);
  }

  /**
   * Record decision event to Decision Intelligence Engine
   */
  async recordDecisionEvent(eventData) {
    if (!this.decisionEngineEnabled) {
      return;
    }

    try {
      await this.decisionEngine.recordDecision({
        system_component: 'self-healing',
        ...eventData
      });
    } catch (error) {
      // Log error but don't fail the healing operation
      console.error('[SelfHealing] Failed to record decision event:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Standard healing strategies
 */
export class StandardHealingStrategies {
  /**
   * Restart failed endpoint
   */
  static endpointRestart(endpointManager) {
    return {
      handler: async (issue) => {
        const endpoint = issue.endpoint;
        await endpointManager.restartEndpoint(endpoint);
        return { action: 'endpoint_restarted', endpoint };
      },
      condition: (issue) => issue.type === 'endpoint_failure',
      priority: 8
    };
  }

  /**
   * Clear endpoint cooldown
   */
  static clearCooldown(endpointManager) {
    return {
      handler: async (issue) => {
        const endpoint = issue.endpoint;
        endpointManager.clearCooldown(endpoint);
        return { action: 'cooldown_cleared', endpoint };
      },
      condition: (issue) => issue.type === 'endpoint_cooldown',
      priority: 7
    };
  }

  /**
   * Restart on memory leak
   */
  static memoryLeakRestart(processManager) {
    return {
      handler: async (issue) => {
        await processManager.gracefulRestart('memory_leak_detected');
        return { action: 'process_restarted', reason: 'memory_leak' };
      },
      condition: (issue) => issue.type === 'memory_leak',
      priority: 10,
      maxRetries: 1
    };
  }

  /**
   * Clear cache on corruption
   */
  static clearCache(cacheManager) {
    return {
      handler: async (issue) => {
        await cacheManager.clear();
        return { action: 'cache_cleared' };
      },
      condition: (issue) => issue.type === 'cache_corruption',
      priority: 6
    };
  }

  /**
   * Reconnect Redis
   */
  static reconnectRedis(redisClient) {
    return {
      handler: async (issue) => {
        await redisClient.disconnect();
        await redisClient.connect();
        return { action: 'redis_reconnected' };
      },
      condition: (issue) => issue.type === 'redis_connection_lost',
      priority: 9
    };
  }
}

export default SelfHealingOrchestrator;
