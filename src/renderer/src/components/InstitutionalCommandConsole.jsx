import React from "react";
import InstitutionalStatusSummary from "./InstitutionalStatusSummary.jsx";

function readJson(key, fallback) {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
        return parsed == null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

function computeContinuityScore(runs) {
    const safe = Array.isArray(runs) ? runs : [];
    if (!safe.length) return 0;
    const passed = safe.filter((entry) => entry && entry.passed).length;
    return Math.round((passed / safe.length) * 100);
}

function daysSince(iso) {
    const ts = new Date(String(iso || "")).getTime();
    if (!Number.isFinite(ts)) return 999;
    return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

export default function InstitutionalCommandConsole({
    open,
    onClose,
    onOpenPanel,
}) {
    const [summary, setSummary] = React.useState({});

    const refreshSummary = React.useCallback(() => {
        const certificates = readJson("neuralshell_pki_certificates_v1", []);
        const revocations = readJson("neuralshell_pki_revocations_v1", []);
        const hardwareProvision = readJson("neuralshell_hardware_appliance_provision_v1", {});
        const courierLedger = readJson("neuralshell_courier_transfer_ledger_v1", []);
        const continuityRuns = readJson("neuralshell_continuity_runs_v1", []);
        const procurementHistory = readJson("neuralshell_procurement_pack_history_v1", []);
        const tamperReports = readJson("neuralshell_tamper_simulation_reports_v1", []);
        const incidents = readJson("neuralshell_incidents_v1", []);
        const releaseTruth = readJson("neuralshell_release_truth_cache_v1", {});
        const latestProcurement = Array.isArray(procurementHistory) && procurementHistory.length ? procurementHistory[0] : null;

        const courierQuarantined = (Array.isArray(courierLedger) ? courierLedger : []).filter((entry) => String(entry.status || "") === "quarantined").length;
        const courierReleased = (Array.isArray(courierLedger) ? courierLedger : []).filter((entry) => String(entry.status || "") === "released").length;
        const criticalIncidents = (Array.isArray(incidents) ? incidents : []).filter((entry) => (
            String(entry && entry.status ? entry.status : "") === "open"
            && String(entry && entry.severity ? entry.severity : "") === "critical"
        )).length;

        setSummary({
            airGapPosture: window.localStorage.getItem("neuralshell_airgap_mode_v1") === "1" ? "locked" : "unlocked",
            trustHealth: {
                certificates: Array.isArray(certificates) ? certificates.length : 0,
                revoked: Array.isArray(revocations) ? revocations.length : 0,
            },
            applianceFleet: {
                profiles: hardwareProvision && typeof hardwareProvision === "object" ? Object.keys(hardwareProvision).length : 0,
            },
            courierChain: {
                quarantined: courierQuarantined,
                released: courierReleased,
            },
            continuityReadiness: computeContinuityScore(continuityRuns),
            procurementFreshnessDays: latestProcurement ? daysSince(latestProcurement.generatedAt) : 999,
            tamperTrainingRuns: Array.isArray(tamperReports) ? tamperReports.length : 0,
            criticalIncidents,
            releaseTruthStatus: String(releaseTruth && releaseTruth.status ? releaseTruth.status : "unknown"),
        });
    }, []);

    React.useEffect(() => {
        if (!open) return;
        refreshSummary();
        const timer = window.setInterval(refreshSummary, 5000);
        return () => window.clearInterval(timer);
    }, [open, refreshSummary]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[158] bg-black/60" onClick={onClose} />
            <section data-testid="institutional-command-console" className="fixed inset-x-6 top-14 bottom-4 z-[159] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Institutional Command Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Unified institutional readiness view across trust, transfer, continuity, and procurement posture.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="institutional-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 overflow-auto">
                    <div className="space-y-3">
                        <InstitutionalStatusSummary summary={summary} />
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Critical Signals</div>
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-rose-100">
                                    critical incidents {Number(summary.criticalIncidents || 0)}
                                </div>
                                <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                                    tamper drills {Number(summary.tamperTrainingRuns || 0)}
                                </div>
                                <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                                    appliance profiles {summary.applianceFleet ? Number(summary.applianceFleet.profiles || 0) : 0}
                                </div>
                                <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                                    procurement freshness {Number(summary.procurementFreshnessDays || 0)}d
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Operational Drill-Down</div>
                            <div className="text-[10px] text-slate-500 font-mono">Direct navigation to all institutional modules.</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                ["airgap", "AirGap"],
                                ["trust-fabric", "PKI Trust"],
                                ["hardware-appliance", "Hardware"],
                                ["courier-transfer", "Courier"],
                                ["continuity-drills", "Continuity"],
                                ["procurement-command", "Procurement"],
                                ["tamper-simulation", "Simulation"],
                                ["mission-control", "Mission"],
                            ].map(([panelId, label]) => (
                                <button
                                    key={panelId}
                                    type="button"
                                    data-testid={`institutional-open-${panelId}`}
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
