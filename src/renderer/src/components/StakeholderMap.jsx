import React from "react";

export default function StakeholderMap({ stakeholders = [] }) {
    return (
        <div className="space-y-1.5" role="list" aria-label="Strategic account stakeholders">
            {stakeholders.map((entry) => (
                <article key={entry.stakeholderId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                    <div className="text-[10px] font-mono text-slate-100">{entry.role}</div>
                    <div className="text-[9px] font-mono text-slate-400">{entry.name}</div>
                    <div className="text-[9px] font-mono text-slate-500">alignment {entry.alignment}</div>
                </article>
            ))}
            {!stakeholders.length && <div className="text-[10px] font-mono text-slate-500">No stakeholders tracked.</div>}
        </div>
    );
}
