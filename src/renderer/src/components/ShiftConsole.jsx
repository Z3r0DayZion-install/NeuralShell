import React from "react";
import RoleSwitcher from "./RoleSwitcher.jsx";
import { downloadJson } from "../utils/recordIO.js";
import {
    getOrCreateSigningKeyPair,
    signArtifactPayload,
    fingerprintPublicKey,
    stableStringify,
} from "../utils/signedArtifacts.js";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

const SHIFT_STATE_KEY = "neuralshell_shift_console_v1";

function readState() {
    if (typeof window === "undefined" || !window.localStorage) return { notes: "", queueDepth: 0, pendingActions: [] };
    try {
        const parsed = JSON.parse(window.localStorage.getItem(SHIFT_STATE_KEY) || "{}");
        return {
            notes: String(parsed && parsed.notes ? parsed.notes : ""),
            queueDepth: Number.isFinite(Number(parsed && parsed.queueDepth)) ? Number(parsed.queueDepth) : 0,
            pendingActions: Array.isArray(parsed && parsed.pendingActions) ? parsed.pendingActions : [],
        };
    } catch {
        return { notes: "", queueDepth: 0, pendingActions: [] };
    }
}

async function sha256Hex(text) {
    const encoder = new window.TextEncoder();
    const bytes = encoder.encode(String(text || ""));
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

export default function ShiftConsole({
    open,
    onClose,
    role,
    onChangeRole,
    fleetNodes = [],
    incidents = [],
}) {
    const [state, setState] = React.useState(() => readState());
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(SHIFT_STATE_KEY, JSON.stringify(state));
    }, [state]);

    const exportShiftSummary = async () => {
        const assignedNodes = Array.isArray(fleetNodes) ? fleetNodes.slice(0, 10).map((node) => node.nodeId) : [];
        const payload = {
            schema: "neuralshell_shift_summary_v1",
            generatedAt: new Date().toISOString(),
            activeRole: role,
            queueDepth: Number(state.queueDepth || 0),
            pendingActions: Array.isArray(state.pendingActions) ? state.pendingActions : [],
            handoffNotes: String(state.notes || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
            incidents: Array.isArray(incidents) ? incidents.slice(-20) : [],
            assignedNodes,
        };
        const keys = await getOrCreateSigningKeyPair("neuralshell_shift_signing_v1");
        const signature = await signArtifactPayload(payload, keys.privateKeyPem);
        const hash = await sha256Hex(stableStringify(payload));
        const signerFingerprint = await fingerprintPublicKey(keys.publicKeyPem);
        downloadJson(`neuralshell_shift_summary_${Date.now()}.signed.json`, {
            schema: "neuralshell_shift_summary_signed_v1",
            payload,
            hash,
            signature,
            signer: {
                publicKeyPem: keys.publicKeyPem,
                fingerprint: signerFingerprint,
            },
        });
        appendRuntimeEvent("shift.summary.exported", {
            role,
            queueDepth: payload.queueDepth,
            assignedNodes: assignedNodes.length,
        }, { source: "shift", severity: "info" });
        setStatus(`Signed shift summary exported (${signerFingerprint.slice(0, 24)}...).`);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[134] bg-black/60" onClick={onClose} />
            <section data-testid="shift-console" className="fixed inset-x-10 top-20 bottom-8 z-[135] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Shift Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Operator handoff, queue posture, and signed summary export.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="shift-console-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <RoleSwitcher role={role} onChange={onChangeRole} />
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Shift Queue</div>
                            <label className="text-[10px] font-mono text-slate-300 block">
                                Queue Depth
                                <input
                                    data-testid="shift-queue-depth-input"
                                    type="number"
                                    min="0"
                                    value={state.queueDepth}
                                    onChange={(event) => setState((prev) => ({ ...prev, queueDepth: Math.max(0, Number(event.target.value || 0)) }))}
                                    className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1"
                                />
                            </label>
                            <button
                                type="button"
                                data-testid="shift-add-pending-action-btn"
                                onClick={() => setState((prev) => ({
                                    ...prev,
                                    pendingActions: [...(prev.pendingActions || []), `action-${Date.now()}`],
                                }))}
                                className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                            >
                                Add Pending Action
                            </button>
                            <div className="max-h-36 overflow-auto space-y-1 pr-1">
                                {(state.pendingActions || []).map((item, index) => (
                                    <div key={`${item}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-300 break-all">
                                        {item}
                                    </div>
                                ))}
                                {(!state.pendingActions || state.pendingActions.length === 0) && (
                                    <div className="text-[9px] font-mono text-slate-500">No pending actions.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Handoff Notes</div>
                            <textarea
                                data-testid="shift-handoff-notes-input"
                                value={state.notes}
                                onChange={(event) => setState((prev) => ({ ...prev, notes: event.target.value }))}
                                className="w-full min-h-36 rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                                placeholder="Capture next shift context, blockers, and known risks..."
                            />
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Assigned Nodes / Incidents</div>
                            <div className="text-[10px] font-mono text-slate-400">Assigned nodes: {Array.isArray(fleetNodes) ? fleetNodes.length : 0}</div>
                            <div className="text-[10px] font-mono text-slate-400">Open incidents: {Array.isArray(incidents) ? incidents.length : 0}</div>
                        </section>

                        <button
                            type="button"
                            data-testid="shift-export-summary-btn"
                            onClick={exportShiftSummary}
                            className="px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100"
                        >
                            Export Signed Shift Summary
                        </button>

                        {status && (
                            <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">{status}</div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}