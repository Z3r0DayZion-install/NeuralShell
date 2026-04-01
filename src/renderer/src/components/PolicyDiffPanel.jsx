import React from "react";

export default function PolicyDiffPanel({
    rows = [],
}) {
    const safeRows = Array.isArray(rows) ? rows : [];
    return (
        <section data-testid="policy-diff-panel" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Policy Diff Preview</div>
            <div className="max-h-44 overflow-auto space-y-1 pr-1">
                {safeRows.map((row) => (
                    <div key={row.key} className="grid grid-cols-3 gap-2 rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[10px] font-mono">
                        <div className="text-amber-100 break-all">{String(row.key || "field")}</div>
                        <div className="text-slate-300 break-all">{String(row.before)}</div>
                        <div className="text-slate-100 break-all">{String(row.after)}</div>
                    </div>
                ))}
                {safeRows.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No diff to apply.</div>
                )}
            </div>
        </section>
    );
}