import React from 'react';
import slashManifest from '../config/slash_manifest.json';
import { useSlash } from '../hooks/useSlash.ts';
import { buildShareUrl, createShareEnvelope } from '../utils/share.ts';
import AssistantMessage from './AssistantMessage';
import ProofChipRow from './ProofChipRow';
import SlashPalette from './SlashPalette';

const AUDIT_ALLOWED_COMMANDS = new Set(['/help', '/proof', '/roi', '/status', '/workflows', '/guard', '/clear']);

export function WorkspacePanel({
    chatLog,
    workflowId,
    prompt,
    setPrompt,
    onSend,
    onExecute,
    auditOnly,
    isThinking,
    onRegenerate,
    hasRegenerate,
    connectionInfo,
    sessionHydrationStatus,
    onOfflineKill,
}) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");
    const normalizedPrompt = String(prompt || '').trim().toLowerCase();
    const canRunPrompt = !auditOnly || AUDIT_ALLOWED_COMMANDS.has(normalizedPrompt);
    const [toast, setToast] = React.useState('');
    const [proofFlowState, setProofFlowState] = React.useState({
        lockSeen: false,
        unlockedRestored: false,
    });
    const composerRef = React.useRef(null);
    const toastTimerRef = React.useRef(null);

    const showToast = React.useCallback((value) => {
        setToast(String(value || '').trim());
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToast('');
        }, 1100);
    }, []);

    const slash = useSlash(slashManifest, (item) => {
        const template = String(item && item.template ? item.template : '');
        setPrompt(template);
        window.requestAnimationFrame(() => {
            if (composerRef.current) {
                composerRef.current.focus();
                const len = template.length;
                if (typeof composerRef.current.setSelectionRange === 'function') {
                    composerRef.current.setSelectionRange(len, len);
                }
            }
        });
    });

    React.useEffect(() => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        setProofFlowState({
            lockSeen: false,
            unlockedRestored: false,
        });
    }, [workflowId]);

    React.useEffect(() => {
        setProofFlowState((prev) => {
            if (sessionHydrationStatus === 'locked' && !prev.lockSeen) {
                return { ...prev, lockSeen: true };
            }
            if (sessionHydrationStatus === 'ready' && prev.lockSeen && !prev.unlockedRestored) {
                return { ...prev, unlockedRestored: true };
            }
            return prev;
        });
    }, [sessionHydrationStatus]);

    React.useEffect(() => {
        if (!composerRef.current) return;
        const active = document.activeElement;
        if (!active || active === document.body) {
            composerRef.current.focus();
        }
    }, [workflowId]);

    React.useEffect(() => {
        const draft = String(prompt || '');
        const startsSlash = draft.startsWith('/');
        if (!startsSlash) {
            if (slash.open) slash.closePalette();
            return;
        }
        const query = draft.slice(1);
        if (query.includes(' ')) {
            if (slash.open) slash.closePalette();
            return;
        }
        if (!slash.open) {
            slash.openPalette(query);
            return;
        }
        slash.setQuery(query);
    }, [prompt, slash.open, slash.closePalette, slash.openPalette, slash.setQuery]);

    const messageText = chatLog.map((msg) => String(msg && msg.content ? msg.content : '')).join('\n');
    const hasProofOutput = /90-Second Value Proof/i.test(messageText);
    const hasRoiOutput = /NeuralShell ROI Snapshot/i.test(messageText);
    const providerLabel = String((connectionInfo && connectionInfo.provider) || 'ollama').toUpperCase();
    const connectionHealth = String((connectionInfo && connectionInfo.health) || 'unknown');
    const modelLabel = String((connectionInfo && connectionInfo.model) || 'llama3');
    const allowRemoteBridge = Boolean(connectionInfo && connectionInfo.allowRemoteBridge);

    const shareAssistantMessage = React.useCallback(async (content) => {
        try {
            const payload = {
                app: 'NeuralShell',
                generatedAt: new Date().toISOString(),
                workflowId: String(workflowId || ''),
                messages: [
                    {
                        role: 'assistant',
                        content: String(content || ''),
                    },
                ],
            };
            const encoded = await createShareEnvelope(payload);
            const url = buildShareUrl(encoded.hash, encoded.fragment);
            await navigator.clipboard.writeText(url);
            showToast('Copied share link');
        } catch {
            showToast('Share failed');
        }
    }, [showToast, workflowId]);

    const flowSteps = [
        { id: 'proof', label: 'Proof', done: hasProofOutput },
        { id: 'roi', label: 'ROI', done: hasRoiOutput },
        { id: 'lock', label: 'Lock', done: proofFlowState.lockSeen },
        { id: 'restore', label: 'Restore', done: proofFlowState.unlockedRestored },
    ];

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

            <div className="px-6 py-2 border-b border-white/[0.03] bg-black/20 flex flex-wrap items-center justify-between gap-2">
                <ProofChipRow steps={flowSteps} />
                <div className={cn(
                    'px-2.5 py-1 rounded-md text-[8px] font-mono uppercase tracking-[0.14em] border',
                    connectionHealth === 'online'
                        ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                        : connectionHealth === 'offline'
                            ? 'border-rose-300/30 bg-rose-500/10 text-rose-200'
                            : 'border-slate-400/20 bg-slate-500/10 text-slate-300',
                )}
                >
                    {providerLabel} · {modelLabel} · {connectionHealth === 'online' ? 'Connected' : connectionHealth === 'offline' ? 'Unavailable' : 'Unknown'}
                </div>
            </div>

            {/* Primary Chat Lane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
                {chatLog.length === 0 ? (
                    <div className="h-full flex flex-col justify-center select-none max-w-2xl mx-auto animate-in fade-in duration-700 pb-10">
                        {workflowId === 'NeuralShell_QuickStart' ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-1">
                                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-cyan-400">Welcome, Operator</h1>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/20 text-[9px] text-emerald-400 font-mono tracking-widest font-bold">NODE_READY</span>
                                </div>
                                <p className="text-[14px] text-slate-300 font-mono leading-relaxed">
                                    NeuralShell is designed to sell itself through live proof. In under two minutes, you can verify trust posture, demonstrate guardrails, and show clear operator ROI without leaving this console.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">Local-Only By Default</div>
                                        <div className="text-[10px] text-slate-300 font-mono mt-1">No remote bridge is used unless explicitly enabled.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">Session Vault</div>
                                        <div className="text-[10px] text-slate-300 font-mono mt-1">Save, lock, and restore workflows with passphrase control.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">Guarded Apply</div>
                                        <div className="text-[10px] text-slate-300 font-mono mt-1">No workspace mutation happens without explicit operator action.</div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-cyan-400/20 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">1</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Run Live Value Proof</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Execute <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/proof</code> to surface trust, safety, and release evidence in one output.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">2</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Demonstrate Persistence</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Create a workflow in the left rail, run <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/guard</code>, then save + lock it.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">3</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Show Business Impact</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Run <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/roi</code> to produce a fast operator-value snapshot for decision makers.</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                                        Start Here
                                    </div>
                                    <button
                                        data-testid="quickstart-proof-btn"
                                        onClick={() => onExecute('/proof')}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300/40 bg-cyan-400/15 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-400/25 transition-all"
                                    >
                                        Run 90s Proof
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            data-testid="quickstart-roi-btn"
                                            onClick={() => onExecute('/roi')}
                                            className="px-4 py-3 rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-400/20 transition-all"
                                        >
                                            Show ROI Snapshot
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPrompt('/guard')}
                                            className="px-4 py-3 rounded-xl border border-amber-300/30 bg-amber-400/10 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200 hover:bg-amber-400/20 transition-all"
                                        >
                                            Prep Lock Flow
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    Your data remains local. No signals are broadcasted without explicit operator authorization.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-xl font-black uppercase tracking-[0.2em] text-slate-200">NeuralShell Value Console</h1>
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[9px] text-cyan-400 font-mono tracking-widest font-bold">OPERATIONAL</span>
                                </div>
                                <p className="text-[12px] text-slate-400 mb-10 font-mono leading-relaxed max-w-xl">
                                    This workspace is tuned for product-led conversion: prove trust, prove reliability, then prove ROI in the same flow.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                    <div className="p-3 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-300">Proof</div>
                                        <div className="text-[10px] font-mono text-slate-300 mt-1">Run <code className="text-cyan-300">/proof</code> to show security + release credibility.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300">Persistence</div>
                                        <div className="text-[10px] font-mono text-slate-300 mt-1">Demonstrate save, lock, and restore in one workflow loop.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04]">
                                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-300">ROI</div>
                                        <div className="text-[10px] font-mono text-slate-300 mt-1">Run <code className="text-amber-300">/roi</code> for a fast operator value estimate.</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {/* Card 1: Resume / Artifact */}
                                    <button data-testid="card-resume" onClick={() => onExecute('/resume')} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                                        <div className="text-cyan-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest mb-1.5">Resume Previous Workflow</span>
                                        <span className="text-[10px] text-slate-500 font-mono leading-relaxed">Reload the most recent active console state into memory.</span>
                                    </button>

                                    {/* Card 2: Load Repo */}
                                    <button data-testid="card-context" onClick={() => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) }} className="group flex flex-col text-left p-5 rounded-2xl bg-white/[0.02] hover:bg-slate-900/80 border border-white/5 hover:border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
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

                                    <button data-testid="card-proof" onClick={() => onExecute('/proof')} className="group flex flex-col text-left p-5 rounded-2xl bg-cyan-500/[0.05] hover:bg-cyan-500/[0.10] border border-cyan-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                                        <div className="text-cyan-300 mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-cyan-100 uppercase tracking-widest mb-1.5">Run 90-Second Proof</span>
                                        <span className="text-[10px] text-cyan-100/70 font-mono leading-relaxed">Generate a concise trust + safety + release proof narrative live.</span>
                                    </button>

                                    <button data-testid="card-roi" onClick={() => onExecute('/roi')} className="group flex flex-col text-left p-5 rounded-2xl bg-emerald-500/[0.05] hover:bg-emerald-500/[0.10] border border-emerald-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]">
                                        <div className="text-emerald-300 mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1.5">Generate ROI Snapshot</span>
                                        <span className="text-[10px] text-emerald-100/70 font-mono leading-relaxed">Turn technical proof into decision-ready business value language.</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : chatLog.map((msg, i) => {
                    if (msg.role === 'user') {
                        return (
                            <div data-testid="chat-message" key={i} className="max-w-[85%] 2xl:max-w-[75%] ml-auto">
                                <div className="flex items-center gap-3 mb-2.5 opacity-30 flex-row-reverse">
                                    <div className="h-px w-6 bg-cyan-400" />
                                    <div className="text-[8px] uppercase tracking-[0.3em] font-black">Operator</div>
                                </div>
                                <div className="p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300 bg-slate-900/80 border border-cyan-400/20 text-cyan-50 shadow-cyan-900/10 whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <AssistantMessage
                            key={i}
                            content={msg.content}
                            onToast={showToast}
                            onShare={shareAssistantMessage}
                        />
                    );
                })}
            </div>

            {/* Fixed Composer Bottom */}
            <footer className="p-6 border-t border-white/[0.03] bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto mb-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar opacity-30 hover:opacity-100 transition-opacity duration-300">
                    {['/help', '/proof', '/roi', '/clear', '/status', '/workflows', '/guard', '/omega'].map(cmd => (
                        <button
                            key={cmd}
                            onClick={() => setPrompt(cmd)}
                            disabled={auditOnly && !AUDIT_ALLOWED_COMMANDS.has(cmd)}
                            className={cn(
                                'text-[8px] font-black px-3 py-1.5 bg-white/5 rounded-md border border-white/5 whitespace-nowrap uppercase tracking-[0.2em]',
                                auditOnly && !AUDIT_ALLOWED_COMMANDS.has(cmd)
                                    ? 'text-slate-600 cursor-not-allowed'
                                    : 'text-slate-500 hover:text-cyan-400 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all',
                            )}
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
                <div className="max-w-5xl mx-auto mb-2 flex flex-wrap items-center gap-2">
                    <div className={cn(
                        'px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em]',
                        allowRemoteBridge
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200',
                    )}
                    >
                        {allowRemoteBridge ? 'Hosted lanes enabled' : 'Local-only lane'}
                    </div>
                    {typeof onOfflineKill === 'function' && (
                        <button
                            type="button"
                            onClick={onOfflineKill}
                            disabled={auditOnly}
                            className={cn(
                                'px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em]',
                                auditOnly
                                    ? 'border-white/10 text-slate-600 cursor-not-allowed'
                                    : 'border-rose-300/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
                            )}
                        >
                            Offline Kill
                        </button>
                    )}
                </div>
                {auditOnly && (
                    <div className="max-w-5xl mx-auto mb-2 text-[10px] text-amber-300/80 font-mono">
                        Write actions disabled - upgrade to Pro.
                    </div>
                )}
                {isThinking && (
                    <div className="max-w-5xl mx-auto mb-2 text-[10px] text-cyan-200/90 font-mono flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
                        NeuralShell is thinking...
                    </div>
                )}

                <div className="relative group max-w-5xl mx-auto" data-testid="composer-input">
                    <SlashPalette
                        open={slash.open}
                        query={slash.query}
                        setQuery={(value) => {
                            slash.setQuery(value);
                            setPrompt(value ? `/${value}` : '/');
                        }}
                        items={slash.filtered}
                        selectedIndex={slash.selectedIndex}
                        onSelectIndex={slash.setSelectedIndex}
                        onPick={slash.pick}
                        onClose={slash.closePalette}
                        onKeyDown={slash.handleKeyDown}
                    />
                    <textarea
                        ref={composerRef}
                        data-testid="chat-input"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={(event) => {
                            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                                event.preventDefault();
                                const current = String(prompt || '');
                                if (!current.startsWith('/')) {
                                    setPrompt('/');
                                }
                                slash.openPalette(current.startsWith('/') ? current.replace(/^\//, '') : '');
                                return;
                            }
                            if (slash.open && slash.handleKeyDown(event)) {
                                return;
                            }
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                if (canRunPrompt) onSend();
                            }
                        }}
                        placeholder={auditOnly ? "Audit-only mode: use /proof, /roi, /status, /guard, /help, /workflows." : "Enter command or ask a question into the active thread..."}
                        disabled={auditOnly && !canRunPrompt}
                        className="w-full min-h-32 bg-black/50 border border-white/[0.08] rounded-2xl p-5 text-[14px] leading-relaxed text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/10 transition-all resize-none shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4 border-t border-white/5 pt-3 w-[calc(100%-32px)] justify-end">
                        <div className="text-[9px] text-slate-600 font-mono hidden group-focus-within:block animate-pulse tracking-widest mr-auto pl-2">
                            SIGNAL_READY // CTRL+ENTER
                        </div>
                        {hasRegenerate && typeof onRegenerate === 'function' && (
                            <button
                                type="button"
                                onClick={onRegenerate}
                                disabled={Boolean(isThinking)}
                                className={cn(
                                    'px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.16em] transition-all',
                                    isThinking
                                        ? 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200',
                                )}
                            >
                                Regenerate
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (canRunPrompt) onSend();
                            }}
                            disabled={!canRunPrompt || Boolean(isThinking)}
                            className={cn(
                                'px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                                canRunPrompt && !isThinking
                                    ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:shadow-glow-cyan active:scale-[0.98]'
                                    : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed',
                            )}
                        >
                            Execute Command
                        </button>
                    </div>
                </div>
            </footer>
            <div
                data-testid="copy-toast"
                className={`fixed bottom-5 right-5 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-[10px] font-mono text-cyan-100 transition-opacity duration-1000 ${toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {toast || ' '}
            </div>
        </main>
    );
}

export default WorkspacePanel;
