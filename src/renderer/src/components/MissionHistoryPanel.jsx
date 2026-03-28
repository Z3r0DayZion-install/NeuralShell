import React from "react";

export default function MissionHistoryPanel({
    history = [],
    onCancel,
}) {
    const safeHistory = Array.isArray(history) ? history : [];
    return (
        <section data-testid="mission-history-panel" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Mission History</div>
            <div className="max-h-56 overflow-auto space-y-1 pr-1">
                {safeHistory.map((entry) => (
                    <article key={entry.runId} className="rounded border border-white/10 bg-black/30 p-2">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="text-slate-100">{entry.label}</span>
                            <span className="text-slate-500">{entry.status}</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">{entry.missionId} · {entry.startedAt}</div>
                        <div className="text-[9px] font-mono text-slate-400">{entry.detail}</div>
                        <div className="mt-1 flex justify-end">
                            <button
                                type="button"
                                data-testid={`mission-cancel-${entry.runId}`}
                                onClick={() => {
                                    if (typeof onCancel === "function") onCancel(entry.runId);
                                }}
                                className="px-2 py-1 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-amber-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </article>
                ))}
                {safeHistory.length === 0 && <div className="text-[10px] font-mono text-slate-500">No missions run yet.</div>}
            </div>
        </section>
    );
}