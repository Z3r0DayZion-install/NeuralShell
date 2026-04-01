import React from "react";

export default function OnboardingProgressRail({
    steps = [],
    progress = {},
    onReopen,
    onReset,
}) {
    const safeSteps = Array.isArray(steps) ? steps : [];
    const completed = safeSteps.filter((step) => Boolean(progress[String(step.id || "")])).length;
    const total = safeSteps.length || 1;
    const pct = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));

    return (
        <section
            data-testid="firstboot-progress-rail"
            aria-label="First Boot Progress"
            className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-2"
        >
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">First-Boot Authority</div>
                    <div className="text-[10px] font-mono text-slate-500">{completed}/{safeSteps.length} steps complete</div>
                </div>
                <div className="text-[10px] font-mono text-cyan-100">{pct}%</div>
            </div>
            <div className="h-1.5 rounded-full border border-white/10 bg-black/20 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    data-testid="firstboot-reopen-btn"
                    onClick={onReopen}
                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                >
                    Reopen
                </button>
                <button
                    type="button"
                    data-testid="firstboot-reset-btn"
                    onClick={onReset}
                    className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10"
                >
                    Reset
                </button>
            </div>
        </section>
    );
}

