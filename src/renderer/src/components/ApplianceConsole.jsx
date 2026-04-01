import React from "react";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

function readSupportIngestCount() {
    if (typeof window === "undefined" || !window.localStorage) return 0;
    const raw = Number(window.localStorage.getItem("neuralshell_support_ingest_count_v1") || "0");
    return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
}

export default function ApplianceConsole({
    open,
    onClose,
    enabled,
    onToggleEnabled,
    runtimeState,
    fleetSummary,
}) {
    const [supportIngestCount] = React.useState(() => readSupportIngestCount());
    const state = runtimeState && typeof runtimeState === "object" ? runtimeState : {};
    const relay = state.relayState || {};
    const policy = state.policyState || {};
    const updates = state.updateLane || {};
    const summary = fleetSummary && typeof fleetSummary === "object"
        ? fleetSummary
        : { total: 0, healthy: 0, degraded: 0, critical: 0, offline: 0 };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[132] bg-black/60" onClick={onClose} />
            <section data-testid="appliance-console" className="fixed inset-x-8 top-20 bottom-8 z-[133] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Appliance Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Hardened relay/control profile for operator deployments.</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            data-testid="appliance-toggle-btn"
                            onClick={() => {
                                const next = !enabled;
                                if (typeof onToggleEnabled === "function") onToggleEnabled(next);
                                appendRuntimeEvent("appliance.mode.changed", {
                                    enabled: next,
                                }, { source: "appliance", severity: next ? "info" : "warning" });
                            }}
                            className={`px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[0.12em] ${
                                enabled
                                    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                                    : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                            }`}
                        >
                            {enabled ? "Disable Appliance" : "Enable Appliance"}
                        </button>
                        <button
                            type="button"
                            data-testid="appliance-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold mb-2">Relay / Policy / Updates</div>
                            <div className="space-y-1 text-[10px] font-mono text-slate-300">
                                <div>Relay Enabled: <span className="text-slate-100">{relay.enabled ? "yes" : "no"}</span></div>
                                <div>Relay Channel: <span className="text-slate-100">{String(relay.mappedChannel || "local-only")}</span></div>
                                <div>Policy Profile: <span className="text-slate-100">{String(policy.activePolicyProfile || "none")}</span></div>
                                <div>Offline-only: <span className="text-slate-100">{policy.offlineOnly ? "true" : "false"}</span></div>
                                <div>Update Ring: <span className="text-slate-100">{String(policy.updateRing || "stable")}</span></div>
                                <div>Signature: <span className="text-slate-100">{String(updates.signatureState || "unknown")}</span></div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold mb-2">Appliance Operations</div>
                            <div className="space-y-1 text-[10px] font-mono text-slate-300">
                                <div>Support Ingest Bundles: <span className="text-slate-100">{supportIngestCount}</span></div>
                                <div>Fleet Nodes: <span className="text-slate-100">{summary.total}</span></div>
                                <div>Healthy: <span className="text-slate-100">{summary.healthy}</span></div>
                                <div>Degraded: <span className="text-slate-100">{summary.degraded}</span></div>
                                <div>Critical: <span className="text-slate-100">{summary.critical}</span></div>
                                <div>Offline: <span className="text-slate-100">{summary.offline}</span></div>
                            </div>
                        </section>
                    </div>

                    <section className="rounded-xl border border-white/10 bg-black/25 p-3 text-[10px] font-mono text-slate-400">
                        Appliance mode narrows UX scope to operational controls. Security and proof controls remain enforced and cannot be bypassed by profile branding or appliance toggles.
                    </section>
                </div>
            </section>
        </>
    );
}