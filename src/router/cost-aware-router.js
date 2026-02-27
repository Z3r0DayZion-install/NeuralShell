// Cost-aware endpoint routing
export class CostAwareRouter {
  constructor(config = {}) {
    this.endpointCosts = new Map(); // endpoint -> { costPerRequest, costPerToken, provider }
    this.qualityThresholds = config.qualityThresholds || {
      minSuccessRate: 0.8,
      maxLatencyMs: 5000
    };
    this.config = config;
  }

  registerEndpoint(endpointName, costPerRequest, costPerToken = 0, provider = 'unknown') {
    this.endpointCosts.set(endpointName, {
      name: endpointName,
      costPerRequest,
      costPerToken,
      provider,
      totalCostIncurred: 0,
      totalRequests: 0,
      estimatedMonthlyCost: 0
    });
  }

  selectCheapestEndpoint(availableEndpoints, qualityMetrics) {
    if (availableEndpoints.length === 0) {
      return null;
    }
    if (availableEndpoints.length === 1) {
      return availableEndpoints[0];
    }

    // Filter endpoints by quality first
    const qualifyingEndpoints = availableEndpoints.filter((ep) => {
      const metrics = qualityMetrics.get(ep.name);
      if (!metrics) {
        return true;
      }

      const successRate = metrics.successRate || 1;
      const latency = metrics.lastLatencyMs || 0;

      return (
        successRate >= this.qualityThresholds.minSuccessRate &&
        latency <= this.qualityThresholds.maxLatencyMs
      );
    });

    if (qualifyingEndpoints.length === 0) {
      return availableEndpoints[0];
    }

    // Sort by cost (cheapest first)
    const sorted = qualifyingEndpoints.sort((a, b) => {
      const costA = this.getEstimatedCost(a.name);
      const costB = this.getEstimatedCost(b.name);
      return costA - costB;
    });

    return sorted[0];
  }

  selectBestValueEndpoint(availableEndpoints, qualityMetrics) {
    if (availableEndpoints.length === 0) {
      return null;
    }

    const valueScores = availableEndpoints.map((ep) => {
      const cost = this.getEstimatedCost(ep.name);
      const metrics = qualityMetrics.get(ep.name);
      const successRate = metrics?.successRate || 1;
      const latency = metrics?.lastLatencyMs || 0;

      // Higher is better: (quality / cost)
      const qualityScore = successRate / Math.max(1, latency / 1000);
      const valueScore = qualityScore / Math.max(0.01, cost);

      return { endpoint: ep, valueScore };
    });

    return valueScores.sort((a, b) => b.valueScore - a.valueScore)[0].endpoint;
  }

  recordCost(endpointName, costAmount, _requestSize = 0) {
    const endpoint = this.endpointCosts.get(endpointName);
    if (endpoint) {
      endpoint.totalCostIncurred += costAmount;
      endpoint.totalRequests += 1;
      endpoint.estimatedMonthlyCost = endpoint.totalCostIncurred * (30 * 24 * 3600 * 1000) / Date.now();
    }
  }

  getEstimatedCost(endpointName) {
    const endpoint = this.endpointCosts.get(endpointName);
    return endpoint ? endpoint.costPerRequest : 0;
  }

  getCostReport() {
    const report = {
      byProvider: {},
      total: 0,
      estimatedMonthly: 0,
      endpoints: []
    };

    for (const [name, cost] of this.endpointCosts) {
      const provider = cost.provider;
      if (!report.byProvider[provider]) {
        report.byProvider[provider] = { cost: 0, requests: 0 };
      }

      report.byProvider[provider].cost += cost.totalCostIncurred;
      report.byProvider[provider].requests += cost.totalRequests;
      report.total += cost.totalCostIncurred;
      report.estimatedMonthly += cost.estimatedMonthlyCost;

      report.endpoints.push({
        name,
        provider,
        costPerRequest: cost.costPerRequest,
        totalCostIncurred: cost.totalCostIncurred,
        totalRequests: cost.totalRequests,
        avgCostPerRequest: cost.totalRequests > 0 ? (cost.totalCostIncurred / cost.totalRequests).toFixed(6) : 0
      });
    }

    return report;
  }

  preferCheapEndpoint(endpointName) {
    const cost = this.endpointCosts.get(endpointName);
    if (cost) {
      cost.preferred = true;
    }
  }

  shouldUseCheapAlternative(primaryCost, alternativeCost, alternativeQuality) {
    // Use cheaper alternative if quality is acceptable (>80%) and cost is <50% more
    return alternativeQuality > 0.8 && alternativeCost < primaryCost * 1.5;
  }
}
