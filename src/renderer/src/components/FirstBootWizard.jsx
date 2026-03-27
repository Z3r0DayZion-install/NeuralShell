import React from "react";

export default function FirstBootWizard({
    open,
    steps = [],
    progress = {},
    busyStepId = "",
    onRunStep,
    onSkipStep,
    onClose,
    onFinish,
}) {
    if (!open) return null;
    const safeSteps = Array.isArray(steps) ? steps : [];
    const completed = safeSteps.filter((step) => Boolean(progress[String(step.id || "")])).length;
    const allDone = completed >= safeSteps.length && safeSteps.length > 0;

    return (
        <div className="fixed inset-0 z-[140] bg-black/65 backdrop-blur-sm flex items-center justify-center p-5">
            <section
                data-testid="firstboot-authority-wizard"
                aria-label="First Boot Authority Wizard"
                className="w-full max-w-5xl rounded-2xl border border-cyan-300/25 bg-slate-950 p-5"
            >
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-bold">First-Boot Authority Funnel</div>
                        <div className="text-[11px] text-slate-400 font-mono">{completed}/{safeSteps.length} complete</div>
                    </div>
                    <button
                        type="button"
                        data-testid="firstboot-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-2 max-h-[56vh] overflow-auto pr-1">
                    {safeSteps.map((step, index) => {
                        const stepId = String(step.id || "");
                        const done = Boolean(progress[stepId]);
                        const running = busyStepId === stepId;
                        const critical = Boolean(step.critical);
                        return (
                            <article
                                key={stepId}
                                data-testid={`firstboot-step-${stepId}`}
                                className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                                    done
                                        ? "border-emerald-300/30 bg-emerald-500/10"
                                        : critical
                                            ? "border-cyan-300/30 bg-cyan-500/10"
                                            : "border-white/10 bg-black/30"
                                }`}
                            >
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-100">
                                        {index + 1}. {String(step.title || stepId)}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400">{String(step.description || "")}</div>
                                    {critical ? (
                                        <div className="text-[9px] font-mono text-amber-300 mt-1">Security-critical step</div>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!critical && !done ? (
                                        <button
                                            type="button"
                                            data-testid={`firstboot-skip-${stepId}`}
                                            onClick={() => onSkipStep(stepId)}
                                            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-[0.12em] text-slate-200 hover:bg-white/10"
                                        >
                                            Skip
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        data-testid={`firstboot-run-${stepId}`}
                                        disabled={done || running}
                                        onClick={() => onRunStep(stepId)}
                                        className={`px-3 py-1.5 rounded border text-[9px] font-mono uppercase tracking-[0.12em] ${
                                            done
                                                ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                                                : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                                        } disabled:opacity-60`}
                                    >
                                        {done ? "Done" : running ? "Running" : "Run"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500">
                        Completion summary is stored locally and can be reopened from Mission Control.
                    </div>
                    <button
                        type="button"
                        data-testid="firstboot-finish-btn"
                        onClick={onFinish}
                        className={`px-3 py-2 rounded border text-[10px] uppercase tracking-[0.14em] font-bold ${
                            allDone
                                ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                                : "border-white/10 bg-white/5 text-slate-300"
                        }`}
                    >
                        {allDone ? "Open Mission Control" : "Close"}
                    </button>
                </div>
            </section>
        </div>
    );
}

