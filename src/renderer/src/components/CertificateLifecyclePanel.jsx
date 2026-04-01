import React from "react";
import {
    fingerprintPublicKey,
    getOrCreateSigningKeyPair,
    signArtifactPayload,
    stableStringify,
    verifyArtifactSignature,
} from "../utils/signedArtifacts.js";

async function sha256Hex(text) {
    const bytes = new window.TextEncoder().encode(String(text || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

function plusDays(iso, days) {
    const base = new Date(String(iso || new Date().toISOString()));
    const next = Number.isNaN(base.getTime()) ? new Date() : base;
    next.setUTCDate(next.getUTCDate() + Math.max(1, Number(days || 1)));
    return next.toISOString();
}

function expiryState(expiresAt) {
    const ts = new Date(String(expiresAt || "")).getTime();
    if (!Number.isFinite(ts)) return "unknown";
    const msLeft = ts - Date.now();
    if (msLeft <= 0) return "expired";
    if (msLeft <= 1000 * 60 * 60 * 24 * 30) return "expiring";
    return "healthy";
}

export default function CertificateLifecyclePanel({
    caRecord,
    certificates,
    revokedCertificateIds,
    onUpdateCA,
    onUpdateCertificates,
    onUpdateRevocations,
}) {
    const [subjectName, setSubjectName] = React.useState("Node Alpha");
    const [subjectId, setSubjectId] = React.useState("node-alpha");
    const [kind, setKind] = React.useState("node");
    const [validityDays, setValidityDays] = React.useState(365);
    const [status, setStatus] = React.useState("");
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    const safeCertificates = Array.isArray(certificates) ? certificates : [];
    const safeRevocations = Array.isArray(revokedCertificateIds) ? revokedCertificateIds : [];

    const createOrRotateCA = async () => {
        setBusy(true);
        try {
            const keyPair = await getOrCreateSigningKeyPair("neuralshell_pki_local_ca_v1");
            const fingerprint = await fingerprintPublicKey(keyPair.publicKeyPem);
            const next = {
                schema: "neuralshell_local_ca_v1",
                caId: String(caRecord && caRecord.caId ? caRecord.caId : `ca-${Date.now()}`),
                commonName: "NeuralShell Local Trust CA",
                createdAt: String(caRecord && caRecord.createdAt ? caRecord.createdAt : new Date().toISOString()),
                rotatedAt: new Date().toISOString(),
                expiresAt: plusDays(new Date().toISOString(), 3650),
                keyAlgorithm: "ECDSA_P256",
                publicKeyPem: keyPair.publicKeyPem,
                privateKeyPem: keyPair.privateKeyPem,
                fingerprint,
                nextSerial: Number(caRecord && caRecord.nextSerial ? caRecord.nextSerial : 1),
            };
            onUpdateCA(next);
            setStatus("Local CA ready for certificate issuance.");
            setError("");
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const issueCertificate = async () => {
        if (!(caRecord && caRecord.privateKeyPem && caRecord.publicKeyPem)) {
            setError("Initialize local CA before issuing certificates.");
            return;
        }
        setBusy(true);
        try {
            const serial = Number(caRecord.nextSerial || 1);
            const payload = {
                schema: "neuralshell_trust_certificate_v1",
                serialNumber: `NS-${String(serial).padStart(8, "0")}`,
                kind: String(kind || "node"),
                subjectName: String(subjectName || "Unnamed Subject"),
                subjectId: String(subjectId || `subject-${serial}`),
                issuedAt: new Date().toISOString(),
                expiresAt: plusDays(new Date().toISOString(), Number(validityDays || 365)),
                issuedByCaId: String(caRecord.caId || ""),
                issuedByFingerprint: String(caRecord.fingerprint || ""),
                binding: {
                    rolloutPolicyBinding: kind === "fleet" || kind === "org",
                    evidenceExchangeBinding: kind === "node" || kind === "appliance" || kind === "fleet",
                },
            };
            const signature = await signArtifactPayload(payload, caRecord.privateKeyPem);
            const hash = await sha256Hex(stableStringify(payload));
            const verified = await verifyArtifactSignature(payload, signature, caRecord.publicKeyPem);
            if (!verified) {
                throw new Error("Issued certificate failed local signature verification.");
            }
            const certificate = {
                certificateId: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                ...payload,
                hash,
                signature,
                status: "active",
            };
            onUpdateCertificates([certificate, ...safeCertificates].slice(0, 600));
            onUpdateCA({
                ...caRecord,
                nextSerial: serial + 1,
            });
            setStatus(`Certificate issued: ${certificate.serialNumber}`);
            setError("");
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const rotateCertificate = async (certificate) => {
        setSubjectName(String(certificate.subjectName || "Rotated Subject"));
        setSubjectId(String(certificate.subjectId || "rotated-subject"));
        setKind(String(certificate.kind || "node"));
        await issueCertificate();
    };

    const revokeCertificate = (certificateId) => {
        const safeId = String(certificateId || "");
        if (!safeId) return;
        if (safeRevocations.includes(safeId)) return;
        onUpdateRevocations([safeId, ...safeRevocations]);
        onUpdateCertificates(safeCertificates.map((entry) => (
            String(entry.certificateId || "") === safeId
                ? {
                    ...entry,
                    status: "revoked",
                    revokedAt: new Date().toISOString(),
                    revokedReason: "manual-revocation",
                }
                : entry
        )));
        setStatus(`Certificate revoked: ${safeId}`);
        setError("");
    };

    return (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Certificate Lifecycle</div>
                    <div className="text-[10px] text-slate-500 font-mono">Issue, rotate, revoke, and verify node/appliance/fleet/org certificates.</div>
                </div>
                <button
                    type="button"
                    data-testid="trustfabric-init-ca-btn"
                    onClick={createOrRotateCA}
                    disabled={busy}
                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100 disabled:opacity-60"
                >
                    {caRecord ? "Rotate CA Key" : "Initialize Local CA"}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <label className="space-y-1">
                    <span className="text-slate-400">Subject Name</span>
                    <input
                        data-testid="trustfabric-subject-name-input"
                        value={subjectName}
                        onChange={(event) => setSubjectName(event.target.value)}
                        className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    />
                </label>
                <label className="space-y-1">
                    <span className="text-slate-400">Subject ID</span>
                    <input
                        data-testid="trustfabric-subject-id-input"
                        value={subjectId}
                        onChange={(event) => setSubjectId(event.target.value)}
                        className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    />
                </label>
                <label className="space-y-1">
                    <span className="text-slate-400">Certificate Kind</span>
                    <select
                        data-testid="trustfabric-kind-select"
                        value={kind}
                        onChange={(event) => setKind(event.target.value)}
                        className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    >
                        <option value="node">node</option>
                        <option value="appliance">appliance</option>
                        <option value="fleet">fleet</option>
                        <option value="org">org</option>
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="text-slate-400">Validity (days)</span>
                    <input
                        data-testid="trustfabric-validity-input"
                        type="number"
                        min="1"
                        max="3650"
                        value={validityDays}
                        onChange={(event) => setValidityDays(Number(event.target.value || 365))}
                        className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    />
                </label>
            </div>
            <button
                type="button"
                data-testid="trustfabric-issue-cert-btn"
                disabled={busy}
                onClick={issueCertificate}
                className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100 disabled:opacity-60"
            >
                Issue Certificate
            </button>

            <div className="space-y-1 max-h-64 overflow-auto pr-1">
                {safeCertificates.map((certificate) => {
                    const state = safeRevocations.includes(String(certificate.certificateId || ""))
                        ? "revoked"
                        : expiryState(certificate.expiresAt);
                    return (
                        <article
                            key={certificate.certificateId}
                            className={`rounded border px-2 py-1.5 ${
                                state === "revoked"
                                    ? "border-rose-300/40 bg-rose-500/10"
                                    : state === "expired"
                                        ? "border-rose-300/40 bg-rose-500/10"
                                        : state === "expiring"
                                            ? "border-amber-300/35 bg-amber-500/10"
                                            : "border-emerald-300/30 bg-emerald-500/10"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[10px] font-mono text-slate-100">{certificate.serialNumber} · {certificate.subjectName}</div>
                                <div className="text-[9px] font-mono text-slate-400">{certificate.kind}</div>
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">
                                expires {new Date(certificate.expiresAt).toLocaleDateString()} · {state}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    type="button"
                                    data-testid={`trustfabric-rotate-${certificate.certificateId}`}
                                    onClick={() => rotateCertificate(certificate)}
                                    className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono text-cyan-100"
                                >
                                    rotate
                                </button>
                                <button
                                    type="button"
                                    data-testid={`trustfabric-revoke-${certificate.certificateId}`}
                                    onClick={() => revokeCertificate(certificate.certificateId)}
                                    className="px-2 py-1 rounded border border-rose-300/35 bg-rose-500/10 text-[9px] font-mono text-rose-100"
                                >
                                    revoke
                                </button>
                            </div>
                        </article>
                    );
                })}
                {safeCertificates.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No certificates issued yet.</div>
                )}
            </div>

            {status && (
                <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">
                    {status}
                </div>
            )}
            {error && (
                <div data-testid="trustfabric-error" className="rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                    {error}
                </div>
            )}
        </section>
    );
}
