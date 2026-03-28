export type InstitutionalSummaryInput = {
  airgapLocked: boolean;
  certificateCount: number;
  revokedCertificateCount: number;
  applianceProfileCount: number;
  courierQuarantined: number;
  courierReleased: number;
  continuityScore: number;
  procurementPackFreshnessDays: number;
  tamperSimulationCount: number;
  criticalIncidents: number;
  releaseStatus: string;
};

export function buildInstitutionalSummary(input: Partial<InstitutionalSummaryInput>) {
  const safe = input && typeof input === "object" ? input : {};
  return {
    airGapPosture: safe.airgapLocked ? "locked" : "unlocked",
    trustHealth: {
      certificates: Number(safe.certificateCount || 0),
      revoked: Number(safe.revokedCertificateCount || 0),
    },
    applianceFleet: {
      profiles: Number(safe.applianceProfileCount || 0),
    },
    courierChain: {
      quarantined: Number(safe.courierQuarantined || 0),
      released: Number(safe.courierReleased || 0),
    },
    continuityReadiness: Number(safe.continuityScore || 0),
    procurementFreshnessDays: Number(safe.procurementPackFreshnessDays || 0),
    tamperTrainingRuns: Number(safe.tamperSimulationCount || 0),
    criticalIncidents: Number(safe.criticalIncidents || 0),
    releaseTruthStatus: String(safe.releaseStatus || "unknown"),
  };
}

export default {
  buildInstitutionalSummary,
};
