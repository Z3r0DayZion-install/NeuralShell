import React from 'react';

/**
 * Metric component from the overhaul design.
 */
export function Metric({ label, value, inline = false }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");

    return (
        <div className={cn(inline ? "" : "rounded-2xl border border-white/6 bg-black/15 px-4 py-3")}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-semibold text-white">{value}</div>
        </div>
    );
}

export default Metric;
