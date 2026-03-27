import React from "react";

function styleFor(status) {
    const safe = String(status || "unknown").toLowerCase();
    if (safe === "running") return "border-emerald-300/30 bg-emerald-500/10 text-emerald-200";
    if (safe === "stopped" || safe === "degraded") return "border-amber-300/40 bg-amber-500/10 text-amber-100";
    if (safe === "fatal" || safe === "spawn-failed") return "border-rose-300/40 bg-rose-500/10 text-rose-100";
    return "border-slate-300/20 bg-slate-500/10 text-slate-300";
}

export default function WatchdogStatusBadge({
    status,
    alertCount,
    onClick,
}) {
    return (
        <button
            type="button"
            data-testid="watchdog-status-badge"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-[0.14em] ${styleFor(status)}`}
            title="Open runtime watchdog alerts"
        >
            <span>Watchdog</span>
            <span>{String(status || "unknown")}</span>
            <span className="opacity-80">{Math.max(0, Number(alertCount || 0))}</span>
        </button>
    );
}

