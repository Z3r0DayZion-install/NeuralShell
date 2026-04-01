import React from "react";

function toneClass(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "ready") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-100";
    if (safe === "attention") return "border-amber-300/35 bg-amber-500/10 text-amber-100";
    return "border-rose-300/35 bg-rose-500/10 text-rose-100";
}

export default function PartnerReadinessCard({ label, weight, score, status }) {
    return (
        <article className={`rounded border px-2 py-1.5 ${toneClass(status)}`} role="listitem" aria-label={`${label} readiness`}>
            <div className="text-[9px] uppercase tracking-[0.1em] font-mono opacity-80">{label}</div>
            <div className="text-[10px] font-mono font-semibold">{Number(score || 0)} / 100</div>
            <div className="text-[9px] font-mono opacity-80">weight {Number(weight || 0)}</div>
        </article>
    );
}
