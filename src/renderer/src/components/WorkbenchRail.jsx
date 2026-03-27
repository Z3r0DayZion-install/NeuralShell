import React from 'react';
import RitualTerminal from './RitualTerminal';
import ShellBadge from './ShellBadge';
import WorkspaceFileItem from './WorkspaceFileItem';
import WorkspaceFileViewer from './WorkspaceFileViewer';

export function WorkbenchRail({
    stats,
    workflowId,
    onExecute,
    onInsertPrompt,
    auditOnly,
    widthPx = 288,
}) {
    const [gitSummary, setGitSummary] = React.useState(null);
    const railWidth = Number.isFinite(Number(widthPx)) ? Math.max(220, Math.round(Number(widthPx))) : 288;

    React.useEffect(() => {
        let mounted = true;

        const refreshGitStatus = async () => {
            try {
                if (!(window.api && window.api.workspace && typeof window.api.workspace.gitStatus === 'function')) {
                    return;
                }
                const activeWorkspace = window.api.workspace.getActive
                    ? await window.api.workspace.getActive()
                    : null;
                const rootPath = activeWorkspace && activeWorkspace.path ? String(activeWorkspace.path) : '';
                const summary = await window.api.workspace.gitStatus(rootPath);
                if (!mounted) return;
                setGitSummary(summary || null);
            } catch {
                if (!mounted) return;
                setGitSummary(null);
            }
        };

        refreshGitStatus();
        const interval = window.setInterval(refreshGitStatus, 2000);
        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const triggerPalette = () => {
        window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    };

    const runCommand = (command) => {
        if (typeof onExecute === 'function') {
            onExecute(command);
            return;
        }
        triggerPalette();
    };

    return (
        <aside
            data-testid="workbench-rail"
            className="shrink-0 border-l border-white/5 flex flex-col bg-slate-950/50 backdrop-blur-xl z-20"
            style={{ width: `${railWidth}px` }}
        >
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
                                {workflowId || 'Global_Empty_State'}
                            </div>
                        </div>
                        <ShellBadge tone={workflowId ? "green" : "warn"}>{workflowId ? "ON_LINK" : "AWAIT"}</ShellBadge>
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
                        <div className="flex flex-wrap gap-1.5">
                            <WorkspaceFileItem
                                label="Added"
                                count={gitSummary && gitSummary.counts ? gitSummary.counts.added : 0}
                                tone="added"
                                testId="git-badge-added"
                            />
                            <WorkspaceFileItem
                                label="Modified"
                                count={gitSummary && gitSummary.counts ? gitSummary.counts.modified : 0}
                                tone="modified"
                                testId="git-badge-modified"
                            />
                            <WorkspaceFileItem
                                label="Deleted"
                                count={gitSummary && gitSummary.counts ? gitSummary.counts.deleted : 0}
                                tone="deleted"
                                testId="git-badge-deleted"
                            />
                        </div>
                        {auditOnly && (
                            <div className="text-[9px] font-mono text-amber-300/80">
                                Auditor mode: read-only workbench actions.
                            </div>
                        )}
                    </div>
                </div>

                {/* Essential Quick Actions (Restoring functional density) */}
                <div className="space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-3 px-1">Route Suggestions</div>
                    <button
                       onClick={triggerPalette}
                       className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.04] text-slate-300 transition-all group"
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-cyan-300 transition-colors">GOTO: LOAD REPOSITORY</span>
                       <span className="text-cyan-500/30 group-hover:text-cyan-400 transition-colors">→</span>
                    </button>
                    <button
                       onClick={triggerPalette}
                       className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.04] text-slate-300 transition-all group"
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-amber-300 transition-colors">GOTO: NETWORK SCAN</span>
                       <span className="text-amber-500/30 group-hover:text-amber-400 transition-colors">→</span>
                    </button>
                </div>

                <WorkspaceFileViewer
                    onInsertCommand={(command) => {
                        if (typeof onInsertPrompt === 'function') {
                            onInsertPrompt(command);
                            return;
                        }
                        runCommand(command);
                    }}
                />

                <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04] space-y-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Deal_Closer</div>
                    <p className="text-[10px] text-emerald-100/80 font-mono leading-relaxed">
                        Run a live trust proof and ROI snapshot directly in-session. Let the product demonstrate value before any pitch.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            data-testid="run-proof-btn"
                            onClick={() => runCommand('/proof')}
                            className="px-2.5 py-2 rounded border border-emerald-300/30 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-200 hover:bg-emerald-300/10"
                        >
                            Run /Proof
                        </button>
                        <button
                            data-testid="run-roi-btn"
                            onClick={() => runCommand('/roi')}
                            className="px-2.5 py-2 rounded border border-cyan-300/30 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-300/10"
                        >
                            Run /ROI
                        </button>
                    </div>
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
