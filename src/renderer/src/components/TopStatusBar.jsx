import React from 'react';
import ShellBadge from './ShellBadge';

export function TopStatusBar({ model, setModel, stats, xpState, activeSession, onOpenPalette, onOpenSettings }) {
    const tierName = ['INITIATE', 'OPERATOR', 'ANALYST', 'EXECUTOR', 'WARLORD', 'EXECUTIONER', 'APEX', 'GOD_MODE', 'PHASE_24_MUTANT'][Math.min((xpState?.tier || 1) - 1, 8)];

    return (
        <header data-testid="top-status-bar" className="h-14 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
            <div className="flex gap-8 items-center">
                <div data-testid="trust-indicator" className="flex flex-col">
                    <div className="text-[9px] uppercase tracking-[0.4em] text-cyan-500/60 font-black mb-0.5">Trust_Node_Sovereign</div>
                    <div className="text-[13px] font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                        NeuralShell_V2.1.29
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                    </div>
                </div>

                <div className="h-6 w-px bg-white/5 mx-1" />

                {/* Sovereign Telemetry Strip */}
                <div className="flex gap-8 items-center">
                    <div className="flex flex-col">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5 font-bold">Operator_Tier</div>
                        <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest">{tierName}</div>
                    </div>
                    <div className="flex flex-col min-w-36">
                        <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] text-cyan-500 mb-0.5 font-bold">
                            <span>XP_Lvl_{xpState?.tier || 1}</span>
                            <span className="text-cyan-400/80 font-mono tracking-tighter">{xpState?.xp || 0}</span>
                        </div>
                        <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 transition-all duration-1000 shadow-glow-cyan"
                                style={{ width: `${Math.min((xpState?.xp % 1000) / 10, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Discovery (Center - Now dynamically linked) */}
            <div className="hidden 2xl:flex items-center gap-3 px-6 py-2 bg-black/60 rounded-full border border-white/[0.06] text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] shadow-inner transition-colors group hover:border-cyan-400/30">
                <span className="text-cyan-500/40 group-hover:text-cyan-500/80 transition-colors">active</span>
                <span className="opacity-40">/</span>
                <span className="text-cyan-500/40 group-hover:text-cyan-500/80 transition-colors">workflows</span>
                <span className="opacity-40">/</span>
                {activeSession ? (
                    <span className="text-cyan-300 font-bold tracking-tight bg-cyan-400/10 px-2 py-0.5 rounded">{activeSession}</span>
                ) : (
                    <span className="text-slate-600 italic">idle_empty_state</span>
                )}
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex flex-col items-end mr-2">
                    <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">CPU_LOAD</div>
                    <div className="text-[10px] font-mono text-slate-400 leading-none">{stats.cpuPercent || 0}%</div>
                </div>

                <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 outline-none focus:border-cyan-400/40 transition-all font-mono hover:bg-white/10 cursor-pointer appearance-none tracking-widest uppercase text-center min-w-24 shadow-inner"
                >
                    <option value="llama3">llama3</option>
                    <option value="mistral">mistral</option>
                    <option value="qwen">qwen</option>
                </select>

                <div className="h-6 w-px bg-white/5 mx-1" />

                <button data-testid="command-palette-btn"
                    onClick={onOpenPalette}
                    className="px-5 py-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-[10px] font-black text-cyan-300 uppercase tracking-[0.2em] hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] active:scale-95"
                >
                    EXEC
                </button>
                <button data-testid="settings-open-btn"
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-100 hover:bg-white/10 hover:border-white/20 transition-all group"
                    title="Control Panel"
                >
                    <span className="group-hover:rotate-90 transition-transform duration-500 inline-block text-[14px]">⚙</span>
                </button>
            </div>
        </header>
    );
}

export default TopStatusBar;
