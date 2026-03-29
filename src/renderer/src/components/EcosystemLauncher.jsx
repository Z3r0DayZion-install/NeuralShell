import React from 'react';
import SalesConsole from './SalesConsole';
import PilotKitConsole from './PilotKitConsole';
import BrandingOverrides from './BrandingOverrides';
import PartnerConsole from './PartnerConsole';
import CertificationCenter from './CertificationCenter';
import BoardConsole from './BoardConsole';
import EnterprisePolicySuite from './EnterprisePolicySuite';
import CustomerSuccessConsole from './CustomerSuccessConsole';
import ExpansionPlanner from './ExpansionPlanner';
import {
    ECOSYSTEM_MODULES,
    canAccessEcosystemModule,
    getAccessibleEcosystemModules,
} from '../routes/ecosystem.ts';

const ROLE_STORAGE_KEY = 'neuralshell_ecosystem_role_v1';

const ROLE_OPTIONS = [
    { id: 'founder', label: 'Founder' },
    { id: 'sales', label: 'Sales' },
    { id: 'support', label: 'Support' },
    { id: 'operator', label: 'Operator' },
];
const APPLIANCE_ALLOWED_MODULES = new Set([
    'mission_control',
    'fleet_control',
    'recovery_center',
    'appliance_console',
    'airgap_operations',
    'trust_fabric',
    'hardware_appliance',
    'courier_transfer',
    'continuity_drills',
    'procurement_command',
    'tamper_simulation',
    'institutional_command',
    'demo_flow',
    'deployment_program',
    'training_delivery',
    'support_ops',
    'buyer_journey',
    'pilot_conversion',
    'commercial_packages',
    'field_launch',
    'partner_rollout',
    'buyer_ops',
    'demo_to_pilot',
    'pilot_expansion',
    'renewal_risk',
    'launch_week',
    'followup_generator',
    'field_feedback',
    'partner_certification',
    'managed_services',
    'strategic_account',
    'portfolio_rollout',
    'revenue_ops',
    'channel_expansion',
    'cross_account_renewal',
    'executive_scale',
    'ecosystem_portfolio',
    'service_line',
    'partner_network_governance',
    'global_planning',
    'ecosystem_revenue',
    'board_operating_pack',
    'licensed_operator',
    'ecosystem_command',
    'shift_console',
    'incident_mode',
    'policy_rollout',
    'offline_update_packs',
    'mission_scheduler',
    'enterprise_policy',
]);

function loadRole() {
    if (typeof window === 'undefined' || !window.localStorage) return 'founder';
    const stored = String(window.localStorage.getItem(ROLE_STORAGE_KEY) || '').trim().toLowerCase();
    return ROLE_OPTIONS.some((role) => role.id === stored) ? stored : 'founder';
}

