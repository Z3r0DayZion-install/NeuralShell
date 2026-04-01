function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSnapshot(raw = {}) {
  const payload = raw && typeof raw === "object" ? raw : {};
  return {
    period: String(payload.period || payload.date || ""),
    mrr: toNumber(payload.mrr, 0),
    installs: toNumber(payload.installs, 0),
    activations: toNumber(payload.activations, 0),
    upgrades: toNumber(payload.upgrades, 0),
    agentSales: toNumber(payload.agentSales, 0),
    partnerRevenue: toNumber(payload.partnerRevenue, 0),
  };
}

function summarizeSnapshots(rows = []) {
  const snapshots = (Array.isArray(rows) ? rows : []).map(normalizeSnapshot);
  const totals = {
    mrr: 0,
    installs: 0,
    activations: 0,
    upgrades: 0,
    agentSales: 0,
    partnerRevenue: 0,
  };
  for (const row of snapshots) {
    totals.mrr += row.mrr;
    totals.installs += row.installs;
    totals.activations += row.activations;
    totals.upgrades += row.upgrades;
    totals.agentSales += row.agentSales;
    totals.partnerRevenue += row.partnerRevenue;
  }
  const trailing = snapshots.slice(-3);
  const projectionYearly = trailing.length
    ? Math.round((trailing.reduce((sum, row) => sum + row.mrr, 0) / trailing.length) * 12)
    : 0;
  return {
    snapshots,
    totals,
    projectionYearly,
  };
}

module.exports = {
  normalizeSnapshot,
  summarizeSnapshots,
};
