import React from "react";
import { readTextFile } from "../utils/recordIO.js";
import { stableStringify, verifyArtifactSignature } from "../utils/signedArtifacts.js";

const TRANSFERS_KEY = "neuralshell_airgap_transfer_chain_v1";
const IMPORT_CHECKLIST_KEY = "neuralshell_airgap_import_checklist_v1";
const EXPORT_CHECKLIST_KEY = "neuralshell_airgap_export_checklist_v1";
const ACTIVATED_ARTIFACTS_KEY = "neuralshell_airgap_activated_artifacts_v1";

const IMPORT_CHECKLIST = [
    { id: "import-media-serial", label: "Validate transfer media serial and seal record." },
    { id: "import-hash-verify", label: "Verify hash and signature before ingest." },
    { id: "import-quarantine", label: "Quarantine unverified inbound artifacts." },
    { id: "import-dual-approval", label: "Record dual-operator approval for activation." },
];

const EXPORT_CHECKLIST = [
    { id: "export-class-label", label: "Assign courier class and sensitivity label." },
    { id: "export-manifest-sign", label: "Sign outbound manifest with sender identity." },
    { id: "export-ledger-record", label: "Record handoff in offline transfer ledger." },
    { id: "export-receipt-confirm", label: "Capture receiver receipt hash and close transfer." },
];

