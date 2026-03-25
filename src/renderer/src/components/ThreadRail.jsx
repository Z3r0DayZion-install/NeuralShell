import React, { useState } from 'react';
import ShellBadge from './ShellBadge';

export function ThreadRail({ sessions, activeSession, onSelectSession }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");
    const [filter, setFilter] = useState('');

    const filteredSessions = sessions.filter(s => s.toLowerCase().includes(filter.toLowerCase()));

    return (
        <aside data-testid="thread-rail" className="w-72 border-r border-white/5 flex flex-col bg-slate-950/50 backdrop-blur-xl z-20 overflow-hidden">
            <header className="p-6 pb-4 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500/60 mb-1">Workflow_Nav</div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-100 uppercase tracking-[0.1em]">Active_Workflows</h2>
                    </div>
                    <button data-testid="new-thread-btn"
                        onClick={() => onSelectSession('Workflow_' + Math.random().toString(36).substr(2, 5).toUpperCase())}
                        title="New Thread"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/10 text-slate-400 hover:text-cyan-300 transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search Workflows..."
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-400/30 transition-all"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                {/* Active Focus Header */}
                {sessions.length > 0 && (
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Current & Recent</div>
                )}

                {sessions.length === 0 ? (
                    <div className="text-center p-6 mt-10">
                        <div className="text-3xl text-slate-700/30 mb-3 font-mono">/</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">History Empty</div>
                        <div className="text-[9px] text-slate-600 font-mono">No active workflow history</div>
                    </div>
                ) : filteredSessions.map((s, index) => (
                    <button
                        key={s}
                        onClick={() => onSelectSession(s)}
                        className={cn(
                            "w-full text-left p-3.5 rounded-xl transition-all duration-200 group relative",
                            activeSession === s
                                ? "bg-cyan-500/[0.07] border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.03)]"
                                : "hover:bg-white/[0.04] border border-transparent"
                        )}
                    >
                        {activeSession === s && (
                            <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-cyan-400/80 rounded-r-full shadow-glow-cyan" />
                        )}
                        <div className="flex items-center justify-between mb-1.5 pl-1.5">
                            <span className={cn(
                                "text-[11px] font-bold truncate tracking-tight transition-colors",
                                activeSession === s ? "text-cyan-100" : "text-slate-300 group-hover:text-slate-200"
                            )}>
                                {s}
                            </span>
                            {index === 0 && activeSession !== s && (
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            )}
                        </div>
                        <div className="flex items-center justify-between pl-1.5">
                            <div className={cn(
                                "text-[9px] truncate font-mono tracking-tighter transition-colors",
                                activeSession === s ? "text-cyan-400/60" : "text-slate-500/60"
                            )}>
                                /var/log/active
                            </div>
                            {activeSession === s && <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-cyan-400/10 rounded">LIVE</span>}
                        </div>
                    </button>
                ))}
            </div>

            <footer className="p-4 border-t border-white/5 bg-black/20 flex gap-2">
                <button
                    className="flex-1 py-2 rounded-lg border border-white/[0.05] hover:bg-white/[0.05] text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] transition-all"
                >
                    Clear All
                </button>
            </footer>
        </aside>
    );
}

export default ThreadRail;
