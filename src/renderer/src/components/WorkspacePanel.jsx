import React from 'react';
import ShellBadge from './ShellBadge';

export function WorkspacePanel({ chatLog, activeSession, prompt, setPrompt, onSend, onExecute }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");

    return (
        <main data-testid="workspace-panel" className="flex-1 flex flex-col relative bg-slate-950/40 overflow-hidden">
            {/* Narrative Discovery Banner (Stabilized) */}
            <div className="px-6 py-2.5 border-b border-white/[0.03] bg-amber-400/[0.02] flex items-center justify-between backdrop-blur-sm z-10 transition-all">
                <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse" />
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-200/60">
                        {chatLog.length > 0 ? "Analysis_In_Progress" : "Ready_for_Input // Integrity_Guard_Active"}
                    </div>
                </div>
                <div className="px-2 py-0.5 rounded border border-amber-400/20 text-[8px] font-mono text-amber-400/60 uppercase tracking-tighter">
                    Status: Sealed
                </div>
            </div>

            {/* Primary Chat Lane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
                {chatLog.length === 0 ? (
                    <div className="h-full flex flex-col justify-center select-none max-w-2xl mx-auto animate-in fade-in duration-700 pb-10">
                        {activeSession === 'NeuralShell_QuickStart' ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-cyan-400">Welcome, Operator</h1>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/20 text-[9px] text-emerald-400 font-mono tracking-widest font-bold">NODE_READY</span>
                                </div>
                                <p className="text-[14px] text-slate-300 font-mono leading-relaxed">
                                    I am your local-first NeuralShell workstation. This is a guided Workflow designed to help you verify your node's integrity and execute your first local AI command.
                                </p>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-cyan-400/20 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">1</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Verify Integrity</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Check the Top Status Bar for the "Sealed" badge.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">2</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Execute Diagnostics</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Type <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/status</code> in the composer below.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">3</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Start a Workflow</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Click the "New Workflow" plus icon in the left rail.</div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    Your data remains local. No signals are broadcasted without explicit operator authorization.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-xl font-black uppercase tracking-[0.2em] text-slate-200">NeuralShell Operator Console</h1>
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[9px] text-cyan-400 font-mono tracking-widest font-bold">OPERATIONAL</span>
                                </div>
                                <p className="text-[12px] text-slate-400 mb-10 font-mono leading-relaxed max-w-xl">
                                    A local-first AI workstation for trusted autonomous execution.
                                    Inject your first command below or select a common route to begin.
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {/* Card 1: Resume / Artifact */}
                                    <button data-testid="card-resume" onClick={() => onExecute('/resume')} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                                        <div className="text-cyan-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest mb-1.5">Resume Previous Workflow</span>
                                        <span className="text-[10px] text-slate-500 font-mono leading-relaxed">Reload the most recent active console state into memory.</span>
                                    </button>

                                    {/* Card 2: Load Repo */}
                                    <button data-testid="card-context" onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) }} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                                        <div className="text-emerald-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest mb-1.5">Analyze Repository</span>
                                        <span className="text-[10px] text-slate-500 font-mono leading-relaxed">Mount a local directory for detailed heuristic analysis.</span>
                                    </button>

                                    {/* Card 3: Guard Rail Status */}
                                    <button data-testid="card-guard" onClick={() => onExecute('/guard')} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                                        <div className="text-amber-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest mb-1.5">Audit Integrity Guard</span>
                                        <span className="text-[10px] text-slate-500 font-mono leading-relaxed">Review current security guardrails and execution limits.</span>
                                    </button>

                                    {/* Card 4: Routines */}
                                    <button data-testid="card-help" onClick={() => onExecute('/help')} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                                        <div className="text-purple-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest mb-1.5">Available Protocols</span>
                                        <span className="text-[10px] text-slate-500 font-mono leading-relaxed">Display all installed automation protocols and custom aliases.</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : chatLog.map((msg, i) => (
                    <div data-testid="chat-message" key={i} className={cn("max-w-[85%] 2xl:max-w-[75%]", msg.role === 'user' ? "ml-auto" : "mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500")}>
                        <div className={cn("flex items-center gap-3 mb-2.5 opacity-30", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={`h-px w-6 ${msg.role === 'user' ? 'bg-cyan-400' : 'bg-slate-400'}`} />
                            <div className="text-[8px] uppercase tracking-[0.3em] font-black">
                                {msg.role === 'user' ? 'Operator' : 'Neural_Response'}
                            </div>
                        </div>
                        <div className={cn(
                            "p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300",
                            msg.role === 'user'
                                ? "bg-slate-900/80 border border-cyan-400/20 text-cyan-50 shadow-cyan-900/10"
                                : "bg-black/30 border border-white/[0.04] text-slate-300"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Fixed Composer Bottom */}
            <footer className="p-6 border-t border-white/[0.03] bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto mb-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar opacity-30 hover:opacity-100 transition-opacity duration-300">
                    {['/help', '/clear', '/status', '/workflows', '/guard', '/omega'].map(cmd => (
                        <button key={cmd} onClick={() => setPrompt(cmd)} className="text-[8px] font-black px-3 py-1.5 bg-white/5 rounded-md border border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all whitespace-nowrap uppercase tracking-[0.2em]">
                            {cmd}
                        </button>
                    ))}
                </div>

                <div className="relative group max-w-5xl mx-auto" data-testid="composer-input">
                    <textarea
                        data-testid="chat-input"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
                        placeholder="Enter command or ask a question into the active thread..."
                        className="w-full min-h-32 bg-black/50 border border-white/[0.08] rounded-2xl p-5 text-[14px] leading-relaxed text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/10 transition-all resize-none shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4 border-t border-white/5 pt-3 w-[calc(100%-32px)] justify-end">
                        <div className="text-[9px] text-slate-600 font-mono hidden group-focus-within:block animate-pulse tracking-widest mr-auto pl-2">
                            SIGNAL_READY // CTRL+ENTER
                        </div>
                        <button
                            onClick={onSend}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:shadow-glow-cyan active:scale-[0.98]"
                        >
                            Execute Command
                        </button>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export default WorkspacePanel;
