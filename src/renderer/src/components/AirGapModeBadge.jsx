import React from "react";

export default function AirGapModeBadge({
    locked,
    onOpen,
}) {
    const active = Boolean(locked);
    return (
        <button
            type="button"
            data-testid="airgap-mode-badge"
            onClick={onOpen}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-[0.12em] ${
                active
                    ? "border-slate-300/30 bg-slate-500/20 text-slate-100"
                    : "border-cyan-300/35 bg-cyan-500/10 text-cyan-100"
            }`}
            title={active ? "Air-gapped lock is active" : "Air-gapped lock is inactive"}
            aria-label={active ? "Air-gapped lock active" : "Air-gapped lock inactive"}
        >
            <span>{active ? "AirGap Locked" : "AirGap Ready"}</span>
        </button>
    );
}
