import React from 'react';
import OperatorDashboard from './OperatorDashboard';
import FunnelDashboard from './FunnelDashboard';
import RevenueConsole from './RevenueConsole';

function tinyBarChart(series = []) {
    const safe = Array.isArray(series) ? series.slice(-24) : [];
    const max = Math.max(1, ...safe.map((item) => Number(item.latencyMs || 0)));
    return safe.map((item, index) => ({
        x: index,
        h: Math.max(2, Math.round((Number(item.latencyMs || 0) / max) * 52)),
        latencyMs: Number(item.latencyMs || 0),
    }));
}

export default function AnalyticsDrawer({ onClose, capabilities = [] }) {
    const [dashboard, setDashboard] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const [reducedMotion, setReducedMotion] = React.useState(false);

    const refresh = React.useCallback(async () => {
        try {
            const data = await window.api.analytics.getDashboard(7);
            setDashboard(data || null);
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refresh();
        const id = window.setInterval(() => {
            refresh();
        }, 10000);
        return () => {
            window.clearInterval(id);
        };
    }, [refresh]);

    React.useEffect(() => {
        if (!window.matchMedia) return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReducedMotion(Boolean(query.matches));
        apply();
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', apply);
            return () => query.removeEventListener('change', apply);
        }
        query.addListener(apply);
        return () => query.removeListener(apply);
    }, []);

    const setEnabled = async (enabled) => {
        setBusy(true);
        try {
            await window.api.analytics.setEnabled(Boolean(enabled));
            await refresh();
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const clearAnalytics = async () => {
        setBusy(true);
        try {
            await window.api.analytics.clear();
            await refresh();
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const bars = tinyBarChart(dashboard && dashboard.latencySeries ? dashboard.latencySeries : []);
    const canViewOperatorDashboard = Array.isArray(capabilities) && (
        capabilities.includes('operator_dashboard')
        || capabilities.includes('release_health_console')
    );
    const canViewFunnelDashboard = Array.isArray(capabilities) && capabilities.includes('funnel_dashboard');
    const canViewRevenueConsole = Array.isArray(capabilities) && capabilities.includes('revenue_console');

    return (
        <>
            <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <aside className={`fixed right-0 top-0 bottom-0 z-[80] w-full max-w-xl border-l border-cyan-400/20 bg-slate-950 p-6 overflow-y-auto ${reducedMotion ? '' : 'animate-in slide-in-from-right duration-300'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Analytics Dashboard</div>
                        <div className="text-[11px] text-slate-400 font-mono">Local-only usage telemetry (7 day window).</div>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10">✕</button>
                </div>

                {loading && <div className="text-[11px] font-mono text-slate-400">Loading analytics...</div>}
                {error && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[10px] font-mono text-rose-200 mb-3">{error}</div>}

                {!loading && dashboard && (
                    <div className="space-y-4">
                        {canViewOperatorDashboard && <OperatorDashboard />}
                        {canViewFunnelDashboard && <FunnelDashboard />}
                        {canViewRevenueConsole && <RevenueConsole />}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Events</div>
                                <div className="text-lg font-bold text-slate-100">{Number(dashboard.eventCount || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Tokens</div>
                                <div className="text-lg font-bold text-slate-100">{Number(dashboard.totalTokens || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Median Latency</div>
                                <div className="text-lg font-bold text-slate-100">{Number(dashboard.medianLatencyMs || 0)} ms</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Estimated Spend</div>
                                <div className="text-lg font-bold text-slate-100">${Number(dashboard.estimatedUsd || 0).toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold mb-2">Latency Trend</div>
                            <div className="h-16 flex items-end gap-1">
                                {bars.length === 0 && <div className="text-[10px] font-mono text-slate-500">No samples yet.</div>}
                                {bars.map((bar, index) => (
                                    <div key={`bar-${index}`} title={`${bar.latencyMs}ms`} className="w-2 rounded-sm bg-cyan-400/70" style={{ height: `${bar.h}px` }} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold mb-2">Model Mix</div>
                            <div className="space-y-1">
                                {(dashboard.modelMix || []).slice(0, 8).map((entry) => (
                                    <div key={entry.model} className="text-[10px] font-mono text-slate-300 flex justify-between gap-2">
                                        <span className="truncate">{entry.model}</span>
                                        <span>{Number(entry.count || 0).toLocaleString()}</span>
                                    </div>
                                ))}
                                {(!dashboard.modelMix || dashboard.modelMix.length === 0) && (
                                    <div className="text-[10px] font-mono text-slate-500">No model usage yet.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                data-testid="analytics-enable-btn"
                                disabled={busy}
                                onClick={() => setEnabled(!dashboard.enabled)}
                                className={`px-3 py-2 rounded-xl border text-[10px] uppercase tracking-[0.16em] font-bold ${dashboard.enabled ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-400/30 bg-slate-500/10 text-slate-200'} disabled:opacity-60`}
                            >
                                {dashboard.enabled ? 'Disable Analytics' : 'Enable Analytics'}
                            </button>
                            <button
                                type="button"
                                data-testid="analytics-clear-btn"
                                disabled={busy}
                                onClick={clearAnalytics}
                                className="px-3 py-2 rounded-xl border border-rose-300/30 bg-rose-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-rose-200 disabled:opacity-60"
                            >
                                Clear Data
                            </button>
                            <button
                                type="button"
                                onClick={refresh}
                                disabled={busy}
                                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.16em] font-bold text-slate-200 disabled:opacity-60"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
