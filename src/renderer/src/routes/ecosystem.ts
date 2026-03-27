export type EcosystemRole = 'founder' | 'sales' | 'support' | 'operator';

export type EcosystemModuleId =
    | 'mission_control'
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
