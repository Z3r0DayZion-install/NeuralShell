import React from 'react';
import ShellBadge from './ShellBadge';

export function TopStatusBar({ model, setModel, stats, xpState, onOpenPalette, onOpenSettings }) {
    const tierName = ['INITIATE', 'OPERATOR', 'ANALYST', 'EXECUTOR', 'WARLORD', 'EXECUTIONER', 'APEX', 'GOD_MODE', 'PHASE_24_MUTANT'][Math.min((xpState?.tier || 1) - 1, 8)];

    return (
        <header className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-[#040c16]/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex gap-8 items-center">
                <div className="flex flex-col">
                    <div className="text-[9px] uppercase tracking-[0.4em] text-cyan-500/60 font-black mb-0.5">Sovereign_Node</div>
                    <div className="text-[13px] font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                        NeuralShell_V2.1.29
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-white/5 mx-1" />

                {/* Sovereign Telemetry Strip */}
                <div className="flex gap-8 items-center">
                    <div className="flex flex-col">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5 font-bold">Operator_Tier</div>
                        <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest">{tierName}</div>
                    </div>
                    <div className="flex flex-col min-w-[140px]">
                        <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5 font-bold">
                            <span>XP_Level_{xpState?.tier || 1}</span>
                            <span className="text-cyan-400/80 font-mono tracking-tighter">{xpState?.xp || 0}</span>
                        </div>
                        <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 transition-all duration-1000"
                                style={{ width: `${Math.min((xpState?.xp % 1000) / 10, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Discovery (Center) */}
            <div className="hidden 2xl:flex items-center gap-3 px-5 py-2 bg-black/40 rounded-full border border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                <span className="text-cyan-500/40">vault</span>
                <span>/</span>
                <span className="text-cyan-500/40">sessions</span>
                <span>/</span>
                <span className="text-slate-200 font-bold">active_thread_alpha</span>
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex flex-col items-end mr-2">
                    <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">CPU_LOAD</div>
                    <div className="text-[10px] font-mono text-slate-400 leading-none">{stats.cpuPercent || 0}%</div>
                </div>

                <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 outline-none focus:border-cyan-400/40 transition-all font-mono hover:bg-white/10 cursor-pointer appearance-none tracking-widest uppercase text-center min-w-[100px]"
                >
                    <option value="llama3">llama3</option>
                    <option value="mistral">mistral</option>
                    <option value="qwen">qwen</option>
                </select>

                <div className="h-6 w-[1px] bg-white/5 mx-1" />

                <button
                    onClick={onOpenPalette}
                    className="px-4 py-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-[10px] font-bold text-cyan-300 uppercase tracking-[0.2em] hover:bg-cyan-400/10 hover:border-cyan-400/40 transition-all shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                >
                    EXEC
                </button>
                <button
                    onClick={onOpenSettings}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all group"
                    title="Control Panel"
                >
                    <span className="group-hover:rotate-90 transition-transform duration-500 inline-block text-[14px]">⚙</span>
                </button>
            </div>
        </header>
    );
}

export default TopStatusBar;
