import React from "react";

function toneClass(status) {
    if (status === "certified" || status === "ready") return "border-emerald-300/25 bg-emerald-500/10 text-emerald-100";
    if (status === "in_progress" || status === "attention") return "border-amber-300/25 bg-amber-500/10 text-amber-100";
    return "border-rose-300/25 bg-rose-500/10 text-rose-100";
}

export default function PartnerEnablementTracker({ track }) {
    const safe = track && typeof track === "object" ? track : {};
    return (
        <article className={`rounded border px-2 py-1.5 ${toneClass(String(safe.status || ""))}`} role="listitem">
            <div className="text-[10px] font-mono text-slate-100">{String(safe.track || "Track")}</div>
            <div className="text-[9px] font-mono text-slate-300">role {String(safe.role || "n/a")}</div>
            <div className="text-[9px] font-mono text-slate-300">completion {Number(safe.completion || 0)}%</div>
            <div className="text-[9px] font-mono text-slate-400">status {String(safe.status || "unknown")}</div>
        </article>
    );
}
