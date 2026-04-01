export type DrillScenarioId =
  | "fleet_restore"
  | "appliance_replacement"
  | "regional_policy_rollback"
  | "revoked_trust_relationship"
  | "update_pack_rollback"
  | "vault_recovery"
  | "support_incident_export";

export type DrillTemplate = {
  templateId: string;
  scenarioId: DrillScenarioId;
  title: string;
  expectedState: Record<string, any>;
  checklist: string[];
};

export type DrillRunResult = {
  runId: string;
  templateId: string;
  startedAt: string;
  finishedAt: string;
  passed: boolean;
  expectedState: Record<string, any>;
  actualState: Record<string, any>;
  deltas: Array<{ key: string; expected: any; actual: any }>;
  evidence: {
    artifactId: string;
    generatedAt: string;
    summary: string;
  };
};

export const DEFAULT_DRILL_TEMPLATES: DrillTemplate[] = [
  {
    templateId: "drill-fleet-restore",
    scenarioId: "fleet_restore",
    title: "Fleet Restore Drill",
    expectedState: { fleetHealth: "healthy", restoredNodes: 3, trustState: "valid" },
    checklist: ["recover backup bundle", "verify trust chain", "confirm node telemetry"],
  },
  {
    templateId: "drill-appliance-replacement",
    scenarioId: "appliance_replacement",
    title: "Appliance Replacement Drill",
    expectedState: { provisioned: true, trustState: "valid", policyProfile: "sealed" },
    checklist: ["replace hardware", "provision role", "verify diagnostics"],
  },
  {
    templateId: "drill-policy-rollback",
    scenarioId: "regional_policy_rollback",
    title: "Regional Policy Rollback Drill",
    expectedState: { rollbackApplied: true, incidentsOpen: 0 },
    checklist: ["apply rollback", "verify signatures", "validate runtime status"],
  },
];

export function compareState(expected: Record<string, any>, actual: Record<string, any>) {
  const safeExpected = expected && typeof expected === "object" ? expected : {};
  const safeActual = actual && typeof actual === "object" ? actual : {};
  const keys = Array.from(new Set([...Object.keys(safeExpected), ...Object.keys(safeActual)])).sort();
  return keys
    .map((key) => ({
      key,
      expected: safeExpected[key],
      actual: safeActual[key],
    }))
    .filter((entry) => JSON.stringify(entry.expected) !== JSON.stringify(entry.actual));
}

export function runDrill(template: DrillTemplate, actualState: Record<string, any>): DrillRunResult {
  const startedAt = new Date().toISOString();
  const expectedState = template && template.expectedState && typeof template.expectedState === "object"
    ? template.expectedState
    : {};
  const safeActual = actualState && typeof actualState === "object" ? actualState : {};
  const deltas = compareState(expectedState, safeActual);
  const passed = deltas.length === 0;
  const finishedAt = new Date().toISOString();
  return {
    runId: `drill-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: String(template && template.templateId ? template.templateId : "unknown-template"),
    startedAt,
    finishedAt,
    passed,
    expectedState,
    actualState: safeActual,
    deltas,
    evidence: {
      artifactId: `drill-evidence-${Date.now()}`,
      generatedAt: finishedAt,
      summary: passed ? "Drill passed expected recovery state." : `Drill failed with ${deltas.length} delta(s).`,
    },
  };
}

export function scoreDrillReadiness(runs: DrillRunResult[]) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  if (!safeRuns.length) {
    return {
      score: 0,
      passed: 0,
      failed: 0,
      total: 0,
    };
  }
  const passed = safeRuns.filter((run) => run && run.passed).length;
  const total = safeRuns.length;
  const failed = total - passed;
  return {
    score: Math.round((passed / total) * 100),
    passed,
    failed,
    total,
  };
}

export default {
  DEFAULT_DRILL_TEMPLATES,
  compareState,
  runDrill,
  scoreDrillReadiness,
};
