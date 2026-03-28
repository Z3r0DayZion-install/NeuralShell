import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import { verifyArtifactSignature } from "../utils/signedArtifacts.js";

function classifyExpiry(expiresAt) {
    const ts = new Date(String(expiresAt || "")).getTime();
    if (!Number.isFinite(ts)) return "expired";
    const diff = ts - Date.now();
    if (diff <= 0) return "expired";
    if (diff <= 1000 * 60 * 60 * 24 * 30) return "expiring";
    return "healthy";
}

export default function TrustChainViewer({
    caRecord,
    certificates,
    revokedCertificateIds,
}) {
    const safeCerts = Array.isArray(certificates) ? certificates : [];
    const safeRevocations = Array.isArray(revokedCertificateIds) ? revokedCertificateIds : [];
    const [verificationMap, setVerificationMap] = React.useState({});

    React.useEffect(() => {
        let mounted = true;
        const run = async () => {
            const next = {};
            for (const cert of safeCerts) {
                const certId = String(cert && cert.certificateId ? cert.certificateId : "");
                if (!certId) continue;
                const payload = {
                    schema: cert.schema,
                    serialNumber: cert.serialNumber,
                    kind: cert.kind,
                    subjectName: cert.subjectName,
                    subjectId: cert.subjectId,
                    issuedAt: cert.issuedAt,
                    expiresAt: cert.expiresAt,
                    issuedByCaId: cert.issuedByCaId,
                    issuedByFingerprint: cert.issuedByFingerprint,
                    binding: cert.binding && typeof cert.binding === "object" ? cert.binding : {},
                };
                const signatureValid = Boolean(caRecord && caRecord.publicKeyPem)
                    && await verifyArtifactSignature(payload, String(cert.signature || ""), String(caRecord.publicKeyPem || ""));
                const revoked = safeRevocations.includes(certId);
                const expiry = classifyExpiry(cert.expiresAt);
                next[certId] = {
                    signatureValid,
                    revoked,
                    expiry,
                    ok: signatureValid && !revoked && expiry !== "expired",
                };
            }
            if (mounted) setVerificationMap(next);
        };
        run();
        return () => {
            mounted = false;
        };
    }, [caRecord, safeCerts, safeRevocations]);

    const summary = React.useMemo(() => {
        const values = Object.values(verificationMap);
        return {
            total: safeCerts.length,
            healthy: values.filter((entry) => entry.ok).length,
            expiring: values.filter((entry) => entry.expiry === "expiring").length,
            revoked: values.filter((entry) => entry.revoked).length,
        };
    }, [safeCerts.length, verificationMap]);

    return (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Trust Chain Viewer</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                        Certificate path state for nodes, appliances, fleets, and org relationships.
                    </div>
                </div>
                <button
                    type="button"
                    data-testid="trustchain-export-btn"
                    onClick={() => {
                        downloadJson("neuralshell_trust_chain_view.json", {
                            exportedAt: new Date().toISOString(),
                            ca: caRecord || null,
                            certificates: safeCerts,
                            revocations: safeRevocations,
                            verificationMap,
                        });
                    }}
                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                >
                    Export
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
                <div className="rounded border border-white/10 bg-black/20 px-2 py-1 text-slate-300">total {summary.total}</div>
                <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">healthy {summary.healthy}</div>
                <div className="rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-200">expiring {summary.expiring}</div>
                <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-rose-200">revoked {summary.revoked}</div>
            </div>

            <div data-testid="trustchain-list" className="max-h-[300px] overflow-auto pr-1 space-y-1.5">
                {safeCerts.map((certificate) => {
                    const key = String(certificate && certificate.certificateId ? certificate.certificateId : "");
                    const verification = verificationMap[key] || { ok: false, signatureValid: false, revoked: false, expiry: "expired" };
                    return (
                        <article
                            key={key}
                            className={`rounded border px-2 py-1.5 ${
                                verification.ok
                                    ? "border-emerald-300/30 bg-emerald-500/10"
                                    : verification.revoked
                                        ? "border-rose-300/40 bg-rose-500/10"
                                        : verification.expiry === "expiring"
                                            ? "border-amber-300/35 bg-amber-500/10"
                                            : "border-rose-300/40 bg-rose-500/10"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[10px] font-mono text-slate-100">{certificate.serialNumber} · {certificate.subjectName}</div>
                                <div className="text-[9px] font-mono text-slate-400">{certificate.kind}</div>
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">
                                sig={verification.signatureValid ? "valid" : "invalid"} · expiry={verification.expiry} · revoked={verification.revoked ? "yes" : "no"}
                            </div>
                        </article>
                    );
                })}
                {safeCerts.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No certificates available for trust-chain view.</div>
                )}
            </div>
        </section>
    );
}
