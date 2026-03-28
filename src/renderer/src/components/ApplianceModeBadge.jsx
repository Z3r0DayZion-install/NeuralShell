import React from "react";

export default function ApplianceModeBadge({
    enabled,
    onOpen,
}) {
    const active = Boolean(enabled);
    return (
        <button
            type="button"
            data-testid="appliance-mode-badge"
            onClick={onOpen}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-[0.12em] ${
                active
                    ? "border-cyan-300/35 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-300/25 bg-slate-500/10 text-slate-300"
            }`}
            title={active ? "Appliance mode is active" : "Appliance mode is inactive"}
        >
            <span>{active ? "Appliance On" : "Appliance Off"}</span>
        </button>
    );
}