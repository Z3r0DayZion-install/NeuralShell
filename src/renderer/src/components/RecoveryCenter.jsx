import React from "react";
import RestorePreview from "./RestorePreview.jsx";
import { downloadJson, readTextFile } from "../utils/recordIO.js";
import {
    getOrCreateSigningKeyPair,
    signArtifactPayload,
    verifyArtifactSignature,
    fingerprintPublicKey,
    stableStringify,
} from "../utils/signedArtifacts.js";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

const STORAGE_KEY = "neuralshell_recovery_last_bundle_v1";

async function sha256Hex(text) {
    const encoder = new window.TextEncoder();
    const bytes = encoder.encode(String(text || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

function collectCurrentState() {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const readJson = (key, fallback) => {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    };
    return {
        policyProfiles: readJson("neuralshell_policy_profiles_v1", []),
        nodechainRules: readJson("neuralshell_nodechain_rules_v1", []),
        runtimeSnapshots: readJson("neuralshell_runtime_snapshots_v1", []),
        operatorLayouts: {
            onboardingProgress: readJson("neuralshell_onboarding_progress_v1", {}),
            railLayout: readJson("neuralshell_rail_layout_prefs_v1", {}),
            railCollapse: readJson("neuralshell_rail_collapse_prefs_v1", {}),
        },
        releaseTruth: readJson("neuralshell_release_truth_cache_v1", {}),
        marketplaceReceipts: readJson("neuralshell_marketplace_receipts_v1", []),
        fleetConfig: readJson("neuralshell_fleet_nodes_v1", []),
        analyticsBundles: readJson("neuralshell_analytics_bundle_cache_v1", {}),
    };
}

function sanitize(value, includeSecrets) {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map((entry) => sanitize(entry, includeSecrets));
    if (typeof value !== "object") return value;
    const out = {};
    Object.entries(value).forEach(([key, entry]) => {
        const lower = String(key || "").toLowerCase();
        if (!includeSecrets && (lower.includes("token") || lower.includes("secret") || lower.includes("password") || lower.includes("passphrase") || lower.includes("apikey"))) {
            out[key] = "[excluded]";
            return;
        }
        out[key] = sanitize(entry, includeSecrets);
    });
    return out;
}

function pickScopes(source, selectedScopes) {
    const safeSource = source && typeof source === "object" ? source : {};
    const selected = Array.isArray(selectedScopes) ? selectedScopes : [];
    const out = {};
    selected.forEach((scope) => {
        if (Object.prototype.hasOwnProperty.call(safeSource, scope)) {
            out[scope] = safeSource[scope];
        }
    });
    return out;
}

function applyRestoreScopes(scopes, mode) {
    const safe = scopes && typeof scopes === "object" ? scopes : {};
    if (typeof window === "undefined" || !window.localStorage) return;

    const setJson = (key, value) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    };

    if (safe.policyProfiles) setJson("neuralshell_policy_profiles_v1", safe.policyProfiles);
    if (safe.nodechainRules) setJson("neuralshell_nodechain_rules_v1", safe.nodechainRules);
    if (safe.runtimeSnapshots) setJson("neuralshell_runtime_snapshots_v1", safe.runtimeSnapshots);
    if (safe.operatorLayouts && typeof safe.operatorLayouts === "object") {
        if (safe.operatorLayouts.onboardingProgress) setJson("neuralshell_onboarding_progress_v1", safe.operatorLayouts.onboardingProgress);
        if (safe.operatorLayouts.railLayout) setJson("neuralshell_rail_layout_prefs_v1", safe.operatorLayouts.railLayout);
        if (safe.operatorLayouts.railCollapse) setJson("neuralshell_rail_collapse_prefs_v1", safe.operatorLayouts.railCollapse);
    }
    if (safe.releaseTruth) setJson("neuralshell_release_truth_cache_v1", safe.releaseTruth);
    if (safe.marketplaceReceipts) setJson("neuralshell_marketplace_receipts_v1", safe.marketplaceReceipts);
    if (safe.fleetConfig) setJson("neuralshell_fleet_nodes_v1", safe.fleetConfig);
    if (safe.analyticsBundles) setJson("neuralshell_analytics_bundle_cache_v1", safe.analyticsBundles);

    if (mode === "safe" && window.api && window.api.settings && typeof window.api.settings.update === "function") {
        window.api.settings.update({
            offlineOnlyEnforced: true,
            allowRemoteBridge: false,
            autoUpdateChannel: "frozen",
        }).catch(() => undefined);
    }
}

export default function RecoveryCenter({
    open,
    onClose,
}) {
    const [scopeState, setScopeState] = React.useState({
        policyProfiles: true,
        nodechainRules: true,
        runtimeSnapshots: true,
        operatorLayouts: true,
        releaseTruth: true,
        marketplaceReceipts: true,
        fleetConfig: true,
        analyticsBundles: false,
    });
    const [includeSecrets, setIncludeSecrets] = React.useState(false);
    const [status, setStatus] = React.useState("");
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [importedBundle, setImportedBundle] = React.useState(null);
    const [verification, setVerification] = React.useState(null);
    const [restoreMode, setRestoreMode] = React.useState("full");

    const selectedScopes = React.useMemo(() => (
        Object.entries(scopeState)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([key]) => key)
    ), [scopeState]);

    const currentState = React.useMemo(() => collectCurrentState(), []);

    const generateBundle = async () => {
        setBusy(true);
        try {
            const source = collectCurrentState();
            const picked = pickScopes(source, selectedScopes);
            const payload = {
                schema: "neuralshell_recovery_bundle_v1",
                generatedAt: new Date().toISOString(),
                includeSecrets: Boolean(includeSecrets),
                scopes: sanitize(picked, Boolean(includeSecrets)),
            };
            const hash = await sha256Hex(stableStringify(payload));
            const keys = await getOrCreateSigningKeyPair("neuralshell_recovery_signing_v1");
            const signature = await signArtifactPayload(payload, keys.privateKeyPem);
            const signerFingerprint = await fingerprintPublicKey(keys.publicKeyPem);

            const signed = {
                schema: "neuralshell_recovery_bundle_signed_v1",
                payload,
                hash,
                signature,
                signer: {
                    publicKeyPem: keys.publicKeyPem,
                    fingerprint: signerFingerprint,
                },
            };

            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signed));
            }

            downloadJson(`neuralshell_recovery_bundle_${Date.now()}.signed.json`, signed);
            setStatus(`Recovery bundle exported (${selectedScopes.length} scope(s), signer ${signerFingerprint.slice(0, 24)}...).`);
            setError("");
            appendRuntimeEvent("recovery.bundle.exported", {
                scopes: selectedScopes,
                includeSecrets: Boolean(includeSecrets),
            }, { source: "recovery", severity: "info" });
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const importBundle = async (event) => {
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
                throw new Error("Bundle missing payload/signature/hash/public key.");
            }

            const signatureValid = await verifyArtifactSignature(payload, signature, publicKeyPem);
            const computedHash = await sha256Hex(stableStringify(payload));
            const hashValid = hash === computedHash;
            const result = {
                ok: Boolean(signatureValid && hashValid),
                signatureValid: Boolean(signatureValid),
                hashValid: Boolean(hashValid),
                hash,
                computedHash,
            };
            setImportedBundle(parsed);
            setVerification(result);
            if (!result.ok) {
                throw new Error("Bundle verification failed (signature/hash mismatch).");
            }

            setStatus(`Bundle verified from ${file.name}.`);
            setError("");
            appendRuntimeEvent("recovery.bundle.verified", {
                sourceName: file.name,
                signatureValid: result.signatureValid,
                hashValid: result.hashValid,
            }, { source: "recovery", severity: "info" });
        } catch (err) {
            setStatus("");
            setError(err && err.message ? err.message : String(err));
            setVerification(null);
        } finally {
            setBusy(false);
            if (event && event.target) event.target.value = "";
        }
    };

    const applyRestore = () => {
        if (!importedBundle || !verification || !verification.ok) {
            setError("Import and verify a signed bundle before restore.");
            return;
        }
        const scopes = importedBundle && importedBundle.payload && importedBundle.payload.scopes
            ? importedBundle.payload.scopes
            : {};
        applyRestoreScopes(scopes, restoreMode);
        setStatus(`Restore applied in ${restoreMode} mode.`);
        setError("");
        appendRuntimeEvent("recovery.restore.applied", {
            restoreMode,
            scopeKeys: Object.keys(scopes || {}),
        }, { source: "recovery", severity: restoreMode === "safe" ? "warning" : "info" });
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[130] bg-black/60" onClick={onClose} />
            <section data-testid="recovery-center" className="fixed inset-x-8 top-18 bottom-8 z-[131] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Recovery Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Signed backup/export, staged restore preview, and safe-mode recovery paths.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="recovery-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Backup Scope Selection</div>
                            {Object.keys(scopeState).map((key) => (
                                <label key={key} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(scopeState[key])}
                                        onChange={(event) => setScopeState((prev) => ({ ...prev, [key]: Boolean(event.target.checked) }))}
                                    />
                                    {key}
                                </label>
                            ))}
                            <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={includeSecrets}
                                    onChange={(event) => setIncludeSecrets(Boolean(event.target.checked))}
                                />
                                Include secrets (dangerous)
                            </label>
                            {includeSecrets && (
                                <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-200">
                                    Secret export is enabled. Use only for isolated sealed transfers.
                                </div>
                            )}
                            <button
                                type="button"
                                data-testid="recovery-export-btn"
                                disabled={busy}
                                onClick={generateBundle}
                                className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-60"
                            >
                                {busy ? "Working..." : "Export Signed Bundle"}
                            </button>
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Restore Bundle</div>
                            <label className="inline-flex items-center px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100 cursor-pointer">
                                Import Signed Bundle
                                <input
                                    type="file"
                                    data-testid="recovery-import-input"
                                    accept=".json,application/json"
                                    className="hidden"
                                    onChange={importBundle}
                                />
                            </label>
                            <div className="space-y-1 text-[10px] font-mono">
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input
                                        type="radio"
                                        name="restore-mode"
                                        value="full"
                                        checked={restoreMode === "full"}
                                        onChange={() => setRestoreMode("full")}
                                    />
                                    Full restore
                                </label>
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input
                                        type="radio"
                                        name="restore-mode"
                                        value="partial"
                                        checked={restoreMode === "partial"}
                                        onChange={() => setRestoreMode("partial")}
                                    />
                                    Partial restore
                                </label>
                                <label className="flex items-center gap-2 text-slate-300">
                                    <input
                                        type="radio"
                                        name="restore-mode"
                                        value="safe"
                                        checked={restoreMode === "safe"}
                                        onChange={() => setRestoreMode("safe")}
                                    />
                                    Safe-mode restore
                                </label>
                            </div>

                            <button
                                type="button"
                                data-testid="recovery-apply-btn"
                                onClick={applyRestore}
                                className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-100"
                            >
                                Apply Restore
                            </button>
                        </section>

                        {verification && (
                            <section data-testid="recovery-verify-result" className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] font-mono space-y-1">
                                <div className={verification.ok ? "text-emerald-300" : "text-rose-300"}>
                                    {verification.ok ? "PASS" : "FAIL"}
                                </div>
                                <div className="text-slate-400">Signature: {verification.signatureValid ? "valid" : "invalid"}</div>
                                <div className="text-slate-400">Hash: {verification.hashValid ? "valid" : "invalid"}</div>
                            </section>
                        )}

                        {status && <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">{status}</div>}
                        {error && <div className="rounded border border-rose-300/35 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-200">{error}</div>}
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <RestorePreview
                            currentState={currentState}
                            incomingState={importedBundle && importedBundle.payload && importedBundle.payload.scopes ? importedBundle.payload.scopes : {}}
                        />
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Staged Restore Notes</div>
                            <div className="text-[10px] font-mono text-slate-400">
                                Restore is blocked unless signature + hash both verify. Safe mode forces offline-only and frozen update ring before applying payload scopes.
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}