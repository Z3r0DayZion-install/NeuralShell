import React from 'react';
import strategyBets from '../config/strategy_bets.json';
import { downloadJson, toSafeNumber } from '../utils/recordIO.js';

const STORAGE_KEY = 'neuralshell_expansion_planner_v1';

const DEFAULT_WEIGHTS = {
    effort: 0.2,
    revenuePotential: 0.35,
    salesFriction: 0.15,
    deploymentComplexity: 0.1,
    ecosystemFit: 0.2,
};

function loadState() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { weights: DEFAULT_WEIGHTS, overrides: {} };
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        return {
            weights: {
                effort: toSafeNumber(parsed && parsed.weights ? parsed.weights.effort : DEFAULT_WEIGHTS.effort, DEFAULT_WEIGHTS.effort),
                revenuePotential: toSafeNumber(parsed && parsed.weights ? parsed.weights.revenuePotential : DEFAULT_WEIGHTS.revenuePotential, DEFAULT_WEIGHTS.revenuePotential),
                salesFriction: toSafeNumber(parsed && parsed.weights ? parsed.weights.salesFriction : DEFAULT_WEIGHTS.salesFriction, DEFAULT_WEIGHTS.salesFriction),
                deploymentComplexity: toSafeNumber(parsed && parsed.weights ? parsed.weights.deploymentComplexity : DEFAULT_WEIGHTS.deploymentComplexity, DEFAULT_WEIGHTS.deploymentComplexity),
                ecosystemFit: toSafeNumber(parsed && parsed.weights ? parsed.weights.ecosystemFit : DEFAULT_WEIGHTS.ecosystemFit, DEFAULT_WEIGHTS.ecosystemFit),
            },
            overrides: parsed && parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
        };
    } catch {
        return { weights: DEFAULT_WEIGHTS, overrides: {} };
    }
}

function normalizeBet(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    return {
        id: String(payload.id || `bet-${Math.random().toString(36).slice(2, 6)}`),
        name: String(payload.name || 'Untitled Bet'),
        notes: String(payload.notes || ''),
        effort: Math.max(1, Math.min(10, toSafeNumber(payload.effort, 5))),
        revenuePotential: Math.max(1, Math.min(10, toSafeNumber(payload.revenuePotential, 5))),
        salesFriction: Math.max(1, Math.min(10, toSafeNumber(payload.salesFriction, 5))),
        deploymentComplexity: Math.max(1, Math.min(10, toSafeNumber(payload.deploymentComplexity, 5))),
        ecosystemFit: Math.max(1, Math.min(10, toSafeNumber(payload.ecosystemFit, 5))),
    };
}

export default function ExpansionPlanner() {
    const initial = React.useMemo(() => loadState(), []);
    const [weights, setWeights] = React.useState(initial.weights);
    const [overrides, setOverrides] = React.useState(initial.overrides);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            weights,
            overrides,
        }));
    }, [weights, overrides]);

    const normalizedBets = React.useMemo(
        () => (Array.isArray(strategyBets) ? strategyBets : []).map((entry) => normalizeBet(entry)),
        [],
    );

    const ranked = React.useMemo(() => {
        const safeWeights = {
            effort: Math.max(0, toSafeNumber(weights.effort, DEFAULT_WEIGHTS.effort)),
            revenuePotential: Math.max(0, toSafeNumber(weights.revenuePotential, DEFAULT_WEIGHTS.revenuePotential)),
            salesFriction: Math.max(0, toSafeNumber(weights.salesFriction, DEFAULT_WEIGHTS.salesFriction)),
            deploymentComplexity: Math.max(0, toSafeNumber(weights.deploymentComplexity, DEFAULT_WEIGHTS.deploymentComplexity)),
            ecosystemFit: Math.max(0, toSafeNumber(weights.ecosystemFit, DEFAULT_WEIGHTS.ecosystemFit)),
        };
        return normalizedBets.map((bet) => {
            const baseScore = (
                ((11 - bet.effort) * safeWeights.effort)
                + (bet.revenuePotential * safeWeights.revenuePotential)
                + ((11 - bet.salesFriction) * safeWeights.salesFriction)
                + ((11 - bet.deploymentComplexity) * safeWeights.deploymentComplexity)
                + (bet.ecosystemFit * safeWeights.ecosystemFit)
            ) * 10;
            const manualOverride = overrides[bet.id] != null ? toSafeNumber(overrides[bet.id], NaN) : NaN;
            const finalScore = Number.isFinite(manualOverride)
                ? manualOverride
                : Math.round(baseScore);
            return {
                ...bet,
                baseScore: Math.round(baseScore),
                finalScore: Math.max(0, Math.min(100, Math.round(finalScore))),
                overrideUsed: Number.isFinite(manualOverride),
            };
        }).sort((a, b) => b.finalScore - a.finalScore);
    }, [normalizedBets, overrides, weights]);

    return (
        <section data-testid="expansion-planner" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Strategic Expansion Planner</div>
                    <div className="text-[10px] text-slate-500 font-mono">Score expansion bets by effort, revenue, friction, complexity, and ecosystem fit.</div>
                </div>
                <button
                    type="button"
                    data-testid="expansion-planner-export-btn"
                    onClick={() => {
                        downloadJson(`neuralshell_expansion_planner_${Date.now()}.json`, {
                            exportedAt: new Date().toISOString(),
                            weights,
                            ranked,
                        });
                    }}
                    className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                >
                    Export Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {Object.keys(DEFAULT_WEIGHTS).map((key) => (
                    <label key={key} className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                        {key}
                        <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={toSafeNumber(weights[key], DEFAULT_WEIGHTS[key])}
                            onChange={(event) => setWeights((prev) => ({
                                ...prev,
                                [key]: Math.max(0, Math.min(1, toSafeNumber(event.target.value, DEFAULT_WEIGHTS[key]))),
                            }))}
                            className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                        />
                    </label>
                ))}
            </div>

            <div className="space-y-2">
                {ranked.map((bet) => (
                    <article key={bet.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[12px] font-bold text-slate-100">{bet.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{bet.notes}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Score</div>
                                <div className="text-[16px] font-bold text-cyan-100">{bet.finalScore}</div>
                                <div className="text-[9px] font-mono text-slate-500">
                                    base {bet.baseScore}{bet.overrideUsed ? ' · manual' : ''}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono text-slate-300">
                            <div>Effort {bet.effort}/10</div>
                            <div>Revenue {bet.revenuePotential}/10</div>
                            <div>Sales Friction {bet.salesFriction}/10</div>
                            <div>Deploy Complexity {bet.deploymentComplexity}/10</div>
                            <div>Ecosystem Fit {bet.ecosystemFit}/10</div>
                        </div>
                        <div className="mt-2">
                            <label className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Manual Score Override</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="leave empty to use weighted score"
                                value={overrides[bet.id] == null ? '' : overrides[bet.id]}
                                onChange={(event) => {
                                    const value = String(event.target.value || '').trim();
                                    setOverrides((prev) => {
                                        if (!value) {
                                            const next = { ...prev };
                                            delete next[bet.id];
                                            return next;
                                        }
                                        return {
                                            ...prev,
                                            [bet.id]: Math.max(0, Math.min(100, toSafeNumber(value, bet.baseScore))),
                                        };
                                    });
                                }}
                                className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-slate-200"
                            />
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

