import React from "react";

function toneClass(riskBand) {
    if (riskBand === "high") return "border-rose-300/25 bg-rose-500/10";
    if (riskBand === "medium") return "border-amber-300/25 bg-amber-500/10";
    return "border-emerald-300/25 bg-emerald-500/10";
}

export default function ManagedAccountCard({ account }) {
    const safe = account && typeof account === "object" ? account : {};
    return (
        <article className={`rounded border px-2 py-1.5 ${toneClass(String(safe.riskBand || "low"))}`} role="listitem">
            <div className="text-[10px] font-mono text-slate-100">{String(safe.accountName || "Managed Account")}</div>
            <div className="text-[9px] font-mono text-slate-400">stage {String(safe.rolloutStage || "unknown")}</div>
            <div className="text-[9px] font-mono text-slate-400">operator {String(safe.operator || "unassigned")}</div>
            <div className="text-[9px] font-mono text-slate-300">risk {Number(safe.riskScore || 0)} ({String(safe.riskBand || "low")})</div>
        </article>
    );
}
