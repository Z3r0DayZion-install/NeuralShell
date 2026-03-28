export type OfflineUpdatePack = {
  packId: string;
  version: string;
  ring: "canary" | "standard" | "delayed" | "locked";
  generatedAt: string;
  payload: Record<string, any>;
  hash: string;
  signature: string;
  signer: {
    publicKeyPem: string;
    fingerprint: string;
  };
};

export function normalizeRing(input: string) {
  const safe = String(input || "").trim().toLowerCase();
  if (safe === "canary" || safe === "standard" || safe === "delayed" || safe === "locked") {
    return safe;
  }
  return "standard";
}

export default {
  normalizeRing,
};