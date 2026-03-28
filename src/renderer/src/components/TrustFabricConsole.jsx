import React from "react";
import CertificateLifecyclePanel from "./CertificateLifecyclePanel.jsx";
import TrustChainViewer from "./TrustChainViewer.jsx";

const CA_KEY = "neuralshell_pki_local_ca_v1";
const CERTS_KEY = "neuralshell_pki_certificates_v1";
const CRL_KEY = "neuralshell_pki_revocations_v1";

function readJson(key, fallback) {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
        return parsed == null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

function getExpiring(certs, days = 30) {
    const thresholdMs = Number(days) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (Array.isArray(certs) ? certs : []).filter((entry) => {
        const expiresTs = new Date(String(entry && entry.expiresAt ? entry.expiresAt : "")).getTime();
        if (!Number.isFinite(expiresTs)) return false;
        const remaining = expiresTs - now;
        return remaining > 0 && remaining <= thresholdMs;
    });
}

export default function TrustFabricConsole({
    open,
    onClose,
}) {
    const [caRecord, setCaRecord] = React.useState(() => readJson(CA_KEY, null));
    const [certificates, setCertificates] = React.useState(() => {
        const parsed = readJson(CERTS_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [revokedCertificateIds, setRevokedCertificateIds] = React.useState(() => {
        const parsed = readJson(CRL_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });

    React.useEffect(() => {
        writeJson(CA_KEY, caRecord);
    }, [caRecord]);
    React.useEffect(() => {
        writeJson(CERTS_KEY, certificates);
    }, [certificates]);
    React.useEffect(() => {
        writeJson(CRL_KEY, revokedCertificateIds);
    }, [revokedCertificateIds]);

    const expiringSoon = React.useMemo(() => getExpiring(certificates, 30), [certificates]);
    const revokedCount = Array.isArray(revokedCertificateIds) ? revokedCertificateIds.length : 0;
    const activeCertificates = (Array.isArray(certificates) ? certificates : []).filter((entry) => (
        !revokedCertificateIds.includes(String(entry && entry.certificateId ? entry.certificateId : ""))
    ));

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[144] bg-black/60" onClick={onClose} />
            <section data-testid="trust-fabric-console" className="fixed inset-x-8 top-16 bottom-6 z-[145] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">PKI Trust Fabric</div>
                        <div className="text-[10px] font-mono text-slate-500">
                            Local CA issuance, certificate lifecycle controls, CRL enforcement, and trust-chain visibility.
                        </div>
                    </div>
                    <button
                        type="button"
                        data-testid="trust-fabric-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3 border-b border-white/10 grid grid-cols-4 gap-2 text-[9px] font-mono">
                    <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                        CA {caRecord ? "initialized" : "missing"}
                    </div>
                    <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                        active certs {activeCertificates.length}
                    </div>
                    <div className="rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-100">
                        expiring soon {expiringSoon.length}
                    </div>
                    <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-rose-100">
                        revoked {revokedCount}
                    </div>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr] gap-3 p-3 overflow-auto">
                    <CertificateLifecyclePanel
                        caRecord={caRecord}
                        certificates={certificates}
                        revokedCertificateIds={revokedCertificateIds}
                        onUpdateCA={setCaRecord}
                        onUpdateCertificates={setCertificates}
                        onUpdateRevocations={setRevokedCertificateIds}
                    />
                    <TrustChainViewer
                        caRecord={caRecord}
                        certificates={certificates}
                        revokedCertificateIds={revokedCertificateIds}
                    />
                </div>
            </section>
        </>
    );
}
