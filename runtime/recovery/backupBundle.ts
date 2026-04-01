import crypto from "node:crypto";

type RecoverySigner = {
  publicKeyPem: string;
  sign: (payload: Record<string, any>) => string;
};

function sanitizeValue(value: any, allowSecrets: boolean) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((entry) => sanitizeValue(entry, allowSecrets));
  if (typeof value !== "object") return value;
  const out: Record<string, any> = {};
  Object.entries(value).forEach(([key, entry]) => {
    const lower = String(key || "").toLowerCase();
    if (!allowSecrets && (lower.includes("secret") || lower.includes("token") || lower.includes("password") || lower.includes("passphrase"))) {
      out[key] = "[excluded]";
      return;
    }
    out[key] = sanitizeValue(entry, allowSecrets);
  });
  return out;
}

export function buildRecoveryPayload(source: Record<string, any>, options: { includeSecrets?: boolean } = {}) {
  const allowSecrets = Boolean(options.includeSecrets);
  const safeSource = source && typeof source === "object" ? source : {};
  return {
    schema: "neuralshell_recovery_bundle_v1",
    generatedAt: new Date().toISOString(),
    includeSecrets: allowSecrets,
    data: sanitizeValue(safeSource, allowSecrets),
  };
}

export function hashRecoveryPayload(payload: Record<string, any>) {
  const normalized = JSON.stringify(payload || {});
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function createRecoveryBundle(
  source: Record<string, any>,
  signer: RecoverySigner,
  options: { includeSecrets?: boolean } = {},
) {
  const payload = buildRecoveryPayload(source, options);
  const hash = hashRecoveryPayload(payload);
  const signature = signer.sign(payload);
  return {
    schema: "neuralshell_recovery_bundle_signed_v1",
    payload,
    hash,
    signature,
    signer: {
      publicKeyPem: String(signer.publicKeyPem || ""),
    },
  };
}

export default {
  buildRecoveryPayload,
  hashRecoveryPayload,
  createRecoveryBundle,
};