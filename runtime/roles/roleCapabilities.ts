export type RuntimeRole = "founder" | "operator" | "support" | "security" | "sales";

export type RoleCapabilities = {
  canRunPolicyRollouts: boolean;
  canRunRecovery: boolean;
  canDeclareIncidents: boolean;
  canManageFleet: boolean;
  canManageAppliance: boolean;
  canViewSalesSlice: boolean;
  canEditNodeChainMissions: boolean;
};

export const ROLE_CAPABILITIES: Record<RuntimeRole, RoleCapabilities> = {
  founder: {
    canRunPolicyRollouts: true,
    canRunRecovery: true,
    canDeclareIncidents: true,
    canManageFleet: true,
    canManageAppliance: true,
    canViewSalesSlice: true,
    canEditNodeChainMissions: true,
  },
  operator: {
    canRunPolicyRollouts: true,
    canRunRecovery: true,
    canDeclareIncidents: true,
    canManageFleet: true,
    canManageAppliance: true,
    canViewSalesSlice: false,
    canEditNodeChainMissions: true,
  },
  support: {
    canRunPolicyRollouts: false,
    canRunRecovery: true,
    canDeclareIncidents: true,
    canManageFleet: true,
    canManageAppliance: true,
    canViewSalesSlice: true,
    canEditNodeChainMissions: false,
  },
  security: {
    canRunPolicyRollouts: true,
    canRunRecovery: true,
    canDeclareIncidents: true,
    canManageFleet: true,
    canManageAppliance: true,
    canViewSalesSlice: false,
    canEditNodeChainMissions: false,
  },
  sales: {
    canRunPolicyRollouts: false,
    canRunRecovery: false,
    canDeclareIncidents: false,
    canManageFleet: false,
    canManageAppliance: false,
    canViewSalesSlice: true,
    canEditNodeChainMissions: false,
  },
};

export function getRoleCapabilities(role: string): RoleCapabilities {
  const safe = String(role || "").trim().toLowerCase() as RuntimeRole;
  return ROLE_CAPABILITIES[safe] || ROLE_CAPABILITIES.operator;
}

export default {
  ROLE_CAPABILITIES,
  getRoleCapabilities,
};