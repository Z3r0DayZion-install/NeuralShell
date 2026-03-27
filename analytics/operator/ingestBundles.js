function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

export function parseMetricsBundle(raw) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const installs = toNumber(payload.installs, 0);
    const proofRuns = toNumber(payload.proofRuns, 0);
    const vaultWrites = toNumber(payload.vaultWrites, 0);
    const provider = payload.providerSuccess && typeof payload.providerSuccess === 'object'
        ? payload.providerSuccess
        : {};
    const tier = String(payload.tier || 'unknown');
    const source = String(payload.source || payload.fileName || 'bundle');
    return {
        source,
        tier,
        installs,
        proofRuns,
        vaultWrites,
        providerSuccess: Object.fromEntries(
            Object.entries(provider).map(([key, value]) => [String(key), toNumber(value, 0)])
        )
    };
}

export function aggregateBundles(bundles) {
    const safeBundles = safeArray(bundles).map(parseMetricsBundle);
    const totals = {
        installs: 0,
        proofRuns: 0,
        vaultWrites: 0
    };
    const providerSuccess = {};
    const tierMix = {};

    for (const bundle of safeBundles) {
        totals.installs += bundle.installs;
        totals.proofRuns += bundle.proofRuns;
        totals.vaultWrites += bundle.vaultWrites;
        tierMix[bundle.tier] = (tierMix[bundle.tier] || 0) + 1;
        for (const [provider, value] of Object.entries(bundle.providerSuccess)) {
            providerSuccess[provider] = (providerSuccess[provider] || 0) + value;
        }
    }

    return {
        bundleCount: safeBundles.length,
        totals,
        providerSuccess,
        tierMix,
        bundles: safeBundles
    };
}
