import React from 'react';
import {
    downloadJson,
    parseStructuredRecords,
    readTextFile,
    toDateString,
    toSafeNumber,
} from '../utils/recordIO.js';

const STORAGE_KEY = 'neuralshell_customer_success_console_v1';

function loadRows() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeCustomer(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const onboardingCompletion = Math.max(0, Math.min(100, toSafeNumber(payload.onboardingCompletion || payload.onboardingPct, 0)));
    const proofRuns30d = Math.max(0, toSafeNumber(payload.proofRuns30d || payload.proofRuns || 0));
    const supportBundles30d = Math.max(0, toSafeNumber(payload.supportBundles30d || payload.supportBundles || 0));
    const upgraded = Boolean(payload.upgraded || payload.isUpgraded || String(payload.plan || '').toLowerCase() === 'paid');
    const renewalDate = toDateString(payload.renewalDate || payload.renewal, '');
    const timeline = Array.isArray(payload.timeline)
        ? payload.timeline.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [];
    const riskPenalty = Math.min(45, (supportBundles30d * 4));
    const healthScore = Math.max(0, Math.min(100, Math.round(
        (onboardingCompletion * 0.35)
        + (Math.min(30, proofRuns30d) * 1.2)
        + (upgraded ? 20 : 0)
        - riskPenalty,
    )));
    const riskLevel = healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'watch' : 'risk';
    const recommendation = riskLevel === 'healthy'
        ? 'Push expansion or renewal package.'
        : riskLevel === 'watch'
            ? 'Schedule proof refresh and onboarding checkpoint.'
            : 'Escalate to support + executive sponsor call.';
    return {
        id: String(payload.id || payload.customerId || `customer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        customerName: String(payload.customerName || payload.customer || payload.account || 'Unnamed Customer').trim(),
        onboardingCompletion,
        proofRuns30d,
        supportBundles30d,
        upgraded,
        renewalDate,
        healthScore,
        riskLevel,
        recommendation,
        timeline,
        updatedAt: new Date().toISOString(),
    };
}

export default function CustomerSuccessConsole() {
    const [rows, setRows] = React.useState(() => loadRows().map((entry) => normalizeCustomer(entry)));
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }, [rows]);

    const importRows = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = parseStructuredRecords(text, file.name).map((entry) => normalizeCustomer(entry));
            setRows((prev) => {
                const byId = new Map(prev.map((row) => [row.id, row]));
                parsed.forEach((row) => byId.set(row.id, row));
                return Array.from(byId.values());
            });
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    const totals = React.useMemo(() => {
        if (!rows.length) return { avgHealth: 0, riskCount: 0, watchCount: 0 };
        const sumHealth = rows.reduce((sum, row) => sum + toSafeNumber(row.healthScore, 0), 0);
        return {
            avgHealth: Math.round(sumHealth / rows.length),
            riskCount: rows.filter((row) => row.riskLevel === 'risk').length,
            watchCount: rows.filter((row) => row.riskLevel === 'watch').length,
        };
    }, [rows]);

    return (
        <section data-testid="customer-success-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Customer Success Workspace</div>
                    <div className="text-[10px] text-slate-500 font-mono">Import local usage bundles, score customer health, and surface renewal risk actions.</div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200 cursor-pointer">
                        Import Usage Bundles
                        <input
                            type="file"
                            accept=".csv,.json,application/json"
                            className="hidden"
                            data-testid="customer-success-import-input"
                            onChange={importRows}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="customer-success-export-btn"
                        onClick={() => {
                            downloadJson(`neuralshell_customer_success_${Date.now()}.json`, {
                                exportedAt: new Date().toISOString(),
                                summary: totals,
                                customers: rows,
                            });
                        }}
                        className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                    >
                        Export
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Customers</div>
                    <div className="text-[14px] font-bold text-slate-100">{rows.length}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Average Health</div>
                    <div className="text-[14px] font-bold text-cyan-100">{totals.avgHealth}%</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Risk / Watch</div>
                    <div className="text-[14px] font-bold text-amber-100">{totals.riskCount} / {totals.watchCount}</div>
                </div>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {rows.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-[10px] font-mono text-slate-500">
                        No customer bundles loaded yet.
                    </div>
                )}
                {rows.map((row) => (
                    <article key={row.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[12px] font-bold text-slate-100">{row.customerName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">Renewal {row.renewalDate || 'unset'} · Proof runs {row.proofRuns30d} · Support bundles {row.supportBundles30d}</div>
                            </div>
                            <span className={`px-2 py-1 rounded border text-[9px] uppercase tracking-[0.12em] font-mono ${
                                row.riskLevel === 'healthy'
                                    ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                                    : row.riskLevel === 'watch'
                                        ? 'border-amber-300/30 bg-amber-500/10 text-amber-100'
                                        : 'border-rose-300/30 bg-rose-500/10 text-rose-100'
                            }`}
                            >
                                {row.riskLevel} · {row.healthScore}%
                            </span>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-slate-300">
                            Next action: {row.recommendation}
                        </div>
                        {row.timeline.length > 0 && (
                            <div className="mt-2 rounded border border-white/10 bg-black/20 p-2">
                                <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500 mb-1">Timeline</div>
                                <div className="space-y-1">
                                    {row.timeline.slice(-4).map((entry, index) => (
                                        <div key={`${row.id}-timeline-${index}`} className="text-[10px] font-mono text-slate-400">
                                            - {entry}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

