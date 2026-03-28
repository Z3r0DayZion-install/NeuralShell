import React from "react";

export default function RolloutStageMatrix({ rows = [] }) {
    return (
        <div className="space-y-1.5" role="list" aria-label="Portfolio rollout stage matrix">
            {rows.map((row) => (
                <article key={row.siteId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                    <div className="text-[10px] font-mono text-slate-100">{row.account} · {row.region}</div>
                    <div className="text-[9px] font-mono text-slate-400">stage {row.stage}</div>
                    <div className="text-[9px] font-mono text-slate-500">blockers {row.blockerCount}</div>
                </article>
            ))}
            {!rows.length && <div className="text-[10px] font-mono text-slate-500">No rollout rows available.</div>}
        </div>
    );
}
