import React from "react";

function toStringValue(value) {
    if (value == null) return "null";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
}

export default function RestorePreview({
    currentState = {},
    incomingState = {},
}) {
    const current = currentState && typeof currentState === "object" ? currentState : {};
    const incoming = incomingState && typeof incomingState === "object" ? incomingState : {};
    const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(incoming)])).sort();
    const rows = keys
        .map((key) => ({
            key,
            before: current[key],
            after: incoming[key],
            changed: JSON.stringify(current[key]) !== JSON.stringify(incoming[key]),
        }))
        .filter((entry) => entry.changed);

    return (
        <section data-testid="restore-preview" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Restore Preview</div>
            <div className="max-h-60 overflow-auto space-y-1 pr-1">
                {rows.map((row) => (
                    <div key={row.key} className="grid grid-cols-3 gap-2 rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[10px] font-mono">
                        <div className="text-amber-100 break-all">{row.key}</div>
                        <div className="text-slate-300 break-all">{toStringValue(row.before)}</div>
                        <div className="text-slate-100 break-all">{toStringValue(row.after)}</div>
                    </div>
                ))}
                {rows.length === 0 && (
                    <div className="text-[10px] font-mono text-emerald-300">No diff detected.</div>
                )}
            </div>
        </section>
    );
}