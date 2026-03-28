import React from "react";

export default function RecoveryScorecard({
    score,
    runs,
}) {
    const safeRuns = Array.isArray(runs) ? runs : [];
    const failed = safeRuns.filter((entry) => !entry.passed);
    const remediationTasks = failed.flatMap((run) => (
        Array.isArray(run.deltas) ? run.deltas.map((delta) => ({
            runId: run.runId,
            key: delta.key,
            expected: delta.expected,
            actual: delta.actual,
        })) : []
    ));

    return (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Recovery Scorecard</div>
                <div className="text-[10px] text-slate-500 font-mono">Readiness score and remediation tasks from failed drills.</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
                <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                    score {score.score}
                </div>
                <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                    passed {score.passed}
                </div>
                <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-rose-100">
                    failed {score.failed}
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-2 py-1 text-slate-300">
                    total {score.total}
                </div>
            </div>
            <div className="max-h-56 overflow-auto pr-1 space-y-1.5">
                {remediationTasks.map((task, index) => (
                    <article key={`${task.runId}-${task.key}-${index}`} className="rounded border border-amber-300/35 bg-amber-500/10 px-2 py-1.5">
                        <div className="text-[9px] font-mono text-amber-100">{task.key}</div>
                        <div className="text-[9px] font-mono text-slate-300">expected {JSON.stringify(task.expected)}</div>
                        <div className="text-[9px] font-mono text-slate-300">actual {JSON.stringify(task.actual)}</div>
                    </article>
                ))}
                {remediationTasks.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No remediation tasks. Latest drill set is aligned.</div>
                )}
            </div>
        </section>
    );
}
