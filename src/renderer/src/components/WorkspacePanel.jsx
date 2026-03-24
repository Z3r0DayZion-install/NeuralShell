import React from 'react';
import ShellBadge from './ShellBadge';

export function WorkspacePanel({ chatLog, prompt, setPrompt, onSend }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");

    return (
        <main className="flex-1 flex flex-col min-w-0 bg-[#02080e]/40 relative overflow-hidden">
            {/* Narrative Discovery Banner (Stabilized) */}
            <div className="px-6 py-2.5 border-b border-white/[0.03] bg-amber-400/[0.02] flex items-center justify-between backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse" />
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-200/60">
                        Context_Sync // Delta_Phase_Harden
                    </div>
                </div>
                <div className="px-2 py-0.5 rounded border border-amber-400/20 text-[8px] font-mono text-amber-400/60 uppercase tracking-tighter">
                    Status: Sealed
                </div>
            </div>

            {/* Primary Chat Lane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
                {chatLog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 select-none">
                        <div className="text-8xl mb-6 font-mono tracking-tighter text-cyan-500/20">Ω</div>
                        <div className="text-[11px] uppercase tracking-[0.6em] text-slate-500">NeuralShell Workstation</div>
                        <div className="text-[8px] mt-6 font-mono tracking-[0.4em] text-slate-600">GA_BUILD_2.1.29 // OMEGA_SEALED</div>
                    </div>
                ) : chatLog.map((msg, i) => (
                    <div key={i} className={cn("max-w-[85%] 2xl:max-w-[75%]", msg.role === 'user' ? "ml-auto" : "mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500")}>
                        <div className={cn("flex items-center gap-3 mb-2.5 opacity-30", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={`h-[1px] w-6 ${msg.role === 'user' ? 'bg-cyan-400' : 'bg-slate-400'}`} />
                            <div className="text-[8px] uppercase tracking-[0.3em] font-black">
                                {msg.role === 'user' ? 'Operator' : 'AI_Kernel'}
                            </div>
                        </div>
                        <div className={cn(
                            "p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300",
                            msg.role === 'user'
                                ? "bg-[#0b1726]/80 border border-cyan-400/20 text-cyan-50 shadow-cyan-900/10"
                                : "bg-black/30 border border-white/[0.04] text-slate-300"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Fixed Composer Bottom */}
            <footer className="p-8 border-t border-white/[0.03] bg-[#02080e]/60 backdrop-blur-md">
                <div className="relative group max-w-5xl mx-auto">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
                        placeholder="Inject command or message into the active thread..."
                        className="w-full min-h-[140px] bg-black/40 border border-white/[0.05] rounded-2xl p-6 text-[15px] leading-relaxed text-slate-100 placeholder-slate-700 outline-none focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/10 transition-all resize-none shadow-inner"
                    />
                    <div className="absolute bottom-5 right-5 flex items-center gap-4">
                        <div className="text-[9px] text-slate-600 font-mono hidden group-focus-within:block animate-pulse tracking-widest">
                            SIGNAL_READY // CTRL+ENTER
                        </div>
                        <button
                            onClick={onSend}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:shadow-glow-cyan active:scale-[0.98]"
                        >
                            Inject Signal
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto mt-6 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar opacity-30 hover:opacity-100 transition-opacity duration-500">
                    {['/help', '/clear', '/stats', '/vault', '/guard', '/omega'].map(cmd => (
                        <button key={cmd} className="text-[8px] font-black px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-400/20 transition-all whitespace-nowrap uppercase tracking-[0.2em]">
                            {cmd}
                        </button>
                    ))}
                </div>
            </footer>
        </main>
    );
}

export default WorkspacePanel;
