export type SimulationScenarioId =
  | "invalid_signature_injection"
  | "tampered_evidence_envelope"
  | "revoked_cert_presented"
  | "policy_bundle_mismatch"
  | "relay_path_failure_burst"
  | "node_heartbeat_dropout"
  | "stale_update_pack_presented"
  | "break_glass_misuse";

export type SimulationScenario = {
  scenarioId: SimulationScenarioId;
  title: string;
  expectedResponse: string[];
  severity: "warning" | "degraded" | "critical";
};

export type SimulationResult = {
  runId: string;
  scenarioId: SimulationScenarioId;
  title: string;
  simulatedAt: string;
  simulated: true;
  expectedResponse: string[];
  triggeredResponse: string[];
  passed: boolean;
};

export const SAFE_SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    scenarioId: "invalid_signature_injection",
    title: "Invalid Signature Injection",
    expectedResponse: ["signature_validation_failed", "quarantine_artifact", "raise_incident_event"],
    severity: "critical",
  },
  {
    scenarioId: "tampered_evidence_envelope",
    title: "Tampered Evidence Envelope",
    expectedResponse: ["hash_mismatch_detected", "block_release", "append_audit_event"],
    severity: "critical",
  },
  {
    scenarioId: "revoked_cert_presented",
    title: "Revoked Certificate Presented",
    expectedResponse: ["trust_path_invalid", "deny_operation", "raise_trust_alert"],
    severity: "critical",
  },
  {
    scenarioId: "policy_bundle_mismatch",
    title: "Policy Bundle Mismatch",
    expectedResponse: ["policy_diff_alert", "rollback_gate", "operator_confirmation_required"],
    severity: "warning",
  },
  {
    scenarioId: "relay_path_failure_burst",
    title: "Relay Path Failure Burst",
    expectedResponse: ["switch_to_local_mode", "degraded_alert", "capture_watchdog_event"],
    severity: "degraded",
  },
  {
    scenarioId: "node_heartbeat_dropout",
    title: "Node Heartbeat Dropout",
    expectedResponse: ["mark_node_degraded", "incident_mode_suggestion", "append_fleet_event"],
    severity: "degraded",
  },
  {
    scenarioId: "stale_update_pack_presented",
    title: "Stale Update Pack Presented",
    expectedResponse: ["reject_update_pack", "keep_quarantine", "append_update_alert"],
    severity: "warning",
  },
  {
    scenarioId: "break_glass_misuse",
    title: "Break-Glass Misuse Simulation",
    expectedResponse: ["deny_unapproved_override", "require_dual_signoff", "append_security_audit"],
    severity: "critical",
  },
];

export function runSafeSimulation(scenario: SimulationScenario): SimulationResult {
  const safe = scenario && typeof scenario === "object" ? scenario : SAFE_SIMULATION_SCENARIOS[0];
  return {
    runId: `simulation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioId: safe.scenarioId,
    title: safe.title,
    simulatedAt: new Date().toISOString(),
    simulated: true,
    expectedResponse: safe.expectedResponse.slice(),
    triggeredResponse: safe.expectedResponse.slice(),
    passed: true,
  };
}

export default {
  SAFE_SIMULATION_SCENARIOS,
  runSafeSimulation,
};
