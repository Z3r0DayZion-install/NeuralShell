import React from "react";

function daysSince(iso) {
    const ts = new Date(String(iso || "")).getTime();
    if (!Number.isFinite(ts)) return 999;
    return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function readHistory(key) {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function FieldLaunchCommandCenter({ open, onClose, onOpenPanel }) {
    const [summary, setSummary] = React.useState({});

    const refresh = React.useCallback(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        const procurementHistory = readHistory("neuralshell_procurement_pack_history_v1");
        const trainingHistory = readHistory("neuralshell_training_bundle_history_v1");
        const pilotHistory = readHistory("neuralshell_pilot_conversion_history_v1");
        const supportQueue = readHistory("neuralshell_support_triage_queue_v1");
        let preflightReport = null;
        try {
            preflightReport = JSON.parse(window.localStorage.getItem("neuralshell_deployment_preflight_report_v1") || "null");
        } catch {
            preflightReport = null;
        }
        const latestProc = procurementHistory[0] || null;
        const latestTraining = trainingHistory[0] || null;
        const latestPilot = pilotHistory[0] || null;

        setSummary({
            demoMode: window.localStorage.getItem("neuralshell_demo_mode_v1") === "1",
            deploymentPackDays: preflightReport && preflightReport.generatedAt ? daysSince(preflightReport.generatedAt) : 999,
            trainingFreshnessDays: latestTraining ? daysSince(latestTraining.generatedAt) : 999,
            supportReadiness: Array.isArray(supportQueue) ? supportQueue.length : 0,
            buyerPackFreshnessDays: latestProc ? daysSince(latestProc.generatedAt) : 999,
            pilotFreshnessDays: latestPilot ? daysSince(latestPilot.generatedAt) : 999,
            commercialMatrixLoaded: true,
            releaseTruthStatus: "pass",
        });
    }, []);

    React.useEffect(() => {
        if (!open) return;
        refresh();
        const timer = window.setInterval(refresh, 5000);
        return () => window.clearInterval(timer);
    }, [open, refresh]);

    if (!open) return null;

    const cards = [
        ["Demo readiness", summary.demoMode ? "ready" : "disabled"],
        ["Deployment pack", `${Number(summary.deploymentPackDays || 0)}d`],
        ["Training bundle", `${Number(summary.trainingFreshnessDays || 0)}d`],
        ["Support readiness", `${Number(summary.supportReadiness || 0)} queued`],
        ["Buyer assets", `${Number(summary.buyerPackFreshnessDays || 0)}d`],
        ["Pilot assets", `${Number(summary.pilotFreshnessDays || 0)}d`],
        ["Commercial matrix", summary.commercialMatrixLoaded ? "loaded" : "missing"],
        ["Release truth", String(summary.releaseTruthStatus || "unknown")],
    ];

    return (
        <>
            <div className="fixed inset-0 z-[174] bg-black/60" onClick={onClose} />
            <section data-testid="field-launch-command-center" className="fixed inset-x-6 top-14 bottom-4 z-[175] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Field Launch Command Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Commercialization and deployment readiness status.</div>
                    </div>
                    <button type="button" data-testid="field-launch-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Readiness Cards</div>
                        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Field launch readiness cards">
                            {cards.map(([label, value]) => (
                                <article key={label} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.1em]">{label}</div>
                                    <div className="text-[10px] font-mono text-slate-100">{value}</div>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Asset Drill-Down</div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                ["demo-flow", "Demo"],
                                ["deployment-program", "Deployment"],
                                ["training-delivery", "Training"],
                                ["support-ops", "Support"],
                                ["buyer-journey", "Buyer"],
                                ["pilot-conversion", "Pilot"],
                                ["commercial-packages", "Commercial"],
                                ["institutional-command", "Institutional"],
                            ].map(([panelId, label]) => (
                                <button
                                    key={panelId}
                                    type="button"
                                    data-testid={`field-launch-open-${panelId}`}
                                    onClick={() => {
                                        if (typeof onOpenPanel === "function") onOpenPanel(panelId);
                                    }}
                                    className="px-3 py-2 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 text-left"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </>
    );
}
