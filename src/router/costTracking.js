import crypto from 'crypto';

class CostTracker {
  constructor(options = {}) {
    this.costs = new Map();
    this.defaultPrices = options.defaultPrices || {
      input: 0.001,
      output: 0.002
    };
    this.modelPrices = options.modelPrices || {};
    this.listeners = new Set();
  }

  setModelPrice(model, inputPrice, outputPrice) {
    this.modelPrices[model] = {
      input: inputPrice,
      output: outputPrice
    };
  }

  calculateCost(model, inputTokens, outputTokens) {
    const prices = this.modelPrices[model] || this.defaultPrices;

    const inputCost = (inputTokens / 1000) * prices.input;
    const outputCost = (outputTokens / 1000) * prices.output;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model,
      timestamp: Date.now()
    };
  }

  recordCost(tenantId, costData) {
    const record = {
      id: crypto.randomUUID(),
      tenantId,
      ...costData,
      recordedAt: Date.now()
    };

    if (!this.costs.has(tenantId)) {
      this.costs.set(tenantId, []);
    }
    this.costs.get(tenantId).push(record);

    this.emit('cost:recorded', record);

    return record;
  }

  getTenantCosts(tenantId, options = {}) {
    const records = this.costs.get(tenantId) || [];

    let filtered = records;

    if (options.startDate) {
      filtered = filtered.filter(r => r.timestamp >= options.startDate);
    }
    if (options.endDate) {
      filtered = filtered.filter(r => r.timestamp <= options.endDate);
    }
    if (options.model) {
      filtered = filtered.filter(r => r.model === options.model);
    }

    return filtered;
  }

  getTenantSummary(tenantId, options = {}) {
    const costs = this.getTenantCosts(tenantId, options);

    const byModel = {};
    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;

    for (const cost of costs) {
      totalInput += cost.inputTokens;
      totalOutput += cost.outputTokens;
      totalCost += cost.totalCost;

      if (!byModel[cost.model]) {
        byModel[cost.model] = {
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          requests: 0
        };
      }

      byModel[cost.model].inputTokens += cost.inputTokens;
      byModel[cost.model].outputTokens += cost.outputTokens;
      byModel[cost.model].cost += cost.totalCost;
      byModel[cost.model].requests++;
    }

    return {
      tenantId,
      period: {
        start: options.startDate,
        end: options.endDate
      },
      total: {
        inputTokens: totalInput,
        outputTokens: totalOutput,
        totalTokens: totalInput + totalOutput,
        cost: totalCost
      },
      byModel,
      requestCount: costs.length,
      avgCostPerRequest: costs.length > 0 ? totalCost / costs.length : 0
    };
  }

  getAllTenantsSummary(options = {}) {
    const summaries = [];

    for (const tenantId of this.costs.keys()) {
      summaries.push(this.getTenantSummary(tenantId, options));
    }

    return summaries;
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

class BillingManager {
  constructor(options = {}) {
    this.costTracker = options.costTracker || new CostTracker();
    this.plans = options.plans || {
      free: {
        name: 'Free',
        quota: 10000,
        rateLimit: 60,
        price: 0,
        features: { streaming: false, caching: true, analytics: true }
      },
      pro: {
        name: 'Pro',
        quota: 100000,
        rateLimit: 300,
        price: 29,
        features: { streaming: true, caching: true, analytics: true }
      },
      enterprise: {
        name: 'Enterprise',
        quota: -1,
        rateLimit: -1,
        price: null,
        features: { streaming: true, caching: true, analytics: true, custom: true }
      }
    };
    this.invoices = new Map();
  }

  getPlan(planName) {
    return this.plans[planName];
  }

  createInvoice(tenantId, periodStart, periodEnd) {
    const summary = this.costTracker.getTenantSummary(tenantId, {
      startDate: periodStart,
      endDate: periodEnd
    });

    const invoice = {
      id: crypto.randomUUID(),
      tenantId,
      period: { start: periodStart, end: periodEnd },
      summary,
      status: 'pending',
      createdAt: Date.now(),
      dueAt: periodEnd + 30 * 24 * 60 * 60 * 1000,
      paidAt: null
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  getInvoice(invoiceId) {
    return this.invoices.get(invoiceId);
  }

  getTenantInvoices(tenantId) {
    return Array.from(this.invoices.values())
      .filter(i => i.tenantId === tenantId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  markInvoicePaid(invoiceId) {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      return false;
    }

    invoice.status = 'paid';
    invoice.paidAt = Date.now();
    return true;
  }
}

export { CostTracker, BillingManager };
