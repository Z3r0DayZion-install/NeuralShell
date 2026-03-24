import React from 'react';
import RitualTerminal from './RitualTerminal';
import Panel from './Panel';
import ShellBadge from './ShellBadge';

export function WorkbenchRail({ stats }) {
    return (
        <aside className="w-[280px] border-l border-white/5 flex flex-col bg-[#040c16]/50 backdrop-blur-xl z-20">
            <header className="p-6 border-b border-white/5">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-500/60 mb-2">Workbench_Control</div>
                <h2 className="text-sm font-bold tracking-tight text-slate-100 uppercase tracking-[0.1em]">Heuristics_Bridge</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Core Ritual Engine */}
                <RitualTerminal />

                {/* Sovereign Trust Statistics */}
                <Panel className="p-5 border-white/[0.03] bg-amber-400/[0.03] backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-5">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/60">Trust_Lane</div>
                        <ShellBadge tone="gold">SECURE</ShellBadge>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'IPC Bridge', status: 'Secure_ECC', tone: 'green' },
                            { label: 'Integrity', status: 'Active_SHA256', tone: 'green' },
                            { label: 'FS_Guard', status: 'Hardened', tone: 'green' },
                            { label: 'Network', status: 'Offline_Airgap', tone: 'warn' }
                        ].map(item => (
                            <div key={item.label} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</span>
                                    <span className={`text-[10px] font-mono font-bold ${item.tone === 'green' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="h-0.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                                    <div className={`h-full ${item.tone === 'green' ? 'bg-emerald-500/40' : 'bg-orange-500/40'} w-full`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <div className="p-4 bg-black/30 rounded-2xl border border-white/[0.03]">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-4 px-1">System_Delta_Log</div>
                    <div className="font-mono text-[9px] space-y-3 pl-1">
                        <div className="text-emerald-500/60 flex gap-2">
                            <span className="opacity-40">06:43</span>
                            <span>[TRU] Ed25519 Seal verified.</span>
                        </div>
                        <div className="text-cyan-500/60 flex gap-2">
                            <span className="opacity-40">06:44</span>
                            <span>[SYS] IPC State synched.</span>
                        </div>
                        <div className="text-slate-500/60 flex gap-2">
                            <span className="opacity-40">06:47</span>
                            <span>[WRT] Build_2.1.29 Active.</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border border-cyan-400/10 bg-cyan-400/[0.02] rounded-2xl">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-500/60 mb-2">Active_Artifact</div>
                    <div className="text-[10px] text-slate-500 italic mb-4">"Ready for artifact staging."</div>
                    <button className="w-full py-2.5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-[9px] font-bold text-cyan-300 uppercase tracking-[0.1em] hover:bg-cyan-400/10 transition-all">
                        Load Repository
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default WorkbenchRail;
