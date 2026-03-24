import React from 'react';
import ShellBadge from './ShellBadge';

export function ThreadRail({ sessions, activeSession, onSelectSession }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");
    return (
        <aside className="w-[260px] border-r border-white/5 flex flex-col bg-[#040c16]/50 backdrop-blur-xl z-20 overflow-hidden">
            <header className="p-6 border-b border-white/5">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500/60 mb-2">Workspace_Nav</div>
                <h2 className="text-sm font-bold tracking-tight text-slate-100 uppercase tracking-[0.1em]">Signal_Vault</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {sessions.length === 0 ? (
                    <div className="p-4 text-[10px] text-slate-600 italic">No active threads.</div>
                ) : sessions.map(s => (
                    <button
                        key={s}
                        onClick={() => onSelectSession(s)}
                        className={cn(
                            "w-full text-left p-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            activeSession === s
                                ? "bg-cyan-500/[0.07] border border-cyan-400/20 text-cyan-100 shadow-lg"
                                : "hover:bg-white/[0.03] text-slate-500 hover:text-slate-300 border border-transparent"
                        )}
                    >
                        {activeSession === s && (
                            <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-cyan-400 rounded-full" />
                        )}
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold truncate max-w-[140px] tracking-tight">{s}</span>
                            <span className="text-[8px] font-mono opacity-40">Active</span>
                        </div>
                        <div className="text-[9px] opacity-40 truncate font-mono tracking-tighter">
                            Last_Signal_OK
                        </div>
                    </button>
                ))}
            </div>

            <footer className="p-4 border-t border-white/5 bg-black/20">
                <button className="w-full py-2.5 rounded-xl border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/5 text-[9px] font-bold text-slate-400 hover:text-cyan-300 uppercase tracking-[0.2em] transition-all">
                    New_Thread
                </button>
            </footer>
        </aside>
    );
}

export default ThreadRail;
