import React from "react";

function toneClass(tone) {
    const safe = String(tone || "grey").toLowerCase();
    if (safe === "green") return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
    if (safe === "amber") return "border-amber-300/40 bg-amber-500/10 text-amber-100";
    if (safe === "red") return "border-rose-300/40 bg-rose-500/10 text-rose-100";
    if (safe === "blue" || safe === "cyan") return "border-cyan-300/35 bg-cyan-500/10 text-cyan-100";
    return "border-slate-300/20 bg-slate-500/10 text-slate-200";
}

export default function RuntimeStatusCard({
    title,
    subtitle,
    statusLabel,
    tone = "grey",
    rows = [],
    testId = "",
}) {
    return (
        <article
            data-testid={testId || undefined}
            aria-label={title}
            className="rounded-2xl border border-white/10 bg-black/35 p-3 space-y-2"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-300 font-bold">{title}</div>
                    {subtitle ? (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{subtitle}</div>
                    ) : null}
                </div>
                <div className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${toneClass(tone)}`}>
                    {statusLabel || "unknown"}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
                {(Array.isArray(rows) ? rows : []).map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 text-[10px] font-mono">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-200 text-right break-all">{row.value}</span>
                    </div>
                ))}
            </div>
        </article>
    );
}

