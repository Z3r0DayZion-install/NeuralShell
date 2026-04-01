import React from "react";

export default function RollbackHistoryView({
    history = [],
    onRollback,
}) {
    const safeHistory = Array.isArray(history) ? history : [];
    return (
        <section data-testid="rollback-history-view" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Rollout History</div>
            <div className="max-h-48 overflow-auto space-y-1 pr-1">
                {safeHistory.map((entry) => (
                    <article key={entry.rolloutId} className="rounded border border-white/10 bg-black/30 p-2">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="text-slate-100">{String(entry.policyProfile || entry.policyId || "policy")}</span>
                            <span className="text-slate-500">{String(entry.status || "pending")}</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">nodes: {(entry.nodeIds || []).length} · {String(entry.updatedAt || entry.createdAt || "")}</div>
                        <div className="mt-1 flex justify-end">
                            <button
                                type="button"
                                data-testid={`rollout-rollback-${entry.rolloutId}`}
                                onClick={() => {
                                    if (typeof onRollback === "function") onRollback(entry);
                                }}
                                className="px-2 py-1 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-amber-100"
                            >
                                Rollback
                            </button>
                        </div>
                    </article>
                ))}
                {safeHistory.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No rollout history yet.</div>
                )}
            </div>
        </section>
    );
}