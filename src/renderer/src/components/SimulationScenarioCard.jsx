import React from "react";

export default function SimulationScenarioCard({
    scenario,
    onRun,
}) {
    const safe = scenario && typeof scenario === "object" ? scenario : {};
    const severity = String(safe.severity || "warning");
    return (
        <article className={`rounded border px-2 py-2 ${
            severity === "critical"
                ? "border-rose-300/35 bg-rose-500/10"
                : severity === "degraded"
                    ? "border-amber-300/35 bg-amber-500/10"
                    : "border-cyan-300/30 bg-cyan-500/10"
        }`}>
            <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-slate-100">{safe.title}</div>
                <div className="text-[9px] font-mono uppercase text-slate-300">{severity}</div>
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-300">
                {(Array.isArray(safe.expectedResponse) ? safe.expectedResponse : []).join(" · ")}
            </div>
            <button
                type="button"
                data-testid={`tamper-run-${safe.scenarioId}`}
                onClick={() => {
                    if (typeof onRun === "function") onRun(safe);
                }}
                className="mt-2 px-2 py-1 rounded border border-white/10 bg-black/20 text-[9px] font-mono text-slate-100"
            >
                Run Simulation
            </button>
        </article>
    );
}
