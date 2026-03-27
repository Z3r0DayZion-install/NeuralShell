function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBundle(raw = {}) {
  const payload = raw && typeof raw === "object" ? raw : {};
  const funnel = payload.funnel && typeof payload.funnel === "object" ? payload.funnel : {};
  return {
    source: String(payload.source || payload.fileName || "bundle"),
    installs: toNumber(payload.installs, 0),
    onboardingStarted: toNumber(funnel.onboardingStarted, 0),
    onboardingCompleted: toNumber(funnel.onboardingCompleted, 0),
    proofRuns: toNumber(funnel.proofRuns, toNumber(payload.proofRuns, 0)),
    shares: toNumber(funnel.shares, 0),
    upgrades: toNumber(funnel.upgrades, 0),
  };
}

function aggregateFunnel(bundles = []) {
  const rows = (Array.isArray(bundles) ? bundles : []).map(normalizeBundle);
  return rows.reduce((acc, row) => {
    acc.installs += row.installs;
    acc.onboardingStarted += row.onboardingStarted;
    acc.onboardingCompleted += row.onboardingCompleted;
    acc.proofRuns += row.proofRuns;
    acc.shares += row.shares;
    acc.upgrades += row.upgrades;
    return acc;
  }, {
    installs: 0,
    onboardingStarted: 0,
    onboardingCompleted: 0,
    proofRuns: 0,
    shares: 0,
    upgrades: 0,
  });
}

module.exports = {
  normalizeBundle,
  aggregateFunnel,
};
