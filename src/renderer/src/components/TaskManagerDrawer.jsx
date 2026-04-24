import React from 'react';

function formatUptime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0
        ? `${h}h ${String(m).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`
        : `${m}m ${String(ss).padStart(2, '0')}s`;
}

const MemBar = React.memo(function MemBar({ usedMb, label }) {
    const pct = Math.min(100, Math.max(0, (usedMb / 2048) * 100));
    const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-300">{usedMb} MB</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
});

const StatusDot = React.memo(function StatusDot({ ok, pulse }) {
    return (
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'} ${pulse ? 'animate-pulse' : ''}`} />
    );
});

const CollapsibleSection = React.memo(function CollapsibleSection({ title, icon, color, badge, defaultOpen = true, children }) {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <section className={`rounded-xl border ${color} overflow-hidden transition-all duration-200`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[14px] animate-float-y">{icon}</span>
                    <span className="text-[12px] font-semibold text-slate-200">{title}</span>
                    {badge && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400">{badge}</span>}
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
        </section>
    );
});

export default React.memo(function TaskManagerDrawer({
    open,
    onClose,
    stats = {},
    daemonStatus = {},
    connectionInfo = {},
    sessions = [],
    proofSessions = [],
    accelStatus = {},
    onRestartDaemon,
    onKillProofSession,
}) {
    const [refreshTick, setRefreshTick] = React.useState(0);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;
        const timer = setInterval(() => {
            setIsRefreshing(true);
            setRefreshTick((t) => t + 1);
            setTimeout(() => setIsRefreshing(false), 400);
        }, 3000);
        return () => clearInterval(timer);
    }, [open]);

    if (!open) return null;

    const cpuPct = Number(stats.cpuPercent || 0);
    const memMb = Number(stats.memoryMb || 0);
    const tokens = Number(stats.tokensUsed || 0);
    const uptime = Number(stats.uptimeSec || 0);
    const platform = String(stats.platform || 'unknown');

    const daemonAlive = String(daemonStatus.status || '').toLowerCase();
    const isDaemonRunning = daemonAlive === 'running' || daemonAlive === 'started';
    const daemonPid = daemonStatus.pid || null;

    const connHealth = String(connectionInfo.health || 'unknown');
    const connProvider = String(connectionInfo.provider || 'ollama');
    const connModel = String(connectionInfo.model || 'llama3');

    const accelEnabled = Boolean(accelStatus.enabled);
    const accelBackend = String(accelStatus.backend || 'cpu');
    const accelDevice = String(accelStatus.device || '');

    const sessionCount = Array.isArray(sessions) ? sessions.length : 0;
    const activeProofs = Array.isArray(proofSessions) ? proofSessions : [];

    const overallHealthy = isDaemonRunning && connHealth === 'online';

    return (
        <>
            <div className="fixed inset-0 z-[124] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <aside
                data-testid="task-manager-drawer"
                aria-label="Task Manager"
                className="fixed right-4 top-16 bottom-4 z-[125] w-[500px] rounded-2xl border border-violet-400/20 bg-shell-deep/98 shadow-[0_18px_80px_rgba(0,0,0,0.7)] flex flex-col backdrop-blur-xl animate-fade-up"
                style={{ borderImage: 'linear-gradient(180deg, rgba(139,92,246,0.3), rgba(217,70,239,0.15), rgba(6,182,212,0.1)) 1' }}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-violet-500/10 bg-shell-soft/60 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-400/20 flex items-center justify-center text-[16px] animate-breathe">
                            ⚡
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-white">Task Manager</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <StatusDot ok={overallHealthy} pulse={isRefreshing} />
                                <span>{overallHealthy ? 'All systems running' : 'Issues detected'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isRefreshing ? 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.6)]' : 'bg-slate-700'}`} title="Auto-refresh every 3s" />
                        <button
                            type="button"
                            data-testid="task-manager-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center text-sm transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="px-4 py-3 border-b border-white/[0.03] bg-white/[0.01] flex items-center justify-around">
                    {[
                        { label: 'CPU', value: `${cpuPct}%`, color: cpuPct > 80 ? '#ef4444' : cpuPct > 50 ? '#f59e0b' : '#22c55e' },
                        { label: 'RAM', value: `${memMb}MB`, color: memMb > 1600 ? '#ef4444' : memMb > 800 ? '#f59e0b' : '#0ea5e9' },
                        { label: 'Tokens', value: tokens.toLocaleString(), color: '#f59e0b' },
                        { label: 'Uptime', value: formatUptime(uptime), color: '#8b5cf6' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="text-center">
                            <div className="text-[16px] font-bold font-mono" style={{ color }}>{value}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2.5">
                    {/* System Resources */}
                    <CollapsibleSection title="System Resources" icon="📊" color="border-green-400/10 bg-green-500/[0.02]" badge={platform}>
                        <MemBar usedMb={memMb} label="Process Memory" />
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Uptime: <span className="text-green-300">{formatUptime(uptime)}</span></span>
                            <span>Platform: <span className="text-green-300">{platform}</span></span>
                        </div>
                    </CollapsibleSection>

                    {/* Daemon Process */}
                    <CollapsibleSection title="Background Engine" icon="🔧" color="border-orange-400/10 bg-orange-500/[0.02]" badge={isDaemonRunning ? 'Active' : 'Down'}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <StatusDot ok={isDaemonRunning} />
                                <span className="text-[12px] text-slate-200">
                                    {isDaemonRunning ? 'Engine is running' : 'Engine is stopped'}
                                </span>
                            </div>
                            {daemonPid && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-400">
                                    PID {daemonPid}
                                </span>
                            )}
                        </div>
                        {typeof onRestartDaemon === 'function' && (
                            <button
                                type="button"
                                data-testid="task-manager-restart-daemon-btn"
                                onClick={onRestartDaemon}
                                className="w-full px-3 py-2.5 rounded-xl border border-orange-400/20 bg-orange-500/[0.06] text-[11px] font-semibold text-orange-200 uppercase tracking-wider hover:bg-orange-500/15 transition-all flex items-center justify-center gap-2"
                            >
                                <span>🔄</span> Restart Engine
                            </button>
                        )}
                    </CollapsibleSection>

                    {/* LLM Connection */}
                    <CollapsibleSection title="AI Connection" icon="🧠" color="border-sky-400/10 bg-sky-500/[0.02]" badge={connHealth}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <StatusDot ok={connHealth === 'online'} />
                                <div>
                                    <div className="text-[12px] text-slate-200">{connProvider}</div>
                                    <div className="text-[10px] text-slate-500">Model: <span className="text-sky-300">{connModel}</span></div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                                connHealth === 'online'
                                    ? 'border-green-400/25 bg-green-500/10 text-green-300'
                                    : connHealth === 'offline'
                                        ? 'border-red-400/25 bg-red-500/10 text-red-300'
                                        : 'border-yellow-400/25 bg-yellow-500/10 text-yellow-300'
                            }`}>
                                {connHealth === 'online' ? '● Connected' : connHealth === 'offline' ? '○ Offline' : '◌ Checking...'}
                            </span>
                        </div>
                    </CollapsibleSection>

                    {/* Accelerator */}
                    <CollapsibleSection title="Hardware Acceleration" icon="⚙️" color="border-violet-400/10 bg-violet-500/[0.02]" badge={accelBackend.toUpperCase()} defaultOpen={false}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <StatusDot ok={accelEnabled} />
                                <span className="text-[12px] text-slate-200">
                                    {accelBackend.toUpperCase()} Backend
                                    {accelDevice && <span className="text-slate-500 ml-1">· {accelDevice}</span>}
                                </span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${accelEnabled ? 'border-green-400/20 bg-green-500/8 text-green-300' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>
                                {accelEnabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </CollapsibleSection>

                    {/* Active Sessions */}
                    <CollapsibleSection title="Active Sessions" icon="📁" color="border-blue-400/10 bg-blue-500/[0.02]" badge={`${sessionCount}`} defaultOpen={sessionCount > 0}>
                        {sessionCount > 0 ? (
                            <div className="space-y-1.5 max-h-32 overflow-auto">
                                {(Array.isArray(sessions) ? sessions : []).map((s, i) => (
                                    <div key={s.id || s.name || i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[11px] text-blue-200 truncate max-w-[280px]">{String(s.name || s.id || `Session ${i + 1}`)}</span>
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-500">{String(s.status || 'idle')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-slate-500 text-center py-2">No active sessions yet. Start one from the command bar.</div>
                        )}
                    </CollapsibleSection>

                    {/* Running Proof Executions */}
                    {activeProofs.length > 0 && (
                        <CollapsibleSection title="Running Proofs" icon="🔬" color="border-fuchsia-400/10 bg-fuchsia-500/[0.02]" badge={`${activeProofs.length}`}>
                            <div className="space-y-1.5">
                                {activeProofs.map((proof) => (
                                    <div key={proof.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-fuchsia-400/10">
                                        <div>
                                            <span className="text-[11px] text-fuchsia-200">{String(proof.command || proof.id)}</span>
                                            {proof.startedAt && (
                                                <span className="text-[9px] text-slate-500 ml-2">{new Date(proof.startedAt).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                        {typeof onKillProofSession === 'function' && (
                                            <button
                                                type="button"
                                                onClick={() => onKillProofSession(proof.id)}
                                                className="px-2.5 py-1 rounded-lg border border-red-400/20 bg-red-500/[0.06] text-[9px] font-semibold text-red-300 hover:bg-red-500/15 transition-all"
                                            >
                                                ✕ Stop
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-violet-500/10 bg-shell-soft/40 text-[10px] text-slate-500 flex items-center justify-between rounded-b-2xl">
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isRefreshing ? 'bg-green-400' : 'bg-slate-700'}`} />
                        <span>Auto-refreshing every 3s</span>
                    </div>
                    <span className="font-mono text-slate-600">⌘⇧T</span>
                </div>
            </aside>
        </>
    );
});
