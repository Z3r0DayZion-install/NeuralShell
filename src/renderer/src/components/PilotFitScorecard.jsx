import React from "react";

function statusTone(score) {
    if (score >= 80) return "text-emerald-200";
    if (score >= 55) return "text-amber-200";
    return "text-rose-200";
}

export default function PilotFitScorecard({ dimensions }) {
    const rows = Array.isArray(dimensions) ? dimensions : [];
    const total = Number(rows.reduce((acc, row) => acc + Number(row.weighted || 0), 0).toFixed(2));
    return (
        <section data-testid="pilot-fit-scorecard" className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2" aria-label="Pilot fit scorecard">
            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Pilot Fit Scorecard</div>
            <div className="space-y-1.5">
                {rows.map((row) => (
                    <article key={row.id} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                        <div className="text-[10px] font-mono text-slate-100">{row.label}</div>
                        <div className="text-[9px] font-mono text-slate-400">
                            score {Number(row.score || 0)} · weight {Number(row.weight || 0)} · weighted {Number(row.weighted || 0)}
                        </div>
                    </article>
                ))}
            </div>
            <div className={`rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1.5 text-[10px] font-mono ${statusTone(total)}`}>
                total score {total}
            </div>
        </section>
    );
}
