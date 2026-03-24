import React from 'react';
import { useShell } from '../state/ShellContext';

export default function SettingsDrawer() {
    const { closeSettings } = useShell();

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={closeSettings} />
            <div className="fixed right-0 top-0 bottom-0 w-[450px] z-50 bg-[#071321] border-l border-cyan-400/20 shadow-[-10px_0_30px_rgba(0,0,0,0.4)] p-8 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Configuration</h2>
                    <button onClick={closeSettings} className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400">✕</button>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-4 no-scrollbar">
                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-4 font-bold">Bridge Settings</div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Safe Defaults</div>
                                    <div className="text-[10px] text-slate-500">Enable OMEGA-hardened prompts</div>
                                </div>
                                <div className="h-5 w-10 bg-cyan-400/20 border border-cyan-400/40 rounded-full flex items-center px-1">
                                    <div className="h-3 w-3 bg-cyan-400 rounded-full ml-auto" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5 opacity-40">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Network Tunnel</div>
                                    <div className="text-[10px] text-slate-500">Requires APEX tier license</div>
                                </div>
                                <div className="h-5 w-10 bg-slate-800 rounded-full" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
