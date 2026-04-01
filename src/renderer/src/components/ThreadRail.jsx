import React, { useMemo, useState } from 'react';

const QUICKSTART_SESSION = 'NeuralShell_QuickStart';

export function ThreadRail({
    sessions,
    workflowId,
    onSelectSession,
    onCreateSession,
    onSaveSession,
    onRetrySave,
    onLockSession,
    saveStatus,
    isSessionUnlocked,
    sessionHydrationStatus,
    autoLockOnBlur,
    onToggleAutoLock,
    auditOnly,
    onUpgradeToPro,
    widthPx = 288,
}) {
    const cn = (...parts) => parts.filter(Boolean).join(' ');
    const [filter, setFilter] = useState('');
    const railWidth = Number.isFinite(Number(widthPx)) ? Math.max(220, Math.round(Number(widthPx))) : 288;

    const statusTimestamp = useMemo(() => {
        if (!saveStatus || !saveStatus.at) return '';
        const date = new Date(saveStatus.at);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }, [saveStatus]);

    const filteredSessions = useMemo(() => {
        return (sessions || []).filter((name) => {
            return String(name || '').toLowerCase().includes(filter.toLowerCase());
        });
    }, [sessions, filter]);

    const railStatus = useMemo(() => {
        if (!saveStatus || saveStatus.state === 'idle') {
            if (sessionHydrationStatus === 'loading') {
                return 'Loading selected session...';
            }
            if (sessionHydrationStatus === 'locked') {
                return 'Session locked. Unlock to continue.';
            }
            return 'Ready';
        }
        if (saveStatus.state === 'saving') {
            return String(saveStatus.detail || 'Saving...');
        }
        if (saveStatus.state === 'locked') {
            return String(saveStatus.detail || 'Session locked.');
        }
        if (statusTimestamp) {
            return `${String(saveStatus.detail || '').trim()} (${statusTimestamp})`;
        }
        return String(saveStatus.detail || '').trim() || (saveStatus.state === 'error' ? 'Save failed.' : 'Saved.');
    }, [saveStatus, sessionHydrationStatus, statusTimestamp]);

    return (
        <aside
            data-testid="thread-rail"
            className="shrink-0 border-r border-white/5 flex flex-col bg-slate-950/50 backdrop-blur-xl z-20 overflow-hidden"
            style={{ width: `${railWidth}px` }}
        >
            <header className="p-6 pb-4 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500/60 mb-1">Workflow_Nav</div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-100 uppercase tracking-[0.1em]">Active_Workflows</h2>
                    </div>
                    <button
                        data-testid="new-thread-btn"
                        onClick={onCreateSession}
                        disabled={Boolean(auditOnly)}
                        title="New Thread"
                        className={cn(
                            'h-8 w-8 flex items-center justify-center rounded-lg border transition-all',
                            auditOnly
                                ? 'border-white/10 text-slate-600 cursor-not-allowed'
                                : 'border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/10 text-slate-400 hover:text-cyan-300',
                        )}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search Workflows..."
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-400/30 transition-all"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                {sessions.length > 0 && (
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Current & Recent</div>
                )}

                {sessions.length === 0 ? (
                    <div className="text-center p-6 mt-10">
                        <div className="text-3xl text-slate-700/30 mb-3 font-mono">/</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">History Empty</div>
                        <div className="text-[9px] text-slate-600 font-mono">No active workflow history</div>
                    </div>
                ) : filteredSessions.map((sessionName, index) => {
                    const locked = sessionName !== QUICKSTART_SESSION && !isSessionUnlocked(sessionName);
                    return (
                        <button
                            key={sessionName}
                            data-testid={`session-item-${sessionName}`}
                            onClick={() => onSelectSession(sessionName)}
                            className={cn(
                                'w-full text-left p-3.5 rounded-xl transition-all duration-200 group relative',
                                workflowId === sessionName
                                    ? 'bg-cyan-500/[0.07] border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.03)]'
                                    : 'hover:bg-white/[0.04] border border-transparent',
                            )}
                        >
                            {workflowId === sessionName && (
                                <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-cyan-400/80 rounded-r-full shadow-glow-cyan" />
                            )}
                            <div className="flex items-center justify-between mb-1.5 pl-1.5">
                                <span className={cn(
                                    'text-[11px] font-bold truncate tracking-tight transition-colors',
                                    workflowId === sessionName ? 'text-cyan-100' : 'text-slate-300 group-hover:text-slate-200',
                                )}
                                >
                                    {sessionName}
                                </span>
                                {locked ? (
                                    <span data-testid={`session-lock-${sessionName}`} className="text-[8px] font-mono text-amber-300 uppercase tracking-widest px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
                                        LOCKED
                                    </span>
                                ) : (
                                    index === 0 && workflowId !== sessionName && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                    )
                                )}
                            </div>
                            <div className="flex items-center justify-between pl-1.5">
                                <div className={cn(
                                    'text-[9px] truncate font-mono tracking-tighter transition-colors',
                                    workflowId === sessionName ? 'text-cyan-400/60' : 'text-slate-500/60',
                                )}
                                >
                                    {locked ? 'Unlock required' : '/var/log/active'}
                                </div>
                                {workflowId === sessionName && (
                                    <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-cyan-400/10 rounded">
                                        LIVE
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <footer className="p-4 border-t border-white/5 bg-black/20 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        data-testid="save-active-session-btn"
                        onClick={onSaveSession}
                        disabled={Boolean(auditOnly)}
                        className={cn(
                            'w-full py-2 rounded-lg border text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                            auditOnly
                                ? 'border-white/[0.08] text-slate-600 cursor-not-allowed'
                                : 'border-white/[0.08] hover:bg-white/[0.05] text-slate-300',
                        )}
                    >
                        Save Active
                    </button>
                    <button
                        data-testid="lock-active-session-btn"
                        onClick={onLockSession}
                        disabled={Boolean(auditOnly)}
                        className={cn(
                            'w-full py-2 rounded-lg border text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                            auditOnly
                                ? 'border-amber-400/20 text-amber-400/40 cursor-not-allowed'
                                : 'border-amber-400/30 hover:bg-amber-400/10 text-amber-200',
                        )}
                    >
                        Lock Active
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        data-testid="retry-save-session-btn"
                        onClick={onRetrySave}
                        disabled={Boolean(auditOnly) || (saveStatus && saveStatus.state !== 'error')}
                        className={cn(
                            'w-full py-2 rounded-lg border text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                            !auditOnly && saveStatus && saveStatus.state === 'error'
                                ? 'border-rose-300/30 text-rose-200 hover:bg-rose-300/10'
                                : 'border-white/[0.08] text-slate-500/80 cursor-not-allowed',
                        )}
                    >
                        Retry Save
                    </button>
                    <label
                        htmlFor="session-autolock-toggle"
                        className="w-full py-2 px-2 rounded-lg border border-white/[0.08] text-[9px] font-bold text-slate-300 uppercase tracking-[0.08em] flex items-center justify-between gap-2"
                    >
                        <span>Auto-Lock</span>
                        <input
                            id="session-autolock-toggle"
                            data-testid="session-autolock-toggle"
                            type="checkbox"
                            checked={Boolean(autoLockOnBlur)}
                            onChange={(event) => {
                                if (typeof onToggleAutoLock === 'function') {
                                    onToggleAutoLock(Boolean(event.target.checked));
                                }
                            }}
                            disabled={Boolean(auditOnly)}
                            className="h-3.5 w-3.5 accent-cyan-400"
                        />
                    </label>
                </div>
                {auditOnly && (
                    <div className="space-y-2">
                        <div className="text-[9px] font-mono text-amber-300/80">
                            Write actions disabled - upgrade to Pro.
                        </div>
                        <button
                            type="button"
                            data-testid="threadrail-upgrade-pro-btn"
                            onClick={() => {
                                if (typeof onUpgradeToPro === 'function') {
                                    onUpgradeToPro();
                                }
                            }}
                            className="w-full py-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 transition-all"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                )}
                <div
                    data-testid="session-rail-status"
                    className={cn(
                        'text-[9px] font-mono',
                        saveStatus && saveStatus.state === 'error'
                            ? 'text-rose-300'
                            : saveStatus && saveStatus.state === 'saving'
                                ? 'text-amber-300'
                                : saveStatus && saveStatus.state === 'locked'
                                    ? 'text-amber-300'
                                    : 'text-slate-500',
                    )}
                >
                    {railStatus}
                </div>
            </footer>
        </aside>
    );
}

export default ThreadRail;
