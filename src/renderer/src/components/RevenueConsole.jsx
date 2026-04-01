import React from 'react';
import { parseRevenueImport, summarizeRevenue } from '../analytics/revenue.js';

function readText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read revenue file.'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsText(file);
    });
}

export default function RevenueConsole() {
    const [rows, setRows] = React.useState([]);
    const [error, setError] = React.useState('');

    const summary = React.useMemo(() => summarizeRevenue(rows), [rows]);

    const onImport = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readText(file);
            const parsed = parseRevenueImport(text, file.name);
            setRows((prev) => [...prev, ...parsed]);
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    return (
        <section data-testid="revenue-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-bold">Revenue Console</div>
                    <div className="text-[10px] text-slate-500 font-mono">Founder-only projections from imported CSV/JSON snapshots.</div>
                </div>
                <label className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.14em] font-mono text-emerald-200 cursor-pointer">
                    Import Revenue
                    <input
                        data-testid="revenue-import-input"
                        type="file"
                        accept=".csv,application/json,.json"
                        className="hidden"
                        onChange={onImport}
                    />
                </label>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">MRR Total</div>
                    <div className="text-[14px] text-slate-100 font-bold">${Number(summary.totals.mrr || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Upgrades</div>
                    <div className="text-[14px] text-slate-100 font-bold">{Number(summary.totals.upgrades || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Agent Sales</div>
                    <div className="text-[14px] text-slate-100 font-bold">${Number(summary.totals.agentSales || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Proj. ARR</div>
                    <div className="text-[14px] text-emerald-200 font-bold">${Number(summary.projectionYearly || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 max-h-44 overflow-auto">
                {rows.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No revenue snapshots imported yet.</div>
                )}
                {rows.slice(-8).map((row, idx) => (
                    <div key={`${row.source}-${row.period}-${idx}`} className="text-[10px] font-mono text-slate-300 flex justify-between gap-2">
                        <span>{row.period}</span>
                        <span>MRR ${Number(row.mrr || 0).toLocaleString()}</span>
                        <span>Upgrades {Number(row.upgrades || 0).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
