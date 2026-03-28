import React from "react";
import { readTextFile } from "../utils/recordIO.js";
import { verifyArtifactSignature } from "../utils/signedArtifacts.js";
import PolicyDiffPanel from "./PolicyDiffPanel.jsx";
import RollbackHistoryView from "./RollbackHistoryView.jsx";

function buildDiffRows(nodes, targetIds, policyProfile) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeTargetIds = Array.isArray(targetIds) ? targetIds : [];
    const previewNode = safeNodes.find((node) => safeTargetIds.includes(node.nodeId));
    const before = previewNode ? String(previewNode.policyProfile || "none") : "none";
    const after = String(policyProfile || "none");
    if (before === after) return [];
    return [{ key: "policyProfile", before, after }];
}

export default function PolicyRolloutConsole({
    open,
    onClose,
    fleet,
    history = [],
    onApplyRollout,
    onRollbackRollout,
}) {
    const [bundleStatus, setBundleStatus] = React.useState("");
    const [bundleError, setBundleError] = React.useState("");
    const [verifiedBundle, setVerifiedBundle] = React.useState(null);
    const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);
    const [mode, setMode] = React.useState("immediate");
    const [scheduledFor, setScheduledFor] = React.useState("");

    const nodes = Array.isArray(fleet && fleet.nodes) ? fleet.nodes : [];
    const policyProfile = String(
        verifiedBundle && verifiedBundle.payload && (verifiedBundle.payload.policyProfile || verifiedBundle.payload.label || verifiedBundle.payload.policyId)
            ? (verifiedBundle.payload.policyProfile || verifiedBundle.payload.label || verifiedBundle.payload.policyId)
            : "",
    );

    const diffRows = React.useMemo(() => buildDiffRows(nodes, selectedNodeIds, policyProfile), [nodes, policyProfile, selectedNodeIds]);

    const importSignedBundle = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || "{}"));
            const payload = parsed && parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
            const signature = String(parsed && parsed.signature ? parsed.signature : "");
            const publicKeyPem = String(parsed && parsed.signer && parsed.signer.publicKeyPem ? parsed.signer.publicKeyPem : "");
            if (!payload || !signature || !publicKeyPem) {
                throw new Error("Signed bundle requires payload/signature/public key.");
            }
            const signatureValid = await verifyArtifactSignature(payload, signature, publicKeyPem);
            if (!signatureValid) {
                throw new Error("Unsigned or invalid policy bundle rejected.");
            }
            setVerifiedBundle(parsed);
            setBundleStatus(`Verified policy bundle: ${String(payload.policyProfile || payload.label || payload.policyId || "policy")}`);
            setBundleError("");
        } catch (err) {
            setVerifiedBundle(null);
            setBundleStatus("");
            setBundleError(err && err.message ? err.message : String(err));
        } finally {
            if (event && event.target) event.target.value = "";
        }
    };

    const toggleNode = (nodeId) => {
        const safe = String(nodeId || "");
        setSelectedNodeIds((prev) => (
            prev.includes(safe)
                ? prev.filter((entry) => entry !== safe)
                : [...prev, safe]
        ));
    };

    const applyRollout = () => {
        if (!verifiedBundle) {
            setBundleError("Load a verified signed bundle first.");
            return;
        }
        if (!selectedNodeIds.length) {
            setBundleError("Select at least one node.");
            return;
        }
        if (typeof onApplyRollout === "function") {
            onApplyRollout({
                bundle: verifiedBundle,
                nodeIds: selectedNodeIds,
                mode,
                scheduledFor,
            });
            setBundleError("");
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[138] bg-black/60" onClick={onClose} />
            <section data-testid="policy-rollout-console" className="fixed inset-x-8 top-20 bottom-8 z-[139] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Policy Rollout Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Signed policy rollout preview, apply, verify, and rollback history.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="policy-rollout-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Signed Bundle Input</div>
                            <label className="inline-flex items-center px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100 cursor-pointer">
                                Import Signed Policy
                                <input
                                    data-testid="policy-rollout-import-input"
                                    type="file"
                                    accept=".json,application/json"
                                    className="hidden"
                                    onChange={importSignedBundle}
                                />
                            </label>
                            {bundleStatus && <div className="text-[10px] font-mono text-emerald-200">{bundleStatus}</div>}
                            {bundleError && <div data-testid="policy-rollout-error" className="text-[10px] font-mono text-rose-200">{bundleError}</div>}
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Target Nodes</div>
                            <div className="max-h-40 overflow-auto space-y-1 pr-1">
                                {nodes.map((node) => (
                                    <label key={node.nodeId} className="flex items-center gap-2 text-[9px] font-mono text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedNodeIds.includes(node.nodeId)}
                                            onChange={() => toggleNode(node.nodeId)}
                                        />
                                        {node.displayName}
                                    </label>
                                ))}
                                {nodes.length === 0 && <div className="text-[9px] font-mono text-slate-500">No fleet nodes available.</div>}
                            </div>
                            <div className="space-y-1 text-[10px] font-mono text-slate-300">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={mode === "immediate"}
                                        onChange={() => setMode("immediate")}
                                    />
                                    Immediate apply
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={mode === "scheduled"}
                                        onChange={() => setMode("scheduled")}
                                    />
                                    Schedule rollout
                                </label>
                                {mode === "scheduled" && (
                                    <input
                                        data-testid="policy-rollout-scheduled-input"
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(event) => setScheduledFor(event.target.value)}
                                        className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                data-testid="policy-rollout-apply-btn"
                                onClick={applyRollout}
                                className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100"
                            >
                                Apply Rollout
                            </button>
                        </section>
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <PolicyDiffPanel rows={diffRows} />
                        <RollbackHistoryView
                            history={history}
                            onRollback={(entry) => {
                                if (typeof onRollbackRollout === "function") onRollbackRollout(entry);
                            }}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}