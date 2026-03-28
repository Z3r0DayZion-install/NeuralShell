import React from "react";

export default function RevenueCohortView({ cohorts = [] }) {
    return (
        <div className="space-y-1.5" role="list" aria-label="Revenue cohorts">
            {cohorts.map((entry) => (
                <article key={entry.stage} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                    <div className="text-[10px] font-mono text-slate-100">{entry.stage}</div>
                    <div className="text-[9px] font-mono text-slate-400">accounts {entry.accounts}</div>
                    <div className="text-[9px] font-mono text-slate-500">value ${Number(entry.estimatedValueUsd || 0).toLocaleString()}</div>
                </article>
            ))}
            {!cohorts.length && <div className="text-[10px] font-mono text-slate-500">No cohort data.</div>}
        </div>
    );
}
