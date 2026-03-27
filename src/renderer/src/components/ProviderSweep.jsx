import React from 'react';

function statusTone(status) {
    if (status === 'connected') return 'text-emerald-300';
    if (status === 'failed') return 'text-rose-300';
    if (status === 'skipped') return 'text-amber-300';
    return 'text-slate-400';
}

export default function ProviderSweep({
    providerSweep,
    providerSweepRows,
    providerSweepBusy,
    providerSweepUpdatedAt,
    onRefresh,
    hostedProxyEnabled,
    hostedProxyStatus,
    onToggleHostedProxy,
}) {
    const proxyRunning = Boolean(hostedProxyStatus && hostedProxyStatus.running);
    const rateCap = Number(hostedProxyStatus && hostedProxyStatus.rateCapPerMinute ? hostedProxyStatus.rateCapPerMinute : 60);

    return (
        <section>
            <div className="text-[10px] uppercase tracking-widest text-emerald-300 mb-4 font-bold flex items-center justify-between">
                <span>Provider Health</span>
                <button
                    type="button"
                    data-testid="settings-provider-sweep-btn"
                    onClick={onRefresh}
                    disabled={providerSweepBusy}
                    className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                    {providerSweepBusy ? 'Checking' : 'Refresh'}
                </button>
            </div>
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-500 font-mono">
                        {providerSweep
                            ? `${Number(providerSweep.connected || 0)}/${Number(providerSweep.total || 0)} connected`
                            : 'No provider sweep has been run yet.'}
                        {providerSweepUpdatedAt ? ` · ${providerSweepUpdatedAt}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                                hostedProxyEnabled
                                    ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'
                                    : 'border-slate-400/20 bg-slate-500/10 text-slate-300'
                            }`}
                        >
                            Hosted Proxy {hostedProxyEnabled ? 'On' : 'Off'}
                        </span>
                        {hostedProxyEnabled && (
                            <span className="px-2 py-1 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-amber-200">
                                Rate cap {rateCap}/min
                            </span>
                        )}
                        <button
                            type="button"
                            data-testid="settings-hosted-proxy-toggle-btn"
                            onClick={onToggleHostedProxy}
                            className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] font-mono uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10"
                        >
                            {hostedProxyEnabled ? 'Disable Proxy' : 'Use Hosted Proxy'}
                        </button>
                    </div>
                </div>

                {hostedProxyEnabled && (
                    <div className={`rounded-lg border px-3 py-2 text-[10px] font-mono ${
                        proxyRunning
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-amber-300/30 bg-amber-500/10 text-amber-200'
                    }`}
                    >
                        {proxyRunning
                            ? `Hosted proxy active at ${hostedProxyStatus.baseUrl || 'localhost'}`
                            : 'Hosted proxy is enabled and will start when provider validation runs.'}
                    </div>
                )}

                <div className="space-y-2">
                    {providerSweepRows.map((row) => (
                        <div key={row.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-200">{row.label}</span>
                                <span className={`text-[9px] font-mono uppercase tracking-[0.14em] ${statusTone(row.status)}`}>
                                    {row.status}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{row.detail}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

