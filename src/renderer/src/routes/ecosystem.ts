export type EcosystemRole = 'founder' | 'sales' | 'support' | 'operator' | 'security';

export type EcosystemModuleId =
    | 'mission_control'
    | 'fleet_control'
    | 'recovery_center'
    | 'appliance_console'
    | 'airgap_operations'
    | 'trust_fabric'
    | 'hardware_appliance'
    | 'courier_transfer'
    | 'continuity_drills'
    | 'procurement_command'
    | 'tamper_simulation'
    | 'institutional_command'
    | 'demo_flow'
    | 'deployment_program'
    | 'training_delivery'
    | 'support_ops'
    | 'buyer_journey'
    | 'pilot_conversion'
    | 'commercial_packages'
    | 'field_launch'
    | 'shift_console'
    | 'incident_mode'
    | 'policy_rollout'
    | 'offline_update_packs'
    | 'mission_scheduler'
    | 'sales_console'
    | 'pilot_kit'
    | 'white_label'
    | 'partner_console'
    | 'certifications'
    | 'board_console'
    | 'enterprise_policy'
    | 'customer_success'
    | 'ecosystem_launcher'
    | 'expansion_planner';

export type EcosystemModule = {
    id: EcosystemModuleId;
    title: string;
    description: string;
    minTier: 'free' | 'pro' | 'enterprise';
    capability?: string;
    roles: EcosystemRole[];
};

