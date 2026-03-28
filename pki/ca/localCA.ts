import crypto from "node:crypto";

export type LocalCertificateAuthority = {
  schema: "neuralshell_local_ca_v1";
  caId: string;
  commonName: string;
  createdAt: string;
  expiresAt: string;
  keyAlgorithm: "ECDSA_P256";
  publicKeyPem: string;
  privateKeyPem: string;
  fingerprint: string;
  nextSerial: number;
};

function plusDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + Math.max(1, Number(days || 1)));
  return next;
}

export function fingerprintPublicKey(publicKeyPem: string) {
  const key = crypto.createPublicKey(publicKeyPem);
  const der = key.export({ type: "spki", format: "der" });
  const digest = crypto.createHash("sha256").update(der).digest("hex");
  return `sha256:${digest}`;
}

export function createLocalCA(commonName = "NeuralShell Local Trust CA", validityDays = 3650): LocalCertificateAuthority {
  const now = new Date();
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const fingerprint = fingerprintPublicKey(publicKeyPem);
  return {
    schema: "neuralshell_local_ca_v1",
    caId: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    commonName: String(commonName || "NeuralShell Local Trust CA"),
    createdAt: now.toISOString(),
    expiresAt: plusDays(now, validityDays).toISOString(),
    keyAlgorithm: "ECDSA_P256",
    publicKeyPem,
    privateKeyPem,
    fingerprint,
    nextSerial: 1,
  };
}

export function rotateLocalCA(ca: LocalCertificateAuthority, validityDays = 3650): LocalCertificateAuthority {
  const safe = ca && typeof ca === "object" ? ca : createLocalCA();
  const next = createLocalCA(String(safe.commonName || "NeuralShell Local Trust CA"), validityDays);
  return {
    ...next,
    caId: String(safe.caId || next.caId),
    nextSerial: Number(safe.nextSerial || 1),
  };
}

export default {
  createLocalCA,
  rotateLocalCA,
  fingerprintPublicKey,
};
