import React from 'react';
import RitualTerminal from './RitualTerminal';
import Panel from './Panel';
import ShellBadge from './ShellBadge';

export function WorkbenchRail({ stats, activeSession }) {
    return (
        <aside data-testid="workbench-rail" className="w-72 border-l border-white/5 flex flex-col bg-slate-950/50 backdrop-blur-xl z-20">
            <header className="p-6 border-b border-white/5">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500/60 mb-2">Console_Control</div>
                <h2 className="text-sm font-bold tracking-tight text-slate-100 uppercase tracking-[0.1em]">Analytics_Engine</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Core Protocol Engine */}
                <RitualTerminal />

                {/* Contextual Workbench State tied to Active Session */}
                <div className="p-5 border border-cyan-400/20 bg-cyan-400/[0.03] rounded-2xl shadow-inner">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500/60 mb-1">Active_Workflow</div>
                            <div className="text-[12px] font-bold text-slate-200 tracking-tight truncate max-w-40">
                                {activeSession || 'Global_Empty_State'}
                            </div>
                        </div>
                        <ShellBadge tone={activeSession ? "green" : "warn"}>{activeSession ? "ON_LINK" : "AWAIT"}</ShellBadge>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Heuristic Artifacts</span>
                            <span className="text-[11px] font-mono text-slate-300">0 Staged / 0 Compiled</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Trust Verification</span>
                            <span className="text-[11px] font-mono text-emerald-400">Ed25519 Chain Valid</span>
                        </div>
                    </div>
                </div>

                {/* Essential Quick Actions (Restoring functional density) */}
                <div className="space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-3 px-1">Route Suggestions</div>
                    <button
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.04] text-slate-300 transition-all group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-cyan-300 transition-colors">Load Repository Data</span>
                        <span className="text-cyan-500/30 group-hover:text-cyan-400 transition-colors">→</span>
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.04] text-slate-300 transition-all group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-amber-300 transition-colors">Start Network Scan</span>
                        <span className="text-amber-500/30 group-hover:text-amber-400 transition-colors">→</span>
                    </button>
                    <button
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.04] text-slate-300 transition-all group opacity-50 cursor-not-allowed"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest">Export Execution Log</span>
                        <span>...</span>
                    </button>
                </div>
            </div>

            <footer className="p-5 border-t border-white/5 bg-black/20">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Node_Status: OK</span>
                    <span className="animate-pulse text-emerald-500/60">SYS_LINK_UP</span>
                </div>
            </footer>
        </aside>
    );
}

export default WorkbenchRail;
