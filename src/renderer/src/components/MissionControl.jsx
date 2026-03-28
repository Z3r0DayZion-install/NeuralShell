import React from "react";
import RuntimeStatusCard from "./cards/RuntimeStatusCard";
import VaultPanelPlus from "./VaultPanelPlus.jsx";

function toneFromHealth(ok) {
    return ok ? "green" : "red";
}

function toneFromSeverity(severity) {
    const safe = String(severity || "info").toLowerCase();
    if (safe === "critical") return "red";
    if (safe === "warning" || safe === "degraded") return "amber";
    if (safe === "info") return "blue";
    return "grey";
}

function formatAt(iso) {
    const value = String(iso || "").trim();
    if (!value) return "n/a";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function MissionControl({
    open,
    onClose,
    runtimeState,
    events,
    onOpenSettings,
    onOpenFleet,
    onOpenRecovery,
    onOpenAppliance,
    onOpenAirGap,
    onOpenTrustFabric,
    onOpenHardwareAppliance,
    onOpenCourierTransfer,
    onOpenContinuityDrills,
    onOpenProcurementCommand,
    onOpenTamperSimulation,
    onOpenInstitutionalCommand,
    onOpenDemoFlow,
    onOpenDeploymentProgram,
    onOpenTrainingDelivery,
    onOpenSupportOps,
    onOpenBuyerJourney,
    onOpenPilotConversion,
    onOpenCommercialPackages,
    onOpenFieldLaunch,
    onOpenPartnerRollout,
    onOpenBuyerOps,
    onOpenDemoToPilot,
    onOpenPilotExpansion,
    onOpenRenewalRisk,
    onOpenLaunchWeek,
    onOpenFollowupGenerator,
    onOpenFieldFeedback,
    onOpenPartnerCertification,
    onOpenManagedServices,
    onOpenStrategicAccount,
    onOpenPortfolioRollout,
    onOpenRevenueOps,
    onOpenChannelExpansion,
    onOpenCrossAccountRenewal,
    onOpenExecutiveScale,
    onOpenEcosystemPortfolio,
    onOpenServiceLine,
    onOpenPartnerNetworkGovernance,
    onOpenGlobalPlanning,
    onOpenEcosystemRevenue,
    onOpenBoardOperatingPack,
    onOpenLicensedOperator,
    onOpenEcosystemCommand,
    onOpenShift,
    onOpenIncidentMode,
    onOpenPolicyRollout,
    onOpenOfflineUpdates,
    onOpenMissionScheduler,
    onOpenNodeChain,
    onOpenWatchdog,
    onOpenFirstBoot,
    onOpenSplitWorkspace,
}) {
    if (!open) return null;
    const state = runtimeState && typeof runtimeState === "object" ? runtimeState : {};
    const feed = Array.isArray(events) ? events.slice(-80).reverse() : [];

    const provider = state.providerHealth || {};
    const vault = state.vaultState || {};
    const proof = state.proofEngine || {};
    const relay = state.relayState || {};
    const collab = state.collabVoiceState || {};
    const policy = state.policyState || {};
    const update = state.updateLane || {};
    const seal = state.sealIdentity || {};
    const watchdog = state.watchdog || {};

    return (
        <>
            <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <section
                data-testid="mission-control"
                aria-label="Mission Control"
                className="fixed inset-x-4 top-16 bottom-4 z-[121] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col"
            >
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-bold">Mission Control</div>
                        <div className="text-[10px] text-slate-500 font-mono">Runtime cockpit, authority feed, and control rails.</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button
                            type="button"
                            data-testid="mission-control-open-fleet-btn"
                            onClick={onOpenFleet}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Fleet
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-recovery-btn"
                            onClick={onOpenRecovery}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Recovery
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-appliance-btn"
                            onClick={onOpenAppliance}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Appliance
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-airgap-btn"
                            onClick={onOpenAirGap}
                            className="px-2.5 py-1.5 rounded border border-slate-300/30 bg-slate-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-500/20"
                        >
                            AirGap
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-trust-fabric-btn"
                            onClick={onOpenTrustFabric}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            PKI
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-hardware-appliance-btn"
                            onClick={onOpenHardwareAppliance}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Hardware
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-courier-transfer-btn"
                            onClick={onOpenCourierTransfer}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Courier
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-continuity-drills-btn"
                            onClick={onOpenContinuityDrills}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Drills
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-procurement-command-btn"
                            onClick={onOpenProcurementCommand}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Procurement
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-tamper-simulation-btn"
                            onClick={onOpenTamperSimulation}
                            className="px-2.5 py-1.5 rounded border border-rose-300/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/20"
                        >
                            Simulate
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-institutional-command-btn"
                            onClick={onOpenInstitutionalCommand}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Institutional
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-demo-flow-btn"
                            onClick={onOpenDemoFlow}
                            className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20"
                        >
                            Demo
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-deployment-program-btn"
                            onClick={onOpenDeploymentProgram}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            Deploy
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-training-delivery-btn"
                            onClick={onOpenTrainingDelivery}
                            className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20"
                        >
                            Training
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-support-ops-btn"
                            onClick={onOpenSupportOps}
                            className="px-2.5 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20"
                        >
                            Support
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-buyer-journey-btn"
                            onClick={onOpenBuyerJourney}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Buyer
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-pilot-conversion-btn"
                            onClick={onOpenPilotConversion}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Pilot
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-commercial-packages-btn"
                            onClick={onOpenCommercialPackages}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Commercial
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-field-launch-btn"
                            onClick={onOpenFieldLaunch}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            Launch
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-partner-rollout-btn"
                            onClick={onOpenPartnerRollout}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Partner
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-buyer-ops-btn"
                            onClick={onOpenBuyerOps}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            BuyerOps
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-demo-to-pilot-btn"
                            onClick={onOpenDemoToPilot}
                            className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20"
                        >
                            D2P
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-pilot-expansion-btn"
                            onClick={onOpenPilotExpansion}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Expand
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-renewal-risk-btn"
                            onClick={onOpenRenewalRisk}
                            className="px-2.5 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20"
                        >
                            Renewal
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-launch-week-btn"
                            onClick={onOpenLaunchWeek}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            LaunchWeek
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-followup-generator-btn"
                            onClick={onOpenFollowupGenerator}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            FollowUp
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-field-feedback-btn"
                            onClick={onOpenFieldFeedback}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Feedback
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-partner-certification-btn"
                            onClick={onOpenPartnerCertification}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Certify
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-managed-services-btn"
                            onClick={onOpenManagedServices}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Managed
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-strategic-account-btn"
                            onClick={onOpenStrategicAccount}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Strategic
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-portfolio-rollout-btn"
                            onClick={onOpenPortfolioRollout}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            Portfolio
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-revenue-ops-btn"
                            onClick={onOpenRevenueOps}
                            className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20"
                        >
                            Revenue
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-channel-expansion-btn"
                            onClick={onOpenChannelExpansion}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Channel
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-cross-account-renewal-btn"
                            onClick={onOpenCrossAccountRenewal}
                            className="px-2.5 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20"
                        >
                            Renewal+
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-executive-scale-btn"
                            onClick={onOpenExecutiveScale}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            ExecScale
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-ecosystem-portfolio-btn"
                            onClick={onOpenEcosystemPortfolio}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Portfolio+
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-service-line-btn"
                            onClick={onOpenServiceLine}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Services
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-partner-network-governance-btn"
                            onClick={onOpenPartnerNetworkGovernance}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            PartnerNet
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-global-planning-btn"
                            onClick={onOpenGlobalPlanning}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            Global
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-ecosystem-revenue-btn"
                            onClick={onOpenEcosystemRevenue}
                            className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/20"
                        >
                            RevMix
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-board-operating-pack-btn"
                            onClick={onOpenBoardOperatingPack}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            BoardOps
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-licensed-operator-btn"
                            onClick={onOpenLicensedOperator}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Operator
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-ecosystem-command-btn"
                            onClick={onOpenEcosystemCommand}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            EcoCmd
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-shift-btn"
                            onClick={onOpenShift}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Shift
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-incident-btn"
                            onClick={onOpenIncidentMode}
                            className="px-2.5 py-1.5 rounded border border-rose-300/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/20"
                        >
                            Incident
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-policy-rollout-btn"
                            onClick={onOpenPolicyRollout}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Rollout
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-offline-updates-btn"
                            onClick={onOpenOfflineUpdates}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Updates
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-mission-scheduler-btn"
                            onClick={onOpenMissionScheduler}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Missions
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-nodechain-btn"
                            onClick={onOpenNodeChain}
                            className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            NodeChain
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-watchdog-btn"
                            onClick={onOpenWatchdog}
                            className="px-2.5 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20"
                        >
                            Watchdog
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-firstboot-btn"
                            onClick={onOpenFirstBoot}
                            className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10"
                        >
                            First Boot
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-open-splitworkspace-btn"
                            onClick={onOpenSplitWorkspace}
                            className="px-2.5 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/20"
                        >
                            Split Workspace
                        </button>
                        <button
                            type="button"
                            data-testid="mission-control-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <RuntimeStatusCard
                            testId="mission-card-provider-health"
                            title="Provider Health"
                            subtitle="Bridge + model posture"
                            statusLabel={provider.online ? "healthy" : "offline"}
                            tone={toneFromHealth(Boolean(provider.online))}
                            rows={[
                                { id: "provider", label: "Provider", value: String(provider.activeProvider || "ollama") },
                                { id: "model", label: "Model", value: String(provider.model || "llama3") },
                                { id: "latency", label: "Latency", value: provider.latencyMs == null ? "n/a" : `${provider.latencyMs}ms` },
                                { id: "sweep", label: "Last Sweep", value: String(provider.lastSweepResult || "unknown") },
                            ]}
                        />

                        <VaultPanelPlus
                            vaultState={vault}
                            onPromptSave={() => {
                                window.dispatchEvent(new window.CustomEvent("neuralshell:prompt-vault-save"));
                            }}
                            onOpenSettings={onOpenSettings}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-proof-engine"
                            title="Proof Engine"
                            subtitle="Proof run state and bundle parity"
                            statusLabel={String(proof.lastProofStatus || "idle")}
                            tone={String(proof.lastProofStatus || "").toLowerCase().includes("fail") ? "red" : "blue"}
                            rows={[
                                { id: "proof-status", label: "Last Status", value: String(proof.lastProofStatus || "idle") },
                                { id: "proof-stage", label: "Stage", value: String(proof.currentStage || "idle") },
                                { id: "proof-hash", label: "Bundle Hash", value: String(proof.lastBundleHash || "n/a") },
                                { id: "proof-parity", label: "Parity", value: String(proof.parityState || "unknown") },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-relay-state"
                            title="Relay State"
                            subtitle="Proof relay + channel mapping"
                            statusLabel={relay.enabled ? "enabled" : "disabled"}
                            tone={relay.relayError ? "red" : relay.enabled ? "blue" : "grey"}
                            rows={[
                                { id: "relay-enabled", label: "Enabled", value: relay.enabled ? "yes" : "no" },
                                { id: "relay-channel", label: "Channel", value: String(relay.mappedChannel || "local-only") },
                                { id: "relay-last", label: "Last Send", value: String(relay.lastRelaySend || "n/a") },
                                { id: "relay-error", label: "Error", value: String(relay.relayError || "none") },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-collab-state"
                            title="Collab / Voice State"
                            subtitle="Peers, room, RTT, session health"
                            statusLabel={String(collab.sessionHealth || "unknown")}
                            tone={String(collab.sessionHealth || "") === "healthy" ? "green" : "amber"}
                            rows={[
                                { id: "collab-peers", label: "Peers", value: String(collab.peersActive ?? 0) },
                                { id: "collab-room", label: "Room", value: String(collab.currentRoom || "default") },
                                { id: "collab-rtt", label: "Voice RTT", value: collab.voiceRttMs == null ? "n/a" : `${collab.voiceRttMs}ms` },
                                { id: "collab-health", label: "Session", value: String(collab.sessionHealth || "unknown") },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-policy-state"
                            title="Policy / Enforcement"
                            subtitle="Enterprise policy + provider boundaries"
                            statusLabel={String(policy.activePolicyProfile || "none")}
                            tone={policy.offlineOnly ? "green" : "amber"}
                            rows={[
                                { id: "policy-active", label: "Profile", value: String(policy.activePolicyProfile || "none") },
                                { id: "policy-ring", label: "Update Ring", value: String(policy.updateRing || "stable") },
                                { id: "policy-offline", label: "Offline Only", value: policy.offlineOnly ? "true" : "false" },
                                { id: "policy-approved", label: "Providers", value: (policy.approvedProviders || []).join(", ") || "n/a" },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-update-lane"
                            title="Update Lane"
                            subtitle="Signature verification + staged updates"
                            statusLabel={String(update.signatureState || "unknown")}
                            tone={String(update.signatureState || "") === "verified" ? "green" : "amber"}
                            rows={[
                                { id: "update-version", label: "Version", value: String(update.currentVersion || "unknown") },
                                { id: "update-check", label: "Last Check", value: String(update.lastUpdateCheck || "n/a") },
                                { id: "update-signature", label: "Signature", value: String(update.signatureState || "unknown") },
                                { id: "update-staged", label: "Staged", value: update.stagedUpdateAvailable ? "available" : "none" },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-seal-identity"
                            title="SEAL / Identity"
                            subtitle="Machine trust + branding profile"
                            statusLabel={String(seal.machineTrust || "unknown")}
                            tone={String(seal.machineTrust || "") === "auditor" ? "amber" : "green"}
                            rows={[
                                { id: "seal-id", label: "Seal", value: String(seal.sealIdentity || "unknown") },
                                { id: "seal-trust", label: "Trust", value: String(seal.machineTrust || "unknown") },
                                { id: "seal-branding", label: "White-Label", value: String(seal.whiteLabelProfile || "default") },
                            ]}
                        />

                        <RuntimeStatusCard
                            testId="mission-card-watchdog"
                            title="Runtime Watchdog"
                            subtitle="Supervisor liveness and bridge process"
                            statusLabel={String(watchdog.status || "unknown")}
                            tone={String(watchdog.status || "") === "running" ? "green" : "amber"}
                            rows={[
                                { id: "watchdog-status", label: "Status", value: String(watchdog.status || "unknown") },
                                { id: "watchdog-pid", label: "PID", value: watchdog.pid == null ? "n/a" : String(watchdog.pid) },
                                { id: "watchdog-ws", label: "WS Bridge", value: watchdog.wsRunning ? "running" : "stopped" },
                                { id: "watchdog-refreshed", label: "Refreshed", value: formatAt(state.refreshedAt || "") },
                            ]}
                        />
                    </div>

                    <section
                        data-testid="mission-control-event-feed"
                        aria-label="Runtime Event Feed"
                        className="rounded-2xl border border-white/10 bg-black/30 p-3"
                    >
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Runtime Event Feed</div>
                                <div className="text-[10px] text-slate-500 font-mono">Chronological stream of proofs, policy changes, relay/runtime alerts, and watchdog events.</div>
                            </div>
                            <div className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                                toneFromSeverity(String(feed[0] && feed[0].severity ? feed[0].severity : "info")) === "red"
                                    ? "border-rose-300/40 bg-rose-500/10 text-rose-100"
                                    : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                            }`}>
                                {feed.length} events
                            </div>
                        </div>
                        <div className="max-h-[260px] overflow-auto space-y-1.5 pr-1">
                            {feed.map((event) => (
                                <article
                                    key={event.id}
                                    className={`rounded-lg border px-2 py-1.5 ${
                                        toneFromSeverity(String(event.severity || "info")) === "red"
                                            ? "border-rose-300/40 bg-rose-500/10"
                                            : toneFromSeverity(String(event.severity || "info")) === "amber"
                                                ? "border-amber-300/40 bg-amber-500/10"
                                                : "border-white/10 bg-black/30"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[10px] font-mono text-slate-200">{String(event.type || "runtime.event")}</div>
                                        <div className="text-[9px] font-mono text-slate-500">{formatAt(String(event.at || ""))}</div>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-400">
                                        {String(event.source || "runtime")} · {String(event.severity || "info")}
                                    </div>
                                </article>
                            ))}
                            {feed.length === 0 && (
                                <div className="text-[10px] font-mono text-slate-500">No runtime events captured yet.</div>
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </>
    );
}
