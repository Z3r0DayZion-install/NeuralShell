import crypto from "node:crypto";

type SignedRecoveryBundle = {
  payload: Record<string, any>;
  hash: string;
  signature: string;
  signer: {
    publicKeyPem: string;
  };
};

function stableStringify(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as any)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function computeRecoveryHash(payload: Record<string, any>) {
  return crypto.createHash("sha256").update(stableStringify(payload || {})).digest("hex");
}

export function verifyRecoveryBundle(bundle: SignedRecoveryBundle) {
  const safe = bundle && typeof bundle === "object" ? bundle : ({} as SignedRecoveryBundle);
  const payload = safe.payload && typeof safe.payload === "object" ? safe.payload : {};
  const hash = String(safe.hash || "").trim().toLowerCase();
  const recomputed = computeRecoveryHash(payload);
  const hashValid = Boolean(hash) && hash === recomputed;

  const signature = Buffer.from(String(safe.signature || ""), "base64");
  const publicKeyPem = String(safe.signer && safe.signer.publicKeyPem ? safe.signer.publicKeyPem : "");
  let signatureValid = false;
  if (signature.length > 0 && publicKeyPem) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(stableStringify(payload));
    verifier.end();
    signatureValid = verifier.verify(publicKeyPem, signature);
  }

  return {
    ok: hashValid && signatureValid,
    hashValid,
    signatureValid,
    hash,
    recomputed,
  };
}

export function diffRecoveryPayload(current: Record<string, any>, incoming: Record<string, any>) {
  const left = current && typeof current === "object" ? current : {};
  const right = incoming && typeof incoming === "object" ? incoming : {};
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return keys
    .map((key) => ({
      key,
      before: (left as any)[key],
      after: (right as any)[key],
      changed: JSON.stringify((left as any)[key]) !== JSON.stringify((right as any)[key]),
    }))
    .filter((entry) => entry.changed);
}

export default {
  computeRecoveryHash,
  verifyRecoveryBundle,
  diffRecoveryPayload,
};