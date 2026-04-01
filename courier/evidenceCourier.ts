import crypto from "node:crypto";

export type CourierClass = "standard" | "sensitive" | "sealed" | "emergency";

export type CourierArtifact = {
  artifactId: string;
  label: string;
  sha256: string;
  sizeBytes: number;
};

export type CourierPackagePayload = {
  schema: "neuralshell_offline_courier_package_v1";
  packageId: string;
  generatedAt: string;
  courierClass: CourierClass;
  sender: string;
  receiver: string;
  quarantineRequired: boolean;
  artifacts: CourierArtifact[];
  manifestRootHash: string;
};

function stableStringify(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, any>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashText(text: string) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

export function computeManifestRootHash(artifacts: CourierArtifact[] = []) {
  const leaves = (Array.isArray(artifacts) ? artifacts : []).map((artifact) => hashText(stableStringify({
    artifactId: artifact.artifactId,
    label: artifact.label,
    sha256: artifact.sha256,
    sizeBytes: artifact.sizeBytes,
  })));
  if (!leaves.length) return hashText("empty-manifest");
  let layer = leaves.slice();
  while (layer.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < layer.length; index += 2) {
      const left = layer[index];
      const right = layer[index + 1] || left;
      next.push(hashText(`${left}:${right}`));
    }
    layer = next;
  }
  return layer[0];
}

export function buildCourierPackagePayload(input: Partial<CourierPackagePayload>): CourierPackagePayload {
  const safe = input && typeof input === "object" ? input : {};
  const artifacts = Array.isArray(safe.artifacts) ? safe.artifacts : [];
  return {
    schema: "neuralshell_offline_courier_package_v1",
    packageId: String(safe.packageId || `courier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    generatedAt: String(safe.generatedAt || new Date().toISOString()),
    courierClass: (safe.courierClass || "standard") as CourierClass,
    sender: String(safe.sender || "sender-unset"),
    receiver: String(safe.receiver || "receiver-unset"),
    quarantineRequired: safe.quarantineRequired !== false,
    artifacts,
    manifestRootHash: computeManifestRootHash(artifacts),
  };
}

export function computeCourierPayloadHash(payload: CourierPackagePayload) {
  return hashText(stableStringify(payload));
}

export default {
  buildCourierPackagePayload,
  computeCourierPayloadHash,
  computeManifestRootHash,
};
