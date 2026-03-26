import React from 'react';

/**
 * ShellBadge component from the overhaul design.
 */
export function ShellBadge({ children, tone = "default" }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");

    const toneClass =
        tone === "cyan"
            ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
            : tone === "gold"
                ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                : tone === "warn"
                    ? "border-orange-400/25 bg-orange-400/10 text-orange-200"
                    : tone === "green"
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.035] text-slate-300";

    return (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            toneClass
        )}>
            {children}
        </span>
    );
}

export default ShellBadge;
