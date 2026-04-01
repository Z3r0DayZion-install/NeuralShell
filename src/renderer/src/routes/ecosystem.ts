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
    | 'partner_rollout'
    | 'buyer_ops'
    | 'demo_to_pilot'
    | 'pilot_expansion'
    | 'renewal_risk'
    | 'launch_week'
    | 'followup_generator'
    | 'field_feedback'
    | 'partner_certification'
    | 'managed_services'
    | 'strategic_account'
    | 'portfolio_rollout'
    | 'revenue_ops'
    | 'channel_expansion'
    | 'cross_account_renewal'
    | 'executive_scale'
    | 'ecosystem_portfolio'
    | 'service_line'
    | 'partner_network_governance'
    | 'global_planning'
    | 'ecosystem_revenue'
    | 'board_operating_pack'
    | 'licensed_operator'
    | 'ecosystem_command'
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
        id: 'partner_rollout',
        title: 'Partner Rollout Console',
        description: 'Partner activation checklist, readiness scoring, blocker queue, and handoff summary export.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'buyer_ops',
        title: 'Buyer Ops Automation',
        description: 'Stage-aware buyer follow-up generation with timeline and stale-evaluator controls.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'demo_to_pilot',
        title: 'Demo-to-Pilot Engine',
        description: 'Demo outcome capture, pilot-fit scorecard, and conversion decision workflow.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'pilot_expansion',
        title: 'Pilot Expansion Command',
        description: 'Pilot milestone tracking and expansion proposal generation from evidence inputs.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'renewal_risk',
        title: 'Renewal Risk Console',
        description: 'Renewal timeline, explainable risk scoring, and retention intervention summaries.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'launch_week',
        title: 'Launch Week Command Discipline',
        description: 'Live launch-day checklist, escalation board, and end-of-day command exports.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'followup_generator',
        title: 'Proof-Backed Follow-Up',
        description: 'Generate stage-aware follow-up drafts grounded in explicit proof references.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'field_feedback',
        title: 'Field Feedback Routing',
        description: 'Capture and classify field feedback for routing to product/support/docs/training queues.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'partner_certification',
        title: 'Partner Certification Hub',
        description: 'Formal partner certification, enablement assignment, recertification warnings, and registry export.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'managed_services',
        title: 'Managed Services Console',
        description: 'Multi-account managed operations with health, drift, and escalation visibility.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'strategic_account',
        title: 'Strategic Account Orchestration',
        description: 'Stakeholder maps, blockers, and evidence-linked expansion hypotheses for key accounts.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'portfolio_rollout',
        title: 'Portfolio Rollout Planner',
        description: 'Cross-site/account rollout stage matrix with dependency and strain visibility.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'revenue_ops',
        title: 'Revenue Operations Console',
        description: 'Pipeline-to-revenue, SKU mix, and expansion/renewal signal views.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'channel_expansion',
        title: 'Channel Expansion Planner',
        description: 'Channel model scorecards, enablement gaps, and launch package readiness planning.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'cross_account_renewal',
        title: 'Cross-Account Renewal Matrix',
        description: 'Renewal timing, risk overlays, and intervention planning across accounts.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'executive_scale',
        title: 'Executive Scale Dashboard',
        description: 'Founder/exec one-screen summary for partner, account, rollout, revenue, and renewal scale posture.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support', 'operator'],
    },
    {
        id: 'ecosystem_portfolio',
        title: 'Ecosystem Portfolio Console',
        description: 'Operate product/service/channel portfolio lines with attachment path and health visibility.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'service_line',
        title: 'Service Line Operating Layer',
        description: 'Service line catalog, capacity, utilization, and health operations view.',
        minTier: 'pro',
        roles: ['founder', 'support', 'operator'],
    },
    {
        id: 'partner_network_governance',
        title: 'Partner Network Governance',
        description: 'Network-wide tier, compliance, and governance-state command view.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'global_planning',
        title: 'Global Account & Region Planning',
        description: 'Region-fit overlays and phased global planning across account/deployment realities.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'ecosystem_revenue',
        title: 'Ecosystem Revenue Mix Planner',
        description: 'Revenue mix, margin proxy, and partner/support overlays across ecosystem lines.',
        minTier: 'pro',
        roles: ['founder', 'sales', 'support'],
    },
    {
        id: 'board_operating_pack',
        title: 'Board / Investor Operating Pack',
        description: 'Generate sober board/investor operating packs with evidence-linked appendix context.',
        minTier: 'pro',
        roles: ['founder'],
    },
    {
        id: 'licensed_operator',
        title: 'Licensed Operator Framework',
        description: 'Controlled licensed-operator launch framework tied to training/certification/governance requirements.',
        minTier: 'pro',
        roles: ['founder', 'support'],
    },
    {
        id: 'ecosystem_command',
        title: 'Ecosystem Command Center',
        description: 'Top-level ecosystem command summary with drill-down into all Δ18 systems.',
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
