import React from 'react';

function toneClass(status) {
    if (status === 'green') return 'text-emerald-200 border-emerald-300/30 bg-emerald-500/10';
    if (status === 'yellow') return 'text-amber-200 border-amber-300/30 bg-amber-500/10';
    return 'text-rose-200 border-rose-300/30 bg-rose-500/10';
}

export default function ReleaseHealthConsole() {
    const [report, setReport] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');

    const refresh = React.useCallback(async () => {
        setBusy(true);
        try {
            const next = window.api && window.api.releaseHealth && typeof window.api.releaseHealth.check === 'function'
                ? await window.api.releaseHealth.check()
                : await window.api.invoke('releaseHealth:check');
            setReport(next || null);
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const rows = Array.isArray(report && report.rows) ? report.rows : [];

    return (
        <section data-testid="release-health-console">
            <div className="text-[10px] uppercase tracking-widest text-cyan-300 mb-4 font-bold">Release Health</div>
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className={`px-2 py-1 rounded border text-[10px] font-mono uppercase tracking-[0.14em] ${toneClass(String(report && report.status ? report.status : 'red'))}`}>
                        Status {String(report && report.status ? report.status : 'unknown')}
                    </div>
                    <button
                        type="button"
                        data-testid="release-health-refresh-btn"
                        disabled={busy}
                        onClick={refresh}
                        className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.14em] font-mono text-slate-200 hover:bg-white/10 disabled:opacity-60"
                    >
                        Refresh
                    </button>
                </div>
                {error && (
                    <div className="rounded border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-200">
                        {error}
                    </div>
                )}
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="rounded border border-white/10 bg-black/30 px-2 py-1">
                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                <span className="text-slate-200">{row.id}</span>
                                <span className={row.ok ? 'text-emerald-300' : row.required ? 'text-rose-300' : 'text-amber-300'}>
                                    {row.ok ? 'ok' : row.required ? 'missing' : 'optional-missing'}
                                </span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono break-all">{row.path}</div>
                        </div>
                    ))}
                    {rows.length === 0 && (
                        <div className="text-[10px] text-slate-500 font-mono">No release health rows found.</div>
                    )}
                </div>
            </div>
        </section>
    );
}
