import crypto from "node:crypto";
import type { LocalCertificateAuthority } from "../ca/localCA";

export type CertificateKind = "node" | "appliance" | "fleet" | "org";

export type TrustCertificate = {
  schema: "neuralshell_trust_certificate_v1";
  certificateId: string;
  serialNumber: string;
  kind: CertificateKind;
  subjectName: string;
  subjectId: string;
  issuedAt: string;
  expiresAt: string;
  issuedByCaId: string;
  issuedByFingerprint: string;
  binding: Record<string, any>;
  signature: string;
  status: "active" | "revoked" | "expired";
  revokedAt?: string;
  revokedReason?: string;
};

type IssueOptions = {
  kind: CertificateKind;
  subjectName: string;
  subjectId: string;
  validityDays?: number;
  binding?: Record<string, any>;
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

function plusDays(baseIso: string, days: number) {
  const base = new Date(baseIso);
  const next = Number.isNaN(base.getTime()) ? new Date() : base;
  next.setUTCDate(next.getUTCDate() + Math.max(1, Number(days || 1)));
  return next.toISOString();
}

function serialFromCounter(counter: number) {
  return `NS-${String(counter).padStart(8, "0")}`;
}

function signPayload(payload: Record<string, any>, privateKeyPem: string) {
  const signer = crypto.createSign("SHA256");
  signer.update(stableStringify(payload));
  signer.end();
  return signer.sign(privateKeyPem, "base64");
}

function verifyPayload(payload: Record<string, any>, signature: string, publicKeyPem: string) {
  const verifier = crypto.createVerify("SHA256");
  verifier.update(stableStringify(payload));
  verifier.end();
  return verifier.verify(publicKeyPem, Buffer.from(String(signature || ""), "base64"));
}

export function issueCertificate(
  ca: LocalCertificateAuthority,
  options: IssueOptions,
): { certificate: TrustCertificate; nextSerial: number } {
  const safeCa = ca && typeof ca === "object" ? ca : null;
  if (!safeCa || !safeCa.privateKeyPem || !safeCa.publicKeyPem) {
    throw new Error("Cannot issue certificate without CA key material.");
  }
  const now = new Date().toISOString();
  const serialCounter = Number(safeCa.nextSerial || 1);
  const serialNumber = serialFromCounter(serialCounter);
  const payload = {
    schema: "neuralshell_trust_certificate_v1",
    serialNumber,
    kind: String(options.kind || "node"),
    subjectName: String(options.subjectName || "Unnamed Subject"),
    subjectId: String(options.subjectId || `subject-${serialCounter}`),
    issuedAt: now,
    expiresAt: plusDays(now, Number(options.validityDays || 365)),
    issuedByCaId: String(safeCa.caId || ""),
    issuedByFingerprint: String(safeCa.fingerprint || ""),
    binding: options.binding && typeof options.binding === "object" ? options.binding : {},
  };
  const signature = signPayload(payload, safeCa.privateKeyPem);
  const certificate: TrustCertificate = {
    ...payload,
    certificateId: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    signature,
    status: "active",
  };
  return {
    certificate,
    nextSerial: serialCounter + 1,
  };
}

export function verifyCertificate(
  certificate: TrustCertificate,
  caPublicKeyPem: string,
  revokedCertificateIds: string[] = [],
) {
  const safe = certificate && typeof certificate === "object" ? certificate : ({} as TrustCertificate);
  const payload = {
    schema: safe.schema,
    serialNumber: safe.serialNumber,
    kind: safe.kind,
    subjectName: safe.subjectName,
    subjectId: safe.subjectId,
    issuedAt: safe.issuedAt,
    expiresAt: safe.expiresAt,
    issuedByCaId: safe.issuedByCaId,
    issuedByFingerprint: safe.issuedByFingerprint,
    binding: safe.binding && typeof safe.binding === "object" ? safe.binding : {},
  };
  const signatureValid = Boolean(caPublicKeyPem && safe.signature)
    && verifyPayload(payload, String(safe.signature || ""), caPublicKeyPem);
  const now = Date.now();
  const expiryTs = new Date(String(safe.expiresAt || "")).getTime();
  const expired = Number.isFinite(expiryTs) ? expiryTs < now : true;
  const revoked = Array.isArray(revokedCertificateIds)
    && revokedCertificateIds.includes(String(safe.certificateId || ""));
  return {
    ok: signatureValid && !expired && !revoked,
    signatureValid,
    expired,
    revoked,
  };
}

export function revokeCertificate(certificate: TrustCertificate, reason = "manual-revocation"): TrustCertificate {
  return {
    ...certificate,
    status: "revoked",
    revokedAt: new Date().toISOString(),
    revokedReason: String(reason || "manual-revocation"),
  };
}

export function rotateCertificate(
  oldCertificate: TrustCertificate,
  ca: LocalCertificateAuthority,
  options: Partial<IssueOptions> = {},
) {
  const issued = issueCertificate(ca, {
    kind: options.kind || oldCertificate.kind || "node",
    subjectName: options.subjectName || oldCertificate.subjectName || "Rotated Subject",
    subjectId: options.subjectId || oldCertificate.subjectId || "rotated-subject",
    validityDays: Number(options.validityDays || 365),
    binding: {
      ...(oldCertificate.binding && typeof oldCertificate.binding === "object" ? oldCertificate.binding : {}),
      ...(options.binding && typeof options.binding === "object" ? options.binding : {}),
      replacesCertificateId: oldCertificate.certificateId,
    },
  });
  return issued;
}

export default {
  issueCertificate,
  verifyCertificate,
  revokeCertificate,
  rotateCertificate,
};
