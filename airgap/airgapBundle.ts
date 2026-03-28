import crypto from "node:crypto";

export type AirGapArtifactDirection = "import" | "export";

export type AirGapArtifactType =
  | "installer"
  | "update_pack"
  | "provider_package"
  | "docs_bundle"
  | "trust_bundle"
  | "certificate_bundle"
  | "evidence_bundle";

export type AirGapArtifactRecord = {
  artifactId: string;
  artifactType: AirGapArtifactType;
  direction: AirGapArtifactDirection;
  label: string;
  relativePath: string;
  sha256: string;
  verified: boolean;
};

export type AirGapBundlePayload = {
  schema: "neuralshell_airgap_bundle_v1";
  bundleVersion: string;
  generatedAt: string;
  mode: {
    airGapLocked: boolean;
    allowExternalNetwork: boolean;
    transferBoundary: string;
  };
  importStationChecklist: string[];
  exportStationChecklist: string[];
  offlinePackages: {
    installers: AirGapArtifactRecord[];
    updatePacks: AirGapArtifactRecord[];
    providerPackages: AirGapArtifactRecord[];
    docsBundles: AirGapArtifactRecord[];
    trustBundles: AirGapArtifactRecord[];
  };
  reproducibilityDigest?: string;
};

function sortObjectKeys(value: any): any {
  if (Array.isArray(value)) return value.map((entry) => sortObjectKeys(entry));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    Object.keys(value).sort().forEach((key) => {
      out[key] = sortObjectKeys((value as Record<string, any>)[key]);
    });
    return out;
  }
  return value;
}

export function stableStringify(value: any) {
  return JSON.stringify(sortObjectKeys(value));
}

function sortArtifacts(records: AirGapArtifactRecord[] = []) {
  return records.slice().sort((left, right) => {
    const a = `${left.artifactType}:${left.direction}:${left.relativePath}:${left.label}`;
    const b = `${right.artifactType}:${right.direction}:${right.relativePath}:${right.label}`;
    return a.localeCompare(b);
  });
}

export function buildAirGapBundlePayload(input: Partial<AirGapBundlePayload> = {}): AirGapBundlePayload {
  const safe = input && typeof input === "object" ? input : {};
  const payload: AirGapBundlePayload = {
    schema: "neuralshell_airgap_bundle_v1",
    bundleVersion: String(safe.bundleVersion || "0.0.0"),
    generatedAt: String(safe.generatedAt || new Date().toISOString()),
    mode: {
      airGapLocked: true,
      allowExternalNetwork: false,
      transferBoundary: "manual-import-export-station",
      ...(safe.mode && typeof safe.mode === "object" ? safe.mode : {}),
    },
    importStationChecklist: Array.isArray(safe.importStationChecklist)
      ? safe.importStationChecklist.map((entry) => String(entry || "")).filter(Boolean)
      : [],
    exportStationChecklist: Array.isArray(safe.exportStationChecklist)
      ? safe.exportStationChecklist.map((entry) => String(entry || "")).filter(Boolean)
      : [],
    offlinePackages: {
      installers: sortArtifacts(safe.offlinePackages && Array.isArray(safe.offlinePackages.installers) ? safe.offlinePackages.installers : []),
      updatePacks: sortArtifacts(safe.offlinePackages && Array.isArray(safe.offlinePackages.updatePacks) ? safe.offlinePackages.updatePacks : []),
      providerPackages: sortArtifacts(safe.offlinePackages && Array.isArray(safe.offlinePackages.providerPackages) ? safe.offlinePackages.providerPackages : []),
      docsBundles: sortArtifacts(safe.offlinePackages && Array.isArray(safe.offlinePackages.docsBundles) ? safe.offlinePackages.docsBundles : []),
      trustBundles: sortArtifacts(safe.offlinePackages && Array.isArray(safe.offlinePackages.trustBundles) ? safe.offlinePackages.trustBundles : []),
    },
  };
  payload.reproducibilityDigest = computeAirGapReproducibilityDigest(payload);
  return payload;
}

export function computeAirGapHash(payload: AirGapBundlePayload) {
  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function computeAirGapReproducibilityDigest(payload: AirGapBundlePayload) {
  const safe = payload && typeof payload === "object" ? payload : ({} as AirGapBundlePayload);
  const canonical = {
    ...safe,
    generatedAt: "normalized",
    reproducibilityDigest: "",
  };
  return crypto.createHash("sha256").update(stableStringify(canonical)).digest("hex");
}

export function isAirGapBundleReadyForActivation(payload: AirGapBundlePayload) {
  const safe = payload && typeof payload === "object" ? payload : ({} as AirGapBundlePayload);
  const packageSets = safe.offlinePackages && typeof safe.offlinePackages === "object"
    ? safe.offlinePackages
    : {
      installers: [],
      updatePacks: [],
      providerPackages: [],
      docsBundles: [],
      trustBundles: [],
    };
  const allRecords = [
    ...(Array.isArray(packageSets.installers) ? packageSets.installers : []),
    ...(Array.isArray(packageSets.updatePacks) ? packageSets.updatePacks : []),
    ...(Array.isArray(packageSets.providerPackages) ? packageSets.providerPackages : []),
    ...(Array.isArray(packageSets.docsBundles) ? packageSets.docsBundles : []),
    ...(Array.isArray(packageSets.trustBundles) ? packageSets.trustBundles : []),
  ];
  const allVerified = allRecords.every((record) => Boolean(record && record.verified));
  return (
    safe.schema === "neuralshell_airgap_bundle_v1"
    && Boolean(safe.mode && safe.mode.airGapLocked)
    && safe.mode && safe.mode.allowExternalNetwork === false
    && Array.isArray(safe.importStationChecklist) && safe.importStationChecklist.length > 0
    && Array.isArray(safe.exportStationChecklist) && safe.exportStationChecklist.length > 0
    && allVerified
  );
}

export default {
  stableStringify,
  buildAirGapBundlePayload,
  computeAirGapHash,
  computeAirGapReproducibilityDigest,
  isAirGapBundleReadyForActivation,
};
