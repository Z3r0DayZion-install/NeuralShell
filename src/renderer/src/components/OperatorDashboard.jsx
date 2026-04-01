import React from 'react';
import { aggregateBundles, parseMetricsBundle } from '../analytics/ingestBundles.js';

function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read file.'));
        reader.onload = () => {
            try {
                resolve(JSON.parse(String(reader.result || '{}')));
            } catch {
                reject(new Error('Invalid JSON bundle.'));
            }
        };
        reader.readAsText(file);
    });
}

export default function OperatorDashboard() {
    const [localDashboard, setLocalDashboard] = React.useState(null);
    const [aggregate, setAggregate] = React.useState(() => aggregateBundles([]));
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        let active = true;
        (async () => {
            try {
                const dashboard = await window.api.analytics.getDashboard(30);
                if (!active) return;
                setLocalDashboard(dashboard || null);
            } catch (err) {
                if (!active) return;
                setError(err && err.message ? err.message : String(err));
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const onImport = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const parsed = await readFileAsJson(file);
            const bundle = parseMetricsBundle({
                ...parsed,
                fileName: file.name,
            });
            setAggregate((prev) => aggregateBundles([...(prev.bundles || []), bundle]));
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    return (
        <section data-testid="operator-dashboard" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Operator Dashboard</div>
                    <div className="text-[10px] text-slate-500 font-mono">Import local metrics bundles. No cloud backend required.</div>
                </div>
                <label className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.14em] font-mono text-cyan-200 cursor-pointer">
                    Import Bundle
                    <input
                        data-testid="operator-import-bundle-input"
                        type="file"
                        accept="application/json,.json,.neuralshell-metrics.json"
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
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Installs</div>
                    <div className="text-[14px] text-slate-100 font-bold">{Number(aggregate.totals.installs || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Proof Runs</div>
                    <div className="text-[14px] text-slate-100 font-bold">{Number(aggregate.totals.proofRuns || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Vault Writes</div>
                    <div className="text-[14px] text-slate-100 font-bold">{Number(aggregate.totals.vaultWrites || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Bundles</div>
                    <div className="text-[14px] text-slate-100 font-bold">{Number(aggregate.bundleCount || 0).toLocaleString()}</div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold mb-1">Local Runtime Reliability</div>
                <div className="text-[10px] font-mono text-slate-300">
                    {localDashboard
                        ? `Events ${localDashboard.eventCount || 0} · Median ${localDashboard.medianLatencyMs || 0}ms · Est $${Number(localDashboard.estimatedUsd || 0).toFixed(2)}`
                        : 'Local dashboard unavailable.'}
                </div>
            </div>
        </section>
    );
}
