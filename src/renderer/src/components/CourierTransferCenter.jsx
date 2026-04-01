import React from "react";
import { readTextFile } from "../utils/recordIO.js";
import { stableStringify, verifyArtifactSignature } from "../utils/signedArtifacts.js";
import TransferLedgerView from "./TransferLedgerView.jsx";

const LEDGER_KEY = "neuralshell_courier_transfer_ledger_v1";

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

async function sha256Hex(text) {
    const bytes = new window.TextEncoder().encode(String(text || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

function toClassLabel(value) {
    const safe = String(value || "").trim().toLowerCase();
    if (safe === "standard" || safe === "sensitive" || safe === "sealed" || safe === "emergency") return safe;
    return "standard";
}

export default function CourierTransferCenter({
    open,
    onClose,
}) {
    const [ledgerEntries, setLedgerEntries] = React.useState(() => {
        const parsed = readJson(LEDGER_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [classLabel, setClassLabel] = React.useState("standard");
    const [status, setStatus] = React.useState("");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        writeJson(LEDGER_KEY, ledgerEntries);
    }, [ledgerEntries]);

    const importCourierPackage = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || "{}"));
            const payload = parsed && parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
            const signature = String(parsed && parsed.signature ? parsed.signature : "");
            const hash = String(parsed && parsed.hash ? parsed.hash : "").trim().toLowerCase();
            const publicKeyPem = String(parsed && parsed.signer && parsed.signer.publicKeyPem ? parsed.signer.publicKeyPem : "");
            if (!payload || !signature || !hash || !publicKeyPem) {
                throw new Error("Courier package missing payload/signature/hash/public key.");
            }
            const signatureValid = await verifyArtifactSignature(payload, signature, publicKeyPem);
            const computedHash = await sha256Hex(stableStringify(payload));
            const hashValid = computedHash === hash;
            if (!signatureValid || !hashValid) {
                throw new Error("Courier package failed verification and remains quarantined.");
            }
            const entry = {
                entryId: `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                packageId: String(payload.packageId || `package-${Date.now()}`),
                courierClass: toClassLabel(payload.courierClass || classLabel),
                sender: String(payload.sender || "sender-unset"),
                receiver: String(payload.receiver || "receiver-unset"),
                status: "quarantined",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                handoffs: [{
                    handoffId: `handoff-${Date.now()}`,
                    at: new Date().toISOString(),
                    actor: "import-station",
                    action: "imported",
                    detail: {
                        sourceFile: file.name,
                        artifactCount: Array.isArray(payload.artifacts) ? payload.artifacts.length : 0,
                    },
                }],
            };
            setLedgerEntries((prev) => [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 500));
            setStatus(`Courier package ${entry.packageId} quarantined pending receipt verification.`);
            setError("");
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            if (event && event.target) event.target.value = "";
        }
    };

    const verifyReceipt = (entryId) => {
        const safeId = String(entryId || "");
        if (!safeId) return;
        setLedgerEntries((prev) => (Array.isArray(prev) ? prev.map((entry) => {
            if (String(entry.entryId || "") !== safeId) return entry;
            const now = new Date().toISOString();
            return {
                ...entry,
                status: "verified",
                updatedAt: now,
                handoffs: [...(Array.isArray(entry.handoffs) ? entry.handoffs : []), {
                    handoffId: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    at: now,
                    actor: "receipt-station",
                    action: "verified",
                    detail: {},
                }].slice(-400),
            };
        }) : prev));
        setStatus(`Receipt verified for ${safeId}.`);
        setError("");
    };

    const releaseFromQuarantine = (entryId) => {
        const safeId = String(entryId || "");
        if (!safeId) return;
        const entry = (Array.isArray(ledgerEntries) ? ledgerEntries : []).find((item) => String(item.entryId || "") === safeId);
        if (!entry) return;
        if (String(entry.status || "") !== "verified") {
            setError("Release blocked: verify receipt before quarantine release.");
            return;
        }
        setLedgerEntries((prev) => (Array.isArray(prev) ? prev.map((row) => {
            if (String(row.entryId || "") !== safeId) return row;
            const now = new Date().toISOString();
            return {
                ...row,
                status: "released",
                updatedAt: now,
                handoffs: [...(Array.isArray(row.handoffs) ? row.handoffs : []), {
                    handoffId: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    at: now,
                    actor: "release-station",
                    action: "released",
                    detail: {},
                }].slice(-400),
            };
        }) : prev));
        setStatus(`Released package ${entry.packageId} from quarantine.`);
        setError("");
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[148] bg-black/60" onClick={onClose} />
            <section data-testid="courier-transfer-center" className="fixed inset-x-8 top-16 bottom-6 z-[149] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Offline Evidence Courier</div>
                        <div className="text-[10px] font-mono text-slate-500">Quarantine-first courier transfer chain for restricted environment handoffs.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="courier-transfer-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3 border-b border-white/10 flex items-center gap-2">
                    <select
                        data-testid="courier-class-select"
                        value={classLabel}
                        onChange={(event) => setClassLabel(toClassLabel(event.target.value))}
                        className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-100"
                    >
                        <option value="standard">standard</option>
                        <option value="sensitive">sensitive</option>
                        <option value="sealed">sealed</option>
                        <option value="emergency">emergency</option>
                    </select>
                    <label className="inline-flex items-center px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100 cursor-pointer">
                        Import Courier Package
                        <input
                            type="file"
                            data-testid="courier-import-input"
                            className="hidden"
                            accept=".json,application/json"
                            onChange={importCourierPackage}
                        />
                    </label>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-3">
                    <TransferLedgerView
                        entries={ledgerEntries}
                        onVerifyReceipt={verifyReceipt}
                        onReleaseFromQuarantine={releaseFromQuarantine}
                    />
                </div>

                {(status || error) && (
                    <div className="px-3 py-2 border-t border-white/10">
                        {status && (
                            <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">
                                {status}
                            </div>
                        )}
                        {error && (
                            <div data-testid="courier-error" className="mt-1 rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}