function EcosystemHome({ role, tierId, moduleCount }) {
    return (
        <section data-testid="ecosystem-home" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Command Center</div>
            <div className="text-[11px] text-slate-300">
                NeuralShell ecosystem mode links enterprise sales, partner ops, certification workflows, policy enforcement, and board reporting into one local-first surface.
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Role</div>
                    <div className="text-[13px] text-slate-100 font-bold">{role}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Tier</div>
                    <div className="text-[13px] text-slate-100 font-bold">{tierId || 'free'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Modules</div>
                    <div className="text-[13px] text-slate-100 font-bold">{moduleCount}</div>
                </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-[10px] font-mono text-slate-400">
                Use role + tier controls to validate access boundaries for Sales, Support, Founder, and Operator views.
            </div>
        </section>
    );
}

export default function EcosystemLauncher({
    open,
    onClose,
    capabilities = [],
    tierId = 'free',
    onOpenMissionControl,
    onOpenFleetControl,
    onOpenRecoveryCenter,
    onOpenApplianceConsole,
    onOpenAirGapOperations,
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
    onOpenShiftConsole,
    onOpenIncidentMode,
    onOpenPolicyRollout,
    onOpenOfflineUpdates,
    onOpenMissionScheduler,
    applianceModeEnabled = false,
}) {
    const [role, setRole] = React.useState(() => loadRole());
    const [activeModuleId, setActiveModuleId] = React.useState('ecosystem_launcher');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    }, [role]);

    const accessibleModules = React.useMemo(
        () => {
            const base = getAccessibleEcosystemModules(role, tierId, capabilities);
            if (!applianceModeEnabled) return base;
            return base.filter((item) => APPLIANCE_ALLOWED_MODULES.has(item.id));
        },
        [applianceModeEnabled, capabilities, role, tierId],
    );

    React.useEffect(() => {
        if (!accessibleModules.some((item) => item.id === activeModuleId)) {
            setActiveModuleId(accessibleModules[0] ? accessibleModules[0].id : 'ecosystem_launcher');
        }
    }, [accessibleModules, activeModuleId]);

    const activeModule = accessibleModules.find((item) => item.id === activeModuleId) || null;

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm" onClick={onClose} />
            <aside data-testid="ecosystem-launcher" className="fixed inset-x-4 top-16 bottom-4 z-[96] rounded-2xl border border-cyan-400/30 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.65)] overflow-hidden flex min-h-0">
                <div className="w-72 border-r border-white/10 bg-black/35 p-3 flex flex-col gap-3 overflow-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Launcher</div>
                            <div className="text-[9px] text-slate-500 font-mono">Role-aware navigation</div>
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                        <label className="text-[9px] uppercase tracking-[0.12em] text-slate-500 font-mono">Role</label>
                        <select
                            data-testid="ecosystem-role-select"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-slate-200"
                        >
                            {ROLE_OPTIONS.map((entry) => (
                                <option key={entry.id} value={entry.id}>{entry.label}</option>
                            ))}
                        </select>
                        <div className="mt-1 text-[9px] text-slate-500 font-mono">Tier {String(tierId || 'free')}</div>
                    </div>

                    <div className="space-y-1">
                        {accessibleModules.map((moduleDef) => (
                            <button
                                key={moduleDef.id}
                                type="button"
                                data-testid={`ecosystem-module-${moduleDef.id}`}
                                onClick={() => setActiveModuleId(moduleDef.id)}
                                className={`w-full text-left px-2.5 py-2 rounded-lg border text-[10px] font-mono ${
                                    activeModuleId === moduleDef.id
                                        ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="font-bold uppercase tracking-[0.1em]">{moduleDef.title}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">{moduleDef.description}</div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-1">
                        {ECOSYSTEM_MODULES.filter((moduleDef) => (
                            !canAccessEcosystemModule(moduleDef, role, tierId, capabilities)
                        )).map((moduleDef) => (
                            <div
                                key={`locked-${moduleDef.id}`}
                                data-testid={`ecosystem-module-locked-${moduleDef.id}`}
                                className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-[9px] font-mono text-slate-500"
                            >
                                {moduleDef.title} · locked ({moduleDef.minTier})
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-4">
                    {!activeModule && (
                        <div className="text-[11px] font-mono text-slate-500">No module available for this role/tier.</div>
                    )}
                    {activeModule && activeModule.id === 'ecosystem_launcher' && (
                        <EcosystemHome role={role} tierId={String(tierId || 'free')} moduleCount={accessibleModules.length} />
                    )}
                    {activeModule && activeModule.id === 'mission_control' && (
                        <section data-testid="ecosystem-mission-control-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-200 font-bold">Mission Control Runtime Cockpit</div>
                            <div className="text-[11px] text-slate-200">
                                Launch the live runtime command center with provider, vault, proof, policy, update, and watchdog state in one view.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-mission-control-btn"
                                onClick={() => {
                                    if (typeof onOpenMissionControl === 'function') onOpenMissionControl();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Mission Control
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'fleet_control' && (
                        <section data-testid="ecosystem-fleet-control-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Fleet Control</div>
                            <div className="text-[11px] text-slate-200">
                                Open the multi-node fleet panel to import offline bundles, compare node posture, and drill into node-level event feeds.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-fleet-control-btn"
                                onClick={() => {
                                    if (typeof onOpenFleetControl === 'function') onOpenFleetControl();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Fleet Control
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'recovery_center' && (
                        <section data-testid="ecosystem-recovery-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Recovery Center</div>
                            <div className="text-[11px] text-slate-200">
                                Generate signed backup bundles, verify restore artifacts, and apply staged or safe-mode recovery.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-recovery-btn"
                                onClick={() => {
                                    if (typeof onOpenRecoveryCenter === 'function') onOpenRecoveryCenter();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Recovery Center
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'appliance_console' && (
                        <section data-testid="ecosystem-appliance-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Appliance Console</div>
                            <div className="text-[11px] text-slate-200">
                                Open hardened appliance controls for relay, policy distribution, update gating, and support ingest posture.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-appliance-btn"
                                onClick={() => {
                                    if (typeof onOpenApplianceConsole === 'function') onOpenApplianceConsole();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Appliance Console
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'airgap_operations' && (
                        <section data-testid="ecosystem-airgap-entry" className="rounded-2xl border border-slate-300/30 bg-slate-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-100 font-bold">Air-Gapped Operations</div>
                            <div className="text-[11px] text-slate-200">
                                Open controlled transfer-station workflows for offline artifacts with verification gates and air-gap lock controls.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-airgap-btn"
                                onClick={() => {
                                    if (typeof onOpenAirGapOperations === 'function') onOpenAirGapOperations();
                                }}
                                className="px-3 py-2 rounded-lg border border-slate-300/35 bg-slate-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-100 hover:bg-slate-500/30"
                            >
                                Open Air-Gapped Operations
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'trust_fabric' && typeof onOpenTrustFabric === 'function' && (
                        <section data-testid="ecosystem-trust-fabric-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">PKI Trust Fabric</div>
                            <div className="text-[11px] text-slate-200">
                                Open local certificate authority controls, lifecycle operations, and trust-chain export view.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-trust-fabric-btn"
                                onClick={() => {
                                    if (typeof onOpenTrustFabric === 'function') onOpenTrustFabric();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Trust Fabric
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'hardware_appliance' && typeof onOpenHardwareAppliance === 'function' && (
                        <section data-testid="ecosystem-hardware-appliance-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Hardware Appliance Program</div>
                            <div className="text-[11px] text-slate-200">
                                Open profile manager for provisioning, appliance health simulation, and decommission exports.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-hardware-appliance-btn"
                                onClick={() => {
                                    if (typeof onOpenHardwareAppliance === 'function') onOpenHardwareAppliance();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Hardware Appliance
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'courier_transfer' && (
                        <section data-testid="ecosystem-courier-transfer-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Offline Evidence Courier</div>
                            <div className="text-[11px] text-slate-200">
                                Open transfer chain controls for package quarantine, receipt verification, and release gates.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-courier-transfer-btn"
                                onClick={() => {
                                    if (typeof onOpenCourierTransfer === 'function') onOpenCourierTransfer();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Courier Transfer
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'continuity_drills' && typeof onOpenContinuityDrills === 'function' && (
                        <section data-testid="ecosystem-continuity-drills-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Continuity Drills</div>
                            <div className="text-[11px] text-slate-200">
                                Open drill scheduling, readiness scorecard, and continuity evidence export workflows.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-continuity-drills-btn"
                                onClick={() => {
                                    if (typeof onOpenContinuityDrills === 'function') onOpenContinuityDrills();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-100/30"
                            >
                                Open Continuity Drills
                            </button>
        </section>
                    )}
                    {activeModule && activeModule.id === 'procurement_command' && (
                        <section data-testid="ecosystem-procurement-command-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Procurement Command Center</div>
                            <div className="text-[11px] text-slate-200">
                                Open buyer/security review pack controls with version delta generation.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-procurement-command-btn"
                                onClick={() => {
                                    if (typeof onOpenProcurementCommand === 'function') onOpenProcurementCommand();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Procurement Center
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'tamper_simulation' && (
                        <section data-testid="ecosystem-tamper-simulation-entry" className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-rose-100 font-bold">Tamper Simulation Mode</div>
                            <div className="text-[11px] text-slate-200">
                                Open sandboxed simulation workflows for detection and response drills.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-tamper-simulation-btn"
                                onClick={() => {
                                    if (typeof onOpenTamperSimulation === 'function') onOpenTamperSimulation();
                                }}
                                className="px-3 py-2 rounded-lg border border-rose-200/35 bg-rose-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/30"
                            >
                                Open Tamper Simulation
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'institutional_command' && (
                        <section data-testid="ecosystem-institutional-command-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Institutional Command Console</div>
                            <div className="text-[11px] text-slate-200">
                                Open one-screen institutional posture summary with direct drill-down controls.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-institutional-command-btn"
                                onClick={() => {
                                    if (typeof onOpenInstitutionalCommand === 'function') onOpenInstitutionalCommand();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Institutional Command
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'demo_flow' && typeof onOpenDemoFlow === 'function' && (
                        <section data-testid="ecosystem-demo-flow-entry" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100 font-bold">Institutional Demo Flow</div>
                            <div className="text-[11px] text-slate-200">
                                Launch deterministic demo mode with seeded state and guided presenter flow.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-demo-flow-btn"
                                onClick={() => {
                                    if (typeof onOpenDemoFlow === 'function') onOpenDemoFlow();
                                }}
                                className="px-3 py-2 rounded-lg border border-emerald-200/35 bg-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30"
                            >
                                Open Demo Flow
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'deployment_program' && (
                        <section data-testid="ecosystem-deployment-program-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-100 font-bold">Deployment Program Pack</div>
                            <div className="text-[11px] text-slate-200">
                                Open deployment runbooks and preflight/post-install validation controls.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-deployment-program-btn"
                                onClick={() => {
                                    if (typeof onOpenDeploymentProgram === 'function') onOpenDeploymentProgram();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Deployment Program
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'training_delivery' && (
                        <section data-testid="ecosystem-training-delivery-entry" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100 font-bold">Training Delivery Pack</div>
                            <div className="text-[11px] text-slate-200">
                                Open role-based offline training bundle generation and lab history.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-training-delivery-btn"
                                onClick={() => {
                                    if (typeof onOpenTrainingDelivery === 'function') onOpenTrainingDelivery();
                                }}
                                className="px-3 py-2 rounded-lg border border-emerald-200/35 bg-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30"
                            >
                                Open Training Delivery
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'support_ops' && (
                        <section data-testid="ecosystem-support-ops-entry" className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100 font-bold">Support Operations Pack</div>
                            <div className="text-[11px] text-slate-200">
                                Open support intake, severity matrix, and triage queue controls.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-support-ops-btn"
                                onClick={() => {
                                    if (typeof onOpenSupportOps === 'function') onOpenSupportOps();
                                }}
                                className="px-3 py-2 rounded-lg border border-amber-200/35 bg-amber-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/30"
                            >
                                Open Support Ops
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'buyer_journey' && (
                        <section data-testid="ecosystem-buyer-journey-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Buyer Evaluation Journey</div>
                            <div className="text-[11px] text-slate-200">
                                Open evaluator quickstart and defensible buyer path summary.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-buyer-journey-btn"
                                onClick={() => {
                                    if (typeof onOpenBuyerJourney === 'function') onOpenBuyerJourney();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Buyer Journey
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'pilot_conversion' && typeof onOpenPilotConversion === 'function' && (
                        <section data-testid="ecosystem-pilot-conversion-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Pilot Conversion Kit</div>
                            <div className="text-[11px] text-slate-200">
                                Open proof-of-value and expansion planning workflows for pilot conversion.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-pilot-conversion-btn"
                                onClick={() => {
                                    if (typeof onOpenPilotConversion === 'function') onOpenPilotConversion();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Pilot Conversion
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'commercial_packages' && (
                        <section data-testid="ecosystem-commercial-packages-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Commercial Package Matrix</div>
                            <div className="text-[11px] text-slate-200">
                                Open SKU, deployment, and support entitlement alignment surface.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-commercial-packages-btn"
                                onClick={() => {
                                    if (typeof onOpenCommercialPackages === 'function') onOpenCommercialPackages();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Commercial Packages
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'field_launch' && typeof onOpenFieldLaunch === 'function' && (
                        <section data-testid="ecosystem-field-launch-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-100 font-bold">Field Launch Command Center</div>
                            <div className="text-[11px] text-slate-200">
                                Open launch-day commercialization and deployment readiness dashboard.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-field-launch-btn"
                                onClick={() => {
                                    if (typeof onOpenFieldLaunch === 'function') onOpenFieldLaunch();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Field Launch
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'partner_rollout' && (
                        <section data-testid="ecosystem-partner-rollout-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Partner Rollout Console</div>
                            <div className="text-[11px] text-slate-200">
                                Track partner activation, readiness scoring, blocker queue, and handoff exports.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-partner-rollout-btn"
                                onClick={() => {
                                    if (typeof onOpenPartnerRollout === 'function') onOpenPartnerRollout();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Partner Rollout
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'buyer_ops' && (
                        <section data-testid="ecosystem-buyer-ops-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Buyer Ops Automation</div>
                            <div className="text-[11px] text-slate-200">
                                Generate stage-aware follow-up packs and maintain buyer timeline discipline.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-buyer-ops-btn"
                                onClick={() => {
                                    if (typeof onOpenBuyerOps === 'function') onOpenBuyerOps();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Buyer Ops
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'demo_to_pilot' && (
                        <section data-testid="ecosystem-demo-to-pilot-entry" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100 font-bold">Demo-to-Pilot Engine</div>
                            <div className="text-[11px] text-slate-200">
                                Capture demo outcomes, score pilot fit, and trigger pilot launch packs.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-demo-to-pilot-btn"
                                onClick={() => {
                                    if (typeof onOpenDemoToPilot === 'function') onOpenDemoToPilot();
                                }}
                                className="px-3 py-2 rounded-lg border border-emerald-200/35 bg-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30"
                            >
                                Open Demo-to-Pilot
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'pilot_expansion' && (
                        <section data-testid="ecosystem-pilot-expansion-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Pilot Expansion Command</div>
                            <div className="text-[11px] text-slate-200">
                                Convert pilot outcomes into expansion proposals with deployment phase mapping.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-pilot-expansion-btn"
                                onClick={() => {
                                    if (typeof onOpenPilotExpansion === 'function') onOpenPilotExpansion();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Pilot Expansion
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'renewal_risk' && (
                        <section data-testid="ecosystem-renewal-risk-entry" className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100 font-bold">Renewal Risk Console</div>
                            <div className="text-[11px] text-slate-200">
                                Monitor renewal timelines, explain risk scoring, and export intervention plans.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-renewal-risk-btn"
                                onClick={() => {
                                    if (typeof onOpenRenewalRisk === 'function') onOpenRenewalRisk();
                                }}
                                className="px-3 py-2 rounded-lg border border-amber-200/35 bg-amber-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/30"
                            >
                                Open Renewal Risk
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'launch_week' && typeof onOpenLaunchWeek === 'function' && (
                        <section data-testid="ecosystem-launch-week-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-100 font-bold">Launch Week Command Discipline</div>
                            <div className="text-[11px] text-slate-200">
                                Run launch-day checklist, escalations, priorities, and end-of-day command exports.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-launch-week-btn"
                                onClick={() => {
                                    if (typeof onOpenLaunchWeek === 'function') onOpenLaunchWeek();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Launch Week
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'followup_generator' && (
                        <section data-testid="ecosystem-followup-generator-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Proof-Backed Follow-Up</div>
                            <div className="text-[11px] text-slate-200">
                                Create stage-aware follow-up drafts with explicit evidence references and deltas.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-followup-generator-btn"
                                onClick={() => {
                                    if (typeof onOpenFollowupGenerator === 'function') onOpenFollowupGenerator();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Follow-Up Generator
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'field_feedback' && (
                        <section data-testid="ecosystem-field-feedback-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Field Feedback Routing</div>
                            <div className="text-[11px] text-slate-200">
                                Capture structured field notes and route them into product/support/docs/training queues.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-field-feedback-btn"
                                onClick={() => {
                                    if (typeof onOpenFieldFeedback === 'function') onOpenFieldFeedback();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Field Feedback
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'partner_certification' && (
                        <section data-testid="ecosystem-partner-certification-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Partner Certification Hub</div>
                            <div className="text-[11px] text-slate-200">
                                Manage partner certification tracks, recertification warnings, and co-sell readiness exports.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-partner-certification-btn"
                                onClick={() => {
                                    if (typeof onOpenPartnerCertification === 'function') onOpenPartnerCertification();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Partner Certification
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'managed_services' && typeof onOpenManagedServices === 'function' && (
                        <section data-testid="ecosystem-managed-services-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Managed Services Console</div>
                            <div className="text-[11px] text-slate-200">
                                Run operator-network account health, escalation, and drift management across managed accounts.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-managed-services-btn"
                                onClick={() => {
                                    if (typeof onOpenManagedServices === 'function') onOpenManagedServices();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Managed Services
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'strategic_account' && typeof onOpenStrategicAccount === 'function' && (
                        <section data-testid="ecosystem-strategic-account-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Strategic Account Orchestration</div>
                            <div className="text-[11px] text-slate-200">
                                Orchestrate stakeholder maps, blockers, and evidence-linked expansion hypotheses for key accounts.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-strategic-account-btn"
                                onClick={() => {
                                    if (typeof onOpenStrategicAccount === 'function') onOpenStrategicAccount();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Strategic Account
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'portfolio_rollout' && typeof onOpenPortfolioRollout === 'function' && (
                        <section data-testid="ecosystem-portfolio-rollout-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-100 font-bold">Portfolio Rollout Planner</div>
                            <div className="text-[11px] text-slate-200">
                                Coordinate rollout stages, dependency hotspots, and resource strain across accounts and sites.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-portfolio-rollout-btn"
                                onClick={() => {
                                    if (typeof onOpenPortfolioRollout === 'function') onOpenPortfolioRollout();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Portfolio Rollout
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'revenue_ops' && typeof onOpenRevenueOps === 'function' && (
                        <section data-testid="ecosystem-revenue-ops-entry" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100 font-bold">Revenue Operations Console</div>
                            <div className="text-[11px] text-slate-200">
                                Review pipeline-to-revenue conversion, SKU mix, and expansion-vs-renewal posture from local data.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-revenue-ops-btn"
                                onClick={() => {
                                    if (typeof onOpenRevenueOps === 'function') onOpenRevenueOps();
                                }}
                                className="px-3 py-2 rounded-lg border border-emerald-200/35 bg-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30"
                            >
                                Open Revenue Ops
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'channel_expansion' && typeof onOpenChannelExpansion === 'function' && (
                        <section data-testid="ecosystem-channel-expansion-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Channel Expansion Planner</div>
                            <div className="text-[11px] text-slate-200">
                                Plan channel models, readiness gaps, and enablement priorities for controlled growth.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-channel-expansion-btn"
                                onClick={() => {
                                    if (typeof onOpenChannelExpansion === 'function') onOpenChannelExpansion();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Channel Expansion
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'cross_account_renewal' && typeof onOpenCrossAccountRenewal === 'function' && (
                        <section data-testid="ecosystem-cross-account-renewal-entry" className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100 font-bold">Cross-Account Renewal Matrix</div>
                            <div className="text-[11px] text-slate-200">
                                Visualize renewal urgency and intervention planning across multiple accounts in one matrix.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-cross-account-renewal-btn"
                                onClick={() => {
                                    if (typeof onOpenCrossAccountRenewal === 'function') onOpenCrossAccountRenewal();
                                }}
                                className="px-3 py-2 rounded-lg border border-amber-200/35 bg-amber-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/30"
                            >
                                Open Cross-Account Renewal
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'executive_scale' && typeof onOpenExecutiveScale === 'function' && (
                        <section data-testid="ecosystem-executive-scale-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Executive Scale Dashboard</div>
                            <div className="text-[11px] text-slate-200">
                                Open one-screen executive scale operations view with partner, account, rollout, and revenue signals.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-executive-scale-btn"
                                onClick={() => {
                                    if (typeof onOpenExecutiveScale === 'function') onOpenExecutiveScale();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Executive Scale
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'ecosystem_portfolio' && typeof onOpenEcosystemPortfolio === 'function' && (
                        <section data-testid="ecosystem-portfolio-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Ecosystem Portfolio Console</div>
                            <div className="text-[11px] text-slate-200">
                                Operate portfolio lines and attachment paths across product, services, support, and channels.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-ecosystem-portfolio-btn"
                                onClick={() => {
                                    if (typeof onOpenEcosystemPortfolio === 'function') onOpenEcosystemPortfolio();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Ecosystem Portfolio
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'service_line' && typeof onOpenServiceLine === 'function' && (
                        <section data-testid="ecosystem-service-line-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Service Line Operating Layer</div>
                            <div className="text-[11px] text-slate-200">
                                Manage service-line capacity, utilization, and operating health for delivery discipline.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-service-line-btn"
                                onClick={() => {
                                    if (typeof onOpenServiceLine === 'function') onOpenServiceLine();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Service Line Console
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'partner_network_governance' && typeof onOpenPartnerNetworkGovernance === 'function' && (
                        <section data-testid="ecosystem-partner-network-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Partner Network Governance</div>
                            <div className="text-[11px] text-slate-200">
                                Track tier governance, compliance posture, and escalation/reactivation flows across the partner network.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-partner-network-governance-btn"
                                onClick={() => {
                                    if (typeof onOpenPartnerNetworkGovernance === 'function') onOpenPartnerNetworkGovernance();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Partner Network Governance
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'global_planning' && typeof onOpenGlobalPlanning === 'function' && (
                        <section data-testid="ecosystem-global-planning-entry" className="rounded-2xl border border-blue-300/30 bg-blue-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-blue-100 font-bold">Global Account & Region Planning</div>
                            <div className="text-[11px] text-slate-200">
                                Plan global account and region expansion using deployment, compliance, and channel-fit overlays.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-global-planning-btn"
                                onClick={() => {
                                    if (typeof onOpenGlobalPlanning === 'function') onOpenGlobalPlanning();
                                }}
                                className="px-3 py-2 rounded-lg border border-blue-200/35 bg-blue-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-blue-100 hover:bg-blue-500/30"
                            >
                                Open Global Planning
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'ecosystem_revenue' && (
                        <section data-testid="ecosystem-ecosystem-revenue-entry" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-100 font-bold">Ecosystem Revenue Mix Planner</div>
                            <div className="text-[11px] text-slate-200">
                                Optimize ecosystem revenue mix across product, services, support, and partner-sourced streams.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-ecosystem-revenue-btn"
                                onClick={() => {
                                    if (typeof onOpenEcosystemRevenue === 'function') onOpenEcosystemRevenue();
                                }}
                                className="px-3 py-2 rounded-lg border border-emerald-200/35 bg-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-500/30"
                            >
                                Open Ecosystem Revenue
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'board_operating_pack' && typeof onOpenBoardOperatingPack === 'function' && (
                        <section data-testid="ecosystem-board-operating-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Board / Investor Operating Pack</div>
                            <div className="text-[11px] text-slate-200">
                                Generate board operating packs with risk framing and evidence-linked appendix references.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-board-operating-pack-btn"
                                onClick={() => {
                                    if (typeof onOpenBoardOperatingPack === 'function') onOpenBoardOperatingPack();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Board Operating Pack
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'licensed_operator' && typeof onOpenLicensedOperator === 'function' && (
                        <section data-testid="ecosystem-licensed-operator-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Licensed Operator Framework</div>
                            <div className="text-[11px] text-slate-200">
                                Prepare controlled licensed/regional operator launch packs with governance prerequisites.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-licensed-operator-btn"
                                onClick={() => {
                                    if (typeof onOpenLicensedOperator === 'function') onOpenLicensedOperator();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Licensed Operator Framework
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'ecosystem_command' && typeof onOpenEcosystemCommand === 'function' && (
                        <section data-testid="ecosystem-ecosystem-command-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Ecosystem Command Center</div>
                            <div className="text-[11px] text-slate-200">
                                Open top-level ecosystem command surface with portfolio, network, service, planning, and revenue posture.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-ecosystem-command-btn"
                                onClick={() => {
                                    if (typeof onOpenEcosystemCommand === 'function') onOpenEcosystemCommand();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Ecosystem Command
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'shift_console' && (
                        <section data-testid="ecosystem-shift-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Shift Console</div>
                            <div className="text-[11px] text-slate-200">
                                Open role-based shift operations, handoff notes, and signed summary exports.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-shift-btn"
                                onClick={() => {
                                    if (typeof onOpenShiftConsole === 'function') onOpenShiftConsole();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Shift Console
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'incident_mode' && (
                        <section data-testid="ecosystem-incident-entry" className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-rose-100 font-bold">Incident Mode</div>
                            <div className="text-[11px] text-slate-200">
                                Open incident workflow to capture timeline, attach nodes, apply playbooks, and export incident bundles.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-incident-btn"
                                onClick={() => {
                                    if (typeof onOpenIncidentMode === 'function') onOpenIncidentMode();
                                }}
                                className="px-3 py-2 rounded-lg border border-rose-200/35 bg-rose-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/30"
                            >
                                Open Incident Mode
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'policy_rollout' && (
                        <section data-testid="ecosystem-policy-rollout-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Policy Rollout</div>
                            <div className="text-[11px] text-slate-200">
                                Launch signed policy rollout controls with diff preview and rollback history.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-policy-rollout-btn"
                                onClick={() => {
                                    if (typeof onOpenPolicyRollout === 'function') onOpenPolicyRollout();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Policy Rollout
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'offline_update_packs' && (
                        <section data-testid="ecosystem-offline-updates-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Offline Update Packs</div>
                            <div className="text-[11px] text-slate-200">
                                Verify signed update packs, assign node rings, and promote update lanes with explicit control.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-offline-updates-btn"
                                onClick={() => {
                                    if (typeof onOpenOfflineUpdates === 'function') onOpenOfflineUpdates();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Offline Updates
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'mission_scheduler' && (
                        <section data-testid="ecosystem-mission-scheduler-entry" className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100 font-bold">Mission Scheduler</div>
                            <div className="text-[11px] text-slate-200">
                                Run NodeChain mission templates with schedules, dry-run controls, and mission history visibility.
                            </div>
                            <button
                                type="button"
                                data-testid="ecosystem-open-mission-scheduler-btn"
                                onClick={() => {
                                    if (typeof onOpenMissionScheduler === 'function') onOpenMissionScheduler();
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-200/35 bg-cyan-500/20 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/30"
                            >
                                Open Mission Scheduler
                            </button>
                        </section>
                    )}
                    {activeModule && activeModule.id === 'sales_console' && <SalesConsole />}
                    {activeModule && activeModule.id === 'pilot_kit' && <PilotKitConsole />}
                    {activeModule && activeModule.id === 'white_label' && <BrandingOverrides />}
                    {activeModule && activeModule.id === 'partner_console' && <PartnerConsole />}
                    {activeModule && activeModule.id === 'certifications' && <CertificationCenter />}
                    {activeModule && activeModule.id === 'board_console' && <BoardConsole />}
                    {activeModule && activeModule.id === 'enterprise_policy' && <EnterprisePolicySuite />}
                    {activeModule && activeModule.id === 'customer_success' && <CustomerSuccessConsole />}
                    {activeModule && activeModule.id === 'expansion_planner' && <ExpansionPlanner />}
                </div>
            </aside>
        </>
    );
}