const TIER_RANK: Record<'free' | 'pro' | 'enterprise', number> = {
    free: 0,
    pro: 1,
    enterprise: 2,
};

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
    {
        id: 'mission_control',
        title: 'Mission Control',
        description: 'Runtime authority cockpit with live health cards, event feed, and watchdog visibility.',
        minTier: 'free',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'fleet_control',
        title: 'Fleet Control',
        description: 'Import and compare multi-node runtime bundles with health and event drill-ins.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'recovery_center',
        title: 'Recovery Center',
        description: 'Signed recovery bundles, restore preview, and safe-mode restoration flow.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'appliance_console',
        title: 'Appliance Console',
        description: 'Operator-only hardened appliance mode for relay/control deployments.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'airgap_operations',
        title: 'Air-Gapped Operations',
        description: 'Import/export station ledger, verification gates, and air-gap lock posture controls.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'trust_fabric',
        title: 'PKI Trust Fabric',
        description: 'Local CA controls, certificate lifecycle, revocation, and trust-chain export.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'hardware_appliance',
        title: 'Hardware Appliance Program',
        description: 'Provisioning, profile health, support diagnostics scope, and decommission workflows.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'courier_transfer',
        title: 'Offline Evidence Courier',
        description: 'Signed courier package movement with quarantine, receipt verification, and release controls.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'continuity_drills',
        title: 'Continuity Drills',
        description: 'Schedule and score continuity exercises with recovery evidence exports.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'procurement_command',
        title: 'Procurement Command Center',
        description: 'Generate buyer-ready security/procurement review packs and version deltas.',
        minTier: 'enterprise',
        roles: ['founder', 'support', 'sales'],
    },
    {
        id: 'tamper_simulation',
        title: 'Tamper Simulation Mode',
        description: 'Safe simulation of detection, quarantine, and response workflows.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support', 'sales'],
    },
    {
        id: 'institutional_command',
        title: 'Institutional Command Console',
        description: 'Unified executive/operator command surface across all institutional tracks.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support', 'sales'],
    },
    {
        id: 'demo_flow',
        title: 'Institutional Demo System',
        description: 'Seeded deterministic demo route with presenter guidance and baseline reset controls.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'deployment_program',
        title: 'Deployment Program Pack',
        description: 'Role-based deployment runbooks plus preflight and post-install validation flows.',
        minTier: 'pro',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'training_delivery',
        title: 'Training Delivery Pack',
        description: 'Offline role training tracks, labs, instructor guidance, and exam export controls.',
        minTier: 'pro',
        roles: ['founder', 'operator', 'support', 'sales'],
    },
    {
        id: 'support_ops',
        title: 'Support Operations Pack',
        description: 'Support intake, severity matrix, escalation ladder, and triage workflow controls.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'buyer_journey',
        title: 'Buyer Evaluation Journey',
        description: 'Evaluator quickstart and defensible buyer path from first look to approval.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'pilot_conversion',
        title: 'Pilot Conversion Kit',
        description: 'Evidence-first pilot review templates and expansion planning artifacts.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'commercial_packages',
        title: 'Commercial Package Matrix',
        description: 'SKU, deployment, support entitlement, and add-on mapping across offerings.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'field_launch',
        title: 'Field Launch Command Center',
        description: 'One-screen commercialization and deployment readiness tracker with blockers.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'shift_console',
        title: 'Shift Console',
        description: 'Role-aware handoff console with signed shift summaries.',
        minTier: 'pro',
        roles: ['founder', 'operator', 'support', 'sales'],
    },
    {
        id: 'incident_mode',
        title: 'Incident Mode',
        description: 'Declare and manage degraded/critical incidents with playbook execution.',
        minTier: 'pro',
        roles: ['founder', 'operator', 'support', 'security'],
    },
    {
        id: 'policy_rollout',
        title: 'Policy Rollout',
        description: 'Signed fleet policy rollout preview, apply, and rollback history.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support', 'security'],
    },
    {
        id: 'offline_update_packs',
        title: 'Offline Update Packs',
        description: 'Verify offline update packs and assign/promote update rings per node.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support', 'security'],
    },
    {
        id: 'mission_scheduler',
        title: 'Mission Scheduler',
        description: 'NodeChain mission templates, schedules, dry-run controls, and run history.',
        minTier: 'enterprise',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'sales_console',
        title: 'Enterprise Sales Console',
        description: 'Pipeline stages, pilots, procurement blockers, renewals, and deal progression.',
        minTier: 'pro',
        capability: 'enterprise_sales_console',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'pilot_kit',
        title: 'Pilot Program Kit',
        description: 'Generate customer-tailored pilot materials and reusable deployment packet artifacts.',
        minTier: 'pro',
        capability: 'pilot_kit_generator',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'white_label',
        title: 'White-Label / OEM',
        description: 'Signed branding profile import and local profile enforcement preview.',
        minTier: 'enterprise',
        capability: 'white_label_mode',
        roles: ['founder', 'support'],
    },
    {
        id: 'partner_console',
        title: 'Partner Operations',
        description: 'Deal registration, ownership, margins, and co-branded reseller assets.',
        minTier: 'enterprise',
        capability: 'partner_ops_console',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'certifications',
        title: 'Certification Center',
        description: 'Local training tracks, quizzes, and signed certificate exports.',
        minTier: 'pro',
        capability: 'certification_center',
        roles: ['founder', 'operator', 'support'],
    },
    {
        id: 'board_console',
        title: 'Board / Investor Pack',
        description: 'Monthly operating report generation from imported local metrics bundles.',
        minTier: 'enterprise',
        capability: 'board_reporting_console',
        roles: ['founder'],
    },
    {
        id: 'enterprise_policy',
        title: 'Deployment Policy Suite',
        description: 'Signed enterprise policy bundle import and runtime enforcement controls.',
        minTier: 'enterprise',
        capability: 'enterprise_policy_suite',
        roles: ['founder', 'support'],
    },
    {
        id: 'customer_success',
        title: 'Customer Success Workspace',
        description: 'Onboarding health, risk alerts, support trend mapping, and renewal posture.',
        minTier: 'enterprise',
        capability: 'customer_success_console',
        roles: ['founder', 'support', 'sales'],
    },
    {
        id: 'ecosystem_launcher',
        title: 'Ecosystem Launcher',
        description: 'Role-aware command center for core, marketplace, support, and GTM modules.',
        minTier: 'free',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'expansion_planner',
        title: 'Strategic Expansion Planner',
        description: 'Weighted scoring for net-new products and enterprise growth bets.',
        minTier: 'pro',
        capability: 'expansion_planner',
        roles: ['founder', 'sales'],
    },
];

function normalizeTierId(input: string): 'free' | 'pro' | 'enterprise' {
    const safe = String(input || '').trim().toLowerCase();
    if (safe === 'enterprise') return 'enterprise';
    if (safe === 'pro') return 'pro';
    return 'free';
}

export function canAccessEcosystemModule(
    moduleDef: EcosystemModule,
    role: EcosystemRole,
    tierId: string,
    capabilities: string[] = [],
) {
    const roleAllowed = moduleDef.roles.includes(role);
    const userTier = normalizeTierId(tierId);
    const tierAllowed = TIER_RANK[userTier] >= TIER_RANK[moduleDef.minTier];
    const capabilityAllowed = moduleDef.capability
        ? Array.isArray(capabilities) && capabilities.includes(moduleDef.capability)
        : true;
    return roleAllowed && tierAllowed && capabilityAllowed;
}

export function getAccessibleEcosystemModules(
    role: EcosystemRole,
    tierId: string,
    capabilities: string[] = [],
) {
    return ECOSYSTEM_MODULES.filter((moduleDef) => (
        canAccessEcosystemModule(moduleDef, role, tierId, capabilities)
    ));
}
