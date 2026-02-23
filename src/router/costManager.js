/**
 * Cost Manager
 * Tracks, optimizes, and manages API costs automatically
 */

import { EventEmitter } from 'events';

export class CostManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.dailyBudget = options.dailyBudget || null;
    this.monthlyBudget = options.monthlyBudget || null;
    this.warningThreshold = options.warningThreshold || 0.8;
    this.criticalThreshold = options.criticalThreshold || 0.95;
    this.costAwareRouting = options.costAwareRouting !== false;
    
    this.costs = new Map(); // endpoint -> cost data
    this.dailyCosts = [];
    this.monthlyCosts = [];
    this.currentDay = this.getDay();
    this.currentMonth = this.getMonth();
    
    this.metrics = {
      totalCost: 0,
      totalRequests: 0,
      totalTokens: 0,
      budgetExceeded: 0,
      costSavings: 0
    };

    this.budgetAlerts = new Set();
  }

  /**
   * Register endpoint with cost information
   */
  registerEndpoint(name, costConfig) {
    this.costs.set(name, {
      name,
      costPer1kInput: costConfig.costPer1kInput || 0,
      costPer1kOutput: costConfig.costPer1kOutput || 0,
      totalCost: 0,
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      avgCostPerRequest: 0,
      lastUsed: null
    });
  }

  /**
   * Track request cost
   */
  trackRequest(endpoint, usage) {
    if (!this.enabled) {
      return;
    }

    const cost = this.costs.get(endpoint);
    if (!cost) {
      return;
    }

    const inputTokens = usage.inputTokens || 0;
    const outputTokens = usage.outputTokens || 0;

    // Calculate cost
    const inputCost = (inputTokens / 1000) * cost.costPer1kInput;
    const outputCost = (outputTokens / 1000) * cost.costPer1kOutput;
    const totalCost = inputCost + outputCost;

    // Update endpoint costs
    cost.totalCost += totalCost;
    cost.totalRequests++;
    cost.totalInputTokens += inputTokens;
    cost.totalOutputTokens += outputTokens;
    cost.avgCostPerRequest = cost.totalCost / cost.totalRequests;
    cost.lastUsed = Date.now();

    // Update global metrics
    this.metrics.totalCost += totalCost;
    this.metrics.totalRequests++;
    this.metrics.totalTokens += inputTokens + outputTokens;

    // Track daily/monthly costs
    this.trackPeriodCosts(totalCost);

    // Check budget
    this.checkBudget();

    this.emit('cost_tracked', {
      endpoint,
      cost: totalCost,
      inputTokens,
      outputTokens,
      timestamp: Date.now()
    });

    return {
      cost: totalCost,
      inputCost,
      outputCost
    };
  }

  /**
   * Track costs by period
   */
  trackPeriodCosts(cost) {
    const day = this.getDay();
    const month = this.getMonth();

    // Reset daily costs if new day
    if (day !== this.currentDay) {
      this.dailyCosts.push({
        date: this.currentDay,
        cost: this.getDailyCost()
      });
      this.currentDay = day;
      
      // Keep last 90 days
      if (this.dailyCosts.length > 90) {
        this.dailyCosts.shift();
      }
    }

    // Reset monthly costs if new month
    if (month !== this.currentMonth) {
      this.monthlyCosts.push({
        month: this.currentMonth,
        cost: this.getMonthlyCost()
      });
      this.currentMonth = month;
      
      // Keep last 12 months
      if (this.monthlyCosts.length > 12) {
        this.monthlyCosts.shift();
      }
    }
  }

  /**
   * Check budget limits
   */
  checkBudget() {
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();

    // Check daily budget
    if (this.dailyBudget) {
      const dailyPercent = dailyCost / this.dailyBudget;
      
      if (dailyPercent >= this.criticalThreshold) {
        this.handleBudgetAlert('daily', 'critical', dailyCost, this.dailyBudget);
      } else if (dailyPercent >= this.warningThreshold) {
        this.handleBudgetAlert('daily', 'warning', dailyCost, this.dailyBudget);
      }

      if (dailyCost >= this.dailyBudget) {
        this.metrics.budgetExceeded++;
        this.emit('budget_exceeded', {
          period: 'daily',
          cost: dailyCost,
          budget: this.dailyBudget
        });
      }
    }

    // Check monthly budget
    if (this.monthlyBudget) {
      const monthlyPercent = monthlyCost / this.monthlyBudget;
      
      if (monthlyPercent >= this.criticalThreshold) {
        this.handleBudgetAlert('monthly', 'critical', monthlyCost, this.monthlyBudget);
      } else if (monthlyPercent >= this.warningThreshold) {
        this.handleBudgetAlert('monthly', 'warning', monthlyCost, this.monthlyBudget);
      }

      if (monthlyCost >= this.monthlyBudget) {
        this.metrics.budgetExceeded++;
        this.emit('budget_exceeded', {
          period: 'monthly',
          cost: monthlyCost,
          budget: this.monthlyBudget
        });
      }
    }
  }

  /**
   * Handle budget alert
   */
  handleBudgetAlert(period, severity, current, budget) {
    const alertKey = `${period}_${severity}`;
    
    // Avoid duplicate alerts
    if (this.budgetAlerts.has(alertKey)) {
      return;
    }

    this.budgetAlerts.add(alertKey);

    this.emit('budget_alert', {
      period,
      severity,
      current,
      budget,
      percent: ((current / budget) * 100).toFixed(2) + '%',
      timestamp: Date.now()
    });

    // Clear alert after period resets
    setTimeout(() => {
      this.budgetAlerts.delete(alertKey);
    }, period === 'daily' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Get cheapest available endpoint
   */
  getCheapestEndpoint(availableEndpoints) {
    if (!this.costAwareRouting || availableEndpoints.length === 0) {
      return null;
    }

    let cheapest = null;
    let lowestCost = Infinity;

    for (const endpoint of availableEndpoints) {
      const cost = this.costs.get(endpoint);
      if (cost && cost.avgCostPerRequest < lowestCost) {
        lowestCost = cost.avgCostPerRequest;
        cheapest = endpoint;
      }
    }

    if (cheapest) {
      this.metrics.costSavings += 0.001; // Estimate savings
    }

    return cheapest;
  }

  /**
   * Get cost-optimized endpoint ranking
   */
  rankEndpointsByCost(endpoints) {
    return endpoints
      .map(name => ({
        name,
        cost: this.costs.get(name)?.avgCostPerRequest || 0
      }))
      .sort((a, b) => a.cost - b.cost)
      .map(e => e.name);
  }

  /**
   * Get daily cost
   */
  getDailyCost() {
    const day = this.getDay();
    let total = 0;

    for (const cost of this.costs.values()) {
      if (cost.lastUsed && this.getDay(cost.lastUsed) === day) {
        total += cost.totalCost;
      }
    }

    return total;
  }

  /**
   * Get monthly cost
   */
  getMonthlyCost() {
    const month = this.getMonth();
    let total = 0;

    for (const cost of this.costs.values()) {
      if (cost.lastUsed && this.getMonth(cost.lastUsed) === month) {
        total += cost.totalCost;
      }
    }

    return total;
  }

  /**
   * Get cost breakdown by endpoint
   */
  getCostBreakdown() {
    const breakdown = [];

    for (const [name, cost] of this.costs) {
      const percent = this.metrics.totalCost > 0
        ? (cost.totalCost / this.metrics.totalCost) * 100
        : 0;

      breakdown.push({
        endpoint: name,
        totalCost: cost.totalCost.toFixed(4),
        requests: cost.totalRequests,
        avgCostPerRequest: cost.avgCostPerRequest.toFixed(6),
        percentOfTotal: percent.toFixed(2) + '%',
        inputTokens: cost.totalInputTokens,
        outputTokens: cost.totalOutputTokens
      });
    }

    return breakdown.sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();

    return {
      daily: this.dailyBudget ? {
        budget: this.dailyBudget,
        spent: dailyCost,
        remaining: Math.max(0, this.dailyBudget - dailyCost),
        percent: ((dailyCost / this.dailyBudget) * 100).toFixed(2) + '%',
        status: dailyCost >= this.dailyBudget ? 'exceeded' :
                dailyCost >= this.dailyBudget * this.criticalThreshold ? 'critical' :
                dailyCost >= this.dailyBudget * this.warningThreshold ? 'warning' : 'ok'
      } : null,
      monthly: this.monthlyBudget ? {
        budget: this.monthlyBudget,
        spent: monthlyCost,
        remaining: Math.max(0, this.monthlyBudget - monthlyCost),
        percent: ((monthlyCost / this.monthlyBudget) * 100).toFixed(2) + '%',
        status: monthlyCost >= this.monthlyBudget ? 'exceeded' :
                monthlyCost >= this.monthlyBudget * this.criticalThreshold ? 'critical' :
                monthlyCost >= this.monthlyBudget * this.warningThreshold ? 'warning' : 'ok'
      } : null
    };
  }

  /**
   * Get cost trends
   */
  getCostTrends() {
    return {
      daily: this.dailyCosts.slice(-30),
      monthly: this.monthlyCosts,
      avgDailyCost: this.dailyCosts.length > 0
        ? (this.dailyCosts.reduce((sum, d) => sum + d.cost, 0) / this.dailyCosts.length).toFixed(4)
        : 0,
      avgMonthlyCost: this.monthlyCosts.length > 0
        ? (this.monthlyCosts.reduce((sum, m) => sum + m.cost, 0) / this.monthlyCosts.length).toFixed(2)
        : 0
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const avgCostPerRequest = this.metrics.totalRequests > 0
      ? this.metrics.totalCost / this.metrics.totalRequests
      : 0;

    return {
      enabled: this.enabled,
      costAwareRouting: this.costAwareRouting,
      metrics: {
        ...this.metrics,
        totalCost: this.metrics.totalCost.toFixed(4),
        avgCostPerRequest: avgCostPerRequest.toFixed(6),
        costSavings: this.metrics.costSavings.toFixed(4)
      },
      budget: this.getBudgetStatus(),
      endpoints: this.costs.size
    };
  }

  /**
   * Reset costs
   */
  reset() {
    for (const cost of this.costs.values()) {
      cost.totalCost = 0;
      cost.totalRequests = 0;
      cost.totalInputTokens = 0;
      cost.totalOutputTokens = 0;
      cost.avgCostPerRequest = 0;
    }

    this.metrics = {
      totalCost: 0,
      totalRequests: 0,
      totalTokens: 0,
      budgetExceeded: 0,
      costSavings: 0
    };
  }

  getDay(timestamp = Date.now()) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  getMonth(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

export default CostManager;