function readJson(key, fallback) {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    try {
        const raw = JSON.parse(window.localStorage.getItem(key) || "null");
        return raw == null ? fallback : raw;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

function toChecklistState(items, stored) {
    const safeStored = stored && typeof stored === "object" ? stored : {};
    const out = {};
    items.forEach((item) => {
        out[item.id] = Boolean(safeStored[item.id]);
    });
    return out;
}

function classifyArtifact(payload) {
    const schema = String(payload && payload.schema ? payload.schema : "").toLowerCase();
    if (schema.includes("update_pack")) return "update_pack";
    if (schema.includes("recovery_bundle")) return "evidence_bundle";
    if (schema.includes("airgap_bundle")) return "docs_bundle";
    if (schema.includes("certificate") || schema.includes("cert")) return "certificate_bundle";
    if (schema.includes("trust")) return "trust_bundle";
    return "unknown";
}

async function sha256Hex(text) {
    const encoded = new window.TextEncoder().encode(String(text || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest)).map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

function summarizeChecklist(state, template) {
    return template.reduce((acc, item) => acc + (state[item.id] ? 1 : 0), 0);
}

export default function AirGapOperationsCenter({
    open,
    onClose,
    locked = false,
    onToggleLocked,
}) {
    const [transferChain, setTransferChain] = React.useState(() => {
        const rows = readJson(TRANSFERS_KEY, []);
        return Array.isArray(rows) ? rows : [];
    });
    const [importChecklistState, setImportChecklistState] = React.useState(() => (
        toChecklistState(IMPORT_CHECKLIST, readJson(IMPORT_CHECKLIST_KEY, {}))
    ));
    const [exportChecklistState, setExportChecklistState] = React.useState(() => (
        toChecklistState(EXPORT_CHECKLIST, readJson(EXPORT_CHECKLIST_KEY, {}))
    ));
    const [status, setStatus] = React.useState("");
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
        writeJson(TRANSFERS_KEY, transferChain);
    }, [transferChain]);

    React.useEffect(() => {
        writeJson(IMPORT_CHECKLIST_KEY, importChecklistState);
    }, [importChecklistState]);

    React.useEffect(() => {
        writeJson(EXPORT_CHECKLIST_KEY, exportChecklistState);
    }, [exportChecklistState]);

    const importCompleted = summarizeChecklist(importChecklistState, IMPORT_CHECKLIST);
    const exportCompleted = summarizeChecklist(exportChecklistState, EXPORT_CHECKLIST);
    const verifiedImports = transferChain.filter((entry) => entry.direction === "import" && entry.verified);
    const quarantinedImports = transferChain.filter((entry) => entry.direction === "import" && !entry.verified);

    const handleImport = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        setBusy(true);
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || "{}"));
            const payload = parsed && parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
            const signature = String(parsed && parsed.signature ? parsed.signature : "");
            const publicKeyPem = String(parsed && parsed.signer && parsed.signer.publicKeyPem ? parsed.signer.publicKeyPem : "");
            const hash = String(parsed && parsed.hash ? parsed.hash : "").trim().toLowerCase();

            if (!payload || !signature || !publicKeyPem || !hash) {
                throw new Error("Artifact missing payload/signature/public key/hash.");
            }

            const signatureValid = await verifyArtifactSignature(payload, signature, publicKeyPem);
            const computedHash = await sha256Hex(stableStringify(payload));
            const hashValid = computedHash === hash;
            const verified = Boolean(signatureValid && hashValid);
            const direction = String(parsed && parsed.direction ? parsed.direction : "import").toLowerCase() === "export" ? "export" : "import";

            const record = {
                transferId: `airgap-transfer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                at: new Date().toISOString(),
                sourceName: String(file.name || "artifact.json"),
                direction,
                artifactType: classifyArtifact(payload),
                classLabel: String(parsed && parsed.classLabel ? parsed.classLabel : "standard"),
                signerFingerprint: String(parsed && parsed.signer && parsed.signer.fingerprint ? parsed.signer.fingerprint : ""),
                hash,
                computedHash,
                verified,
                quarantineState: verified ? "released" : "quarantined",
                schema: String(payload && payload.schema ? payload.schema : "unknown"),
            };
            setTransferChain((prev) => [record, ...(Array.isArray(prev) ? prev : [])].slice(0, 400));
            setStatus(
                verified
                    ? `Verified ${record.sourceName} and staged for activation.`
                    : `Quarantined ${record.sourceName}. Verification failed.`
            );
            setError(verified ? "" : "Imported artifact failed verification and remains quarantined.");
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
            if (event && event.target) event.target.value = "";
        }
    };

    const handleActivateVerifiedImports = () => {
        if (!verifiedImports.length) {
            setError("No verified import artifacts available to activate.");
            return;
        }
        if (importCompleted < IMPORT_CHECKLIST.length) {
            setError("Complete the import station checklist before activation.");
            return;
        }
        const activatedIds = verifiedImports.map((entry) => String(entry.transferId));
        writeJson(ACTIVATED_ARTIFACTS_KEY, {
            activatedAt: new Date().toISOString(),
            transferIds: activatedIds,
        });
        setTransferChain((prev) => (Array.isArray(prev) ? prev.map((entry) => (
            activatedIds.includes(String(entry.transferId))
                ? { ...entry, quarantineState: "released" }
                : entry
        )) : prev));
        if (!locked && typeof onToggleLocked === "function") {
            onToggleLocked(true);
        }
        setStatus(`Activated ${activatedIds.length} verified artifact(s) for air-gapped runtime.`);
        setError("");
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[142] bg-black/60" onClick={onClose} />
            <section data-testid="airgap-operations-center" className="fixed inset-x-8 top-16 bottom-6 z-[143] rounded-2xl border border-slate-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.72)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-200 font-bold">Air-Gapped Operations Center</div>
                        <div className="text-[10px] font-mono text-slate-500">
                            Controlled import/export station with verification-first activation and sealed-network lock posture.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            data-testid="airgap-lock-toggle-btn"
                            onClick={() => {
                                if (typeof onToggleLocked === "function") onToggleLocked(!locked);
                            }}
                            className={`px-2.5 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[0.12em] ${
                                locked
                                    ? "border-slate-300/35 bg-slate-500/20 text-slate-100"
                                    : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                            }`}
                        >
                            {locked ? "AirGap Locked" : "Enable AirGap Lock"}
                        </button>
                        <button
                            type="button"
                            data-testid="airgap-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Import / Export Station</div>
                            <div className="text-[10px] text-slate-300">
                                Every inbound or outbound artifact must be recorded in the transfer chain with a verifiable signature/hash result.
                            </div>
                            <label className="inline-flex items-center px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100 cursor-pointer">
                                Ingest Signed Artifact
                                <input
                                    type="file"
                                    data-testid="airgap-import-input"
                                    accept=".json,application/json"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </label>
                            <button
                                type="button"
                                data-testid="airgap-activate-imports-btn"
                                onClick={handleActivateVerifiedImports}
                                disabled={busy}
                                className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100 disabled:opacity-60"
                            >
                                Activate Verified Imports
                            </button>
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                                    verified imports: {verifiedImports.length}
                                </div>
                                <div className="rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-200">
                                    quarantined imports: {quarantinedImports.length}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">
                                Import Checklist ({importCompleted}/{IMPORT_CHECKLIST.length})
                            </div>
                            {IMPORT_CHECKLIST.map((item) => (
                                <label key={item.id} className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(importChecklistState[item.id])}
                                        onChange={(event) => setImportChecklistState((prev) => ({ ...prev, [item.id]: Boolean(event.target.checked) }))}
                                    />
                                    <span>{item.label}</span>
                                </label>
                            ))}
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">
                                Export Checklist ({exportCompleted}/{EXPORT_CHECKLIST.length})
                            </div>
                            {EXPORT_CHECKLIST.map((item) => (
                                <label key={item.id} className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(exportChecklistState[item.id])}
                                        onChange={(event) => setExportChecklistState((prev) => ({ ...prev, [item.id]: Boolean(event.target.checked) }))}
                                    />
                                    <span>{item.label}</span>
                                </label>
                            ))}
                        </section>

                        <section className="rounded-xl border border-slate-300/25 bg-slate-500/10 p-3">
                            <div className="text-[10px] font-mono text-slate-300">
                                Network policy: <span className="text-slate-100 font-semibold">no hidden external network assumptions</span>
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-1">
                                Critical activation paths require explicit verification results and checklist completion before release.
                            </div>
                        </section>
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <section data-testid="airgap-transfer-ledger" className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Transfer Chain Ledger</div>
                                    <div className="text-[10px] text-slate-500 font-mono">Inspectable record of import/export artifacts crossing the air-gap station.</div>
                                </div>
                                <div className={`px-2 py-1 rounded border text-[9px] font-mono uppercase ${
                                    locked
                                        ? "border-slate-300/30 bg-slate-500/15 text-slate-100"
                                        : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                                }`}>
                                    {locked ? "locked" : "ready"}
                                </div>
                            </div>
                            <div className="max-h-96 overflow-auto pr-1 space-y-1.5">
                                {transferChain.map((entry) => (
                                    <article
                                        key={entry.transferId}
                                        className={`rounded-lg border px-2 py-1.5 ${
                                            entry.verified
                                                ? "border-emerald-300/30 bg-emerald-500/10"
                                                : "border-rose-300/40 bg-rose-500/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-[10px] font-mono text-slate-100">{entry.sourceName}</div>
                                            <div className="text-[9px] font-mono text-slate-400">{new Date(entry.at).toLocaleString()}</div>
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-300">
                                            {entry.direction} · {entry.artifactType} · {entry.classLabel}
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-500">
                                            schema {entry.schema} · {entry.verified ? "verified/released" : "quarantined"}
                                        </div>
                                    </article>
                                ))}
                                {transferChain.length === 0 && (
                                    <div className="text-[10px] font-mono text-slate-500">
                                        No transfer entries yet. Ingest a signed artifact to start the ledger.
                                    </div>
                                )}
                            </div>
                        </section>

                        {status && (
                            <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">
                                {status}
                            </div>
                        )}
                        {error && (
                            <div data-testid="airgap-import-error" className="rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
