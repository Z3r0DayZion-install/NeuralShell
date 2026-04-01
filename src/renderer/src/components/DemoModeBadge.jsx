import React from "react";

export default function DemoModeBadge({ enabled, onOpen }) {
    return (
        <button
            type="button"
            data-testid="demo-mode-badge"
            onClick={onOpen}
            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-colors ${
                enabled
                    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                    : "border-slate-300/25 bg-slate-500/10 text-slate-200"
            }`}
            title="Demo mode"
        >
            Demo {enabled ? "On" : "Off"}
        </button>
    );
}
