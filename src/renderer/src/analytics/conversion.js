const ONBOARDING_EVENTS_KEY = 'neuralshell_onboarding_events_v1';

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function readLocalOnboardingEvents() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(ONBOARDING_EVENTS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function summarizeOnboardingEvents(events = []) {
    const safeEvents = Array.isArray(events) ? events : [];
    let started = 0;
    let providerSweep = 0;
    let vaultSave = 0;
    let runProof = 0;
    let shareBadge = 0;

    for (const item of safeEvents) {
        const type = String(item && item.type ? item.type : '').trim();
        const stepId = String(item && item.stepId ? item.stepId : '').trim();
        if (type === 'wizard_opened') started += 1;
        if (type === 'step_completed' && stepId === 'provider_sweep') providerSweep += 1;
        if (type === 'step_completed' && stepId === 'vault_save') vaultSave += 1;
        if (type === 'step_completed' && stepId === 'run_proof') runProof += 1;
        if (type === 'step_completed' && stepId === 'share_badge') shareBadge += 1;
    }

    return {
        started,
        providerSweep,
        vaultSave,
        runProof,
        shareBadge,
    };
}

export function parseConversionBundle(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const funnel = payload.funnel && typeof payload.funnel === 'object' ? payload.funnel : {};
    return {
        source: String(payload.source || payload.fileName || 'bundle'),
        installs: toNumber(payload.installs, 0),
        onboardingStarted: toNumber(funnel.onboardingStarted, 0),
        onboardingCompleted: toNumber(funnel.onboardingCompleted, 0),
        proofRuns: toNumber(funnel.proofRuns, toNumber(payload.proofRuns, 0)),
        shares: toNumber(funnel.shares, 0),
        upgrades: toNumber(funnel.upgrades, 0),
    };
}

export function aggregateConversionBundles(bundles = []) {
    const safe = (Array.isArray(bundles) ? bundles : []).map(parseConversionBundle);
    const totals = {
        installs: 0,
        onboardingStarted: 0,
        onboardingCompleted: 0,
        proofRuns: 0,
        shares: 0,
        upgrades: 0,
    };
    for (const row of safe) {
        totals.installs += row.installs;
        totals.onboardingStarted += row.onboardingStarted;
        totals.onboardingCompleted += row.onboardingCompleted;
        totals.proofRuns += row.proofRuns;
        totals.shares += row.shares;
        totals.upgrades += row.upgrades;
    }
    return {
        bundles: safe,
        totals,
    };
}
