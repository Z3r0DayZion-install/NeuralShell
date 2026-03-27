import React from 'react';
import {
    downloadJson,
    parseStructuredRecords,
    readTextFile,
    toDateString,
    toSafeNumber,
} from '../utils/recordIO.js';

const STORAGE_KEY = 'neuralshell_sales_console_v1';

const SALES_STAGES = [
    'Lead',
    'Discovery',
    'Demo Scheduled',
    'Pilot Active',
    'Security Review',
    'Procurement',
    'Deployment',
    'Renewal',
    'Closed Won',
    'Closed Lost',
];

function normalizeDeal(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    return {
        id: String(payload.id || payload.leadId || `deal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        accountName: String(payload.accountName || payload.customer || payload.company || 'Unnamed Account').trim(),
        owner: String(payload.owner || payload.sdr || payload.ae || 'Founder').trim(),
        stage: SALES_STAGES.includes(String(payload.stage || '').trim())
            ? String(payload.stage || '').trim()
            : 'Lead',
        dealSizeUsd: toSafeNumber(payload.dealSizeUsd || payload.dealSize || payload.acv || payload.value, 0),
        nextAction: String(payload.nextAction || payload.action || 'Follow up').trim(),
        nextActionDate: toDateString(payload.nextActionDate || payload.nextStepDate || payload.followUpDate, ''),
        demoStatus: String(payload.demoStatus || payload.demo || 'pending').trim().toLowerCase(),
        proofStatus: String(payload.proofStatus || payload.proof || 'pending').trim().toLowerCase(),
        pilotStatus: String(payload.pilotStatus || payload.pilot || 'not_started').trim().toLowerCase(),
        securityReview: String(payload.securityReview || payload.security || 'not_started').trim().toLowerCase(),
        procurementStatus: String(payload.procurementStatus || payload.procurement || 'not_started').trim().toLowerCase(),
        renewalState: String(payload.renewalState || payload.renewal || 'n/a').trim().toLowerCase(),
        notes: String(payload.notes || '').trim(),
        updatedAt: new Date().toISOString(),
    };
}

function loadDeals() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed.map((entry) => normalizeDeal(entry));
    } catch {
        return [];
    }
}

export default function SalesConsole() {
    const [deals, setDeals] = React.useState(() => loadDeals());
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    }, [deals]);

    const totalPipeline = React.useMemo(
        () => deals.reduce((sum, deal) => sum + toSafeNumber(deal.dealSizeUsd, 0), 0),
        [deals],
    );
    const activePilots = React.useMemo(
        () => deals.filter((deal) => deal.stage === 'Pilot Active' || deal.pilotStatus === 'active').length,
        [deals],
    );
    const securityBlocked = React.useMemo(
        () => deals.filter((deal) => deal.stage === 'Security Review' || deal.securityReview === 'blocked').length,
        [deals],
    );
    const procurementBlocked = React.useMemo(
        () => deals.filter((deal) => deal.stage === 'Procurement' || deal.procurementStatus === 'blocked').length,
        [deals],
    );

    const importDeals = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const rows = parseStructuredRecords(text, file.name);
            const normalized = rows.map((entry) => normalizeDeal(entry));
            setDeals((prev) => {
                const byId = new Map(prev.map((deal) => [deal.id, deal]));
                normalized.forEach((deal) => byId.set(deal.id, deal));
                return Array.from(byId.values());
            });
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    const updateDeal = (dealId, patch) => {
        setDeals((prev) => prev.map((deal) => (
            deal.id === dealId
                ? { ...deal, ...patch, updatedAt: new Date().toISOString() }
                : deal
        )));
    };

    const addDeal = () => {
        setDeals((prev) => [
            normalizeDeal({
                accountName: `Net-New_${prev.length + 1}`,
                owner: 'Founder',
                stage: 'Lead',
                nextAction: 'Discovery call',
            }),
            ...prev,
        ]);
    };

    return (
        <section data-testid="sales-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Enterprise Sales Console</div>
                    <div className="text-[10px] text-slate-500 font-mono">Local pipeline tracking for demos, pilots, review gates, deployment, and renewals.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="sales-console-add-deal-btn"
                        onClick={addDeal}
                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                    >
                        + Deal
                    </button>
                    <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200 cursor-pointer">
                        Import CSV/JSON
                        <input
                            type="file"
                            accept=".csv,.json,application/json"
                            className="hidden"
                            data-testid="sales-console-import-input"
                            onChange={importDeals}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="sales-console-export-btn"
                        onClick={() => {
                            downloadJson(`neuralshell_sales_pipeline_${Date.now()}.json`, {
                                exportedAt: new Date().toISOString(),
                                totals: {
                                    dealCount: deals.length,
                                    totalPipeline,
                                },
                                deals,
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Deals</div>
                    <div className="text-[14px] font-bold text-slate-100">{deals.length}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Pipeline</div>
                    <div className="text-[14px] font-bold text-cyan-100">${totalPipeline.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Active Pilots</div>
                    <div className="text-[14px] font-bold text-emerald-100">{activePilots}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Blocked</div>
                    <div className="text-[14px] font-bold text-amber-100">{securityBlocked + procurementBlocked}</div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 overflow-auto">
                <table className="min-w-full text-[10px] font-mono">
                    <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-[0.1em]">
                        <tr>
                            <th className="text-left px-2 py-2">Account</th>
                            <th className="text-left px-2 py-2">Stage</th>
                            <th className="text-left px-2 py-2">Deal</th>
                            <th className="text-left px-2 py-2">Next Action</th>
                            <th className="text-left px-2 py-2">Demo</th>
                            <th className="text-left px-2 py-2">Proof</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deals.length === 0 && (
                            <tr>
                                <td className="px-3 py-3 text-slate-500" colSpan={6}>No deals imported yet.</td>
                            </tr>
                        )}
                        {deals.map((deal) => (
                            <tr key={deal.id} className="border-t border-white/5">
                                <td className="px-2 py-2 text-slate-200">
                                    <input
                                        value={deal.accountName}
                                        onChange={(event) => updateDeal(deal.id, { accountName: event.target.value })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        value={deal.stage}
                                        onChange={(event) => updateDeal(deal.id, { stage: event.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    >
                                        {SALES_STAGES.map((stage) => (
                                            <option key={stage} value={stage}>{stage}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-2 text-slate-200">
                                    <input
                                        type="number"
                                        value={deal.dealSizeUsd}
                                        onChange={(event) => updateDeal(deal.id, { dealSizeUsd: toSafeNumber(event.target.value, 0) })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1"
                                    />
                                </td>
                                <td className="px-2 py-2 text-slate-200">
                                    <input
                                        value={deal.nextAction}
                                        onChange={(event) => updateDeal(deal.id, { nextAction: event.target.value })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1 mb-1"
                                    />
                                    <input
                                        type="date"
                                        value={deal.nextActionDate}
                                        onChange={(event) => updateDeal(deal.id, { nextActionDate: event.target.value })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        value={deal.demoStatus}
                                        onChange={(event) => updateDeal(deal.id, { demoStatus: event.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    >
                                        <option value="pending">pending</option>
                                        <option value="scheduled">scheduled</option>
                                        <option value="completed">completed</option>
                                        <option value="blocked">blocked</option>
                                    </select>
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        value={deal.proofStatus}
                                        onChange={(event) => updateDeal(deal.id, { proofStatus: event.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    >
                                        <option value="pending">pending</option>
                                        <option value="in_progress">in_progress</option>
                                        <option value="completed">completed</option>
                                        <option value="blocked">blocked</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

