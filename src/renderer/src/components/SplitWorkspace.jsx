import React from "react";
import SnapshotManager from "./SnapshotManager.jsx";
import ResultPaneRouter from "./ResultPaneRouter.jsx";
import {
    captureRuntimeSnapshot,
    compareRuntimeSnapshots,
    restoreRuntimeSnapshot,
} from "../runtime/snapshots/stateSnapshot.ts";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

const STORAGE_KEY = "neuralshell_runtime_snapshots_v1";

function readSnapshots() {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeSnapshots(snapshots) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify((Array.isArray(snapshots) ? snapshots : []).slice(-120)));
}

export default function SplitWorkspace({
    open,
    onClose,
    runtimeState,
    onRestoreSnapshotPayload,
    alerts = [],
    proofStdout = "",
    releaseHealth = {},
}) {
    const [resultPaneId, setResultPaneId] = React.useState("runtime_snapshots");
    const [resultPayload, setResultPayload] = React.useState({});
    const [snapshots, setSnapshots] = React.useState(() => readSnapshots());
    const [activeSnapshotId, setActiveSnapshotId] = React.useState("");

    React.useEffect(() => {
        writeSnapshots(snapshots);
    }, [snapshots]);

    const capture = React.useCallback((name) => {
        const state = runtimeState && typeof runtimeState === "object" ? runtimeState : {};
        const snap = captureRuntimeSnapshot(name, {
            provider: String(state.providerHealth && state.providerHealth.activeProvider ? state.providerHealth.activeProvider : "ollama"),
            model: String(state.providerHealth && state.providerHealth.model ? state.providerHealth.model : "llama3"),
            vaultLocked: Boolean(state.vaultState && state.vaultState.locked),
            policyProfile: String(state.policyState && state.policyState.activePolicyProfile ? state.policyState.activePolicyProfile : "none"),
            proofStatus: String(state.proofEngine && state.proofEngine.lastProofStatus ? state.proofEngine.lastProofStatus : "idle"),
            activePanels: [String(resultPaneId || "runtime_snapshots")],
            collabRoom: String(state.collabVoiceState && state.collabVoiceState.currentRoom ? state.collabVoiceState.currentRoom : "default"),
            collabPeers: Number(state.collabVoiceState && state.collabVoiceState.peersActive ? state.collabVoiceState.peersActive : 0),
            selectedCards: ["provider", "vault", "proof", "policy", "watchdog"],
        });
        setSnapshots((prev) => [...prev, snap].slice(-120));
        setActiveSnapshotId(String(snap.id || ""));
        setResultPaneId("runtime_snapshots");
        setResultPayload(snap);
        appendRuntimeEvent("runtime.snapshot.captured", { snapshotId: snap.id, name: snap.name }, { source: "snapshots", severity: "info" });
        return snap;
    }, [resultPaneId, runtimeState]);

    const restore = React.useCallback((snapshotId) => {
        const snapshot = (snapshots || []).find((entry) => String(entry.id || "") === String(snapshotId || ""));
        if (!snapshot) return;
        const payload = restoreRuntimeSnapshot(snapshot);
        setActiveSnapshotId(String(snapshot.id || ""));
        if (typeof onRestoreSnapshotPayload === "function") {
            onRestoreSnapshotPayload(payload);
        }
        setResultPaneId("runtime_snapshots");
        setResultPayload(snapshot);
        appendRuntimeEvent("runtime.snapshot.restored", { snapshotId: snapshot.id, name: snapshot.name }, { source: "snapshots", severity: "info" });
    }, [onRestoreSnapshotPayload, snapshots]);

    const compare = React.useCallback((snapshotId) => {
        const current = (snapshots || []).find((entry) => String(entry.id || "") === String(activeSnapshotId || ""));
        const target = (snapshots || []).find((entry) => String(entry.id || "") === String(snapshotId || ""));
        if (!target) return;
        const rows = compareRuntimeSnapshots(current || null, target || null);
        setResultPaneId("snapshot_compare");
        setResultPayload({
            from: current ? current.name : "current-runtime",
            to: target.name,
            rows,
        });
        appendRuntimeEvent("runtime.snapshot.compared", {
            from: current ? current.id : "current-runtime",
            to: target.id,
            changedFields: rows.length,
        }, { source: "snapshots", severity: "info" });
    }, [activeSnapshotId, snapshots]);

    React.useEffect(() => {
        if (!open) return;
        if (resultPaneId === "watchdog_alerts") {
            setResultPayload(alerts);
        } else if (resultPaneId === "proof_stdout") {
            setResultPayload({ text: proofStdout || "" });
        } else if (resultPaneId === "release_health") {
            setResultPayload(releaseHealth || {});
        }
    }, [alerts, open, proofStdout, releaseHealth, resultPaneId]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[126] bg-black/60" onClick={onClose} />
            <section data-testid="split-workspace" className="fixed inset-x-6 top-18 bottom-6 z-[127] rounded-2xl border border-blue-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-blue-300 font-bold">Live Split Workspace</div>
                        <div className="text-[10px] font-mono text-slate-500">Left: command deck · Center: workflow context · Right: result pane + snapshots.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="split-workspace-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[250px_1fr_380px]">
                    <aside className="border-r border-white/10 p-3 space-y-2 bg-black/25">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Command Deck</div>
                        <button
                            type="button"
                            data-testid="split-pane-proof-btn"
                            onClick={() => setResultPaneId("proof_stdout")}
                            className="w-full text-left px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[10px] font-mono text-slate-200 hover:bg-white/10"
                        >
                            Proof Stdout
                        </button>
                        <button
                            type="button"
                            data-testid="split-pane-watchdog-btn"
                            onClick={() => setResultPaneId("watchdog_alerts")}
                            className="w-full text-left px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[10px] font-mono text-slate-200 hover:bg-white/10"
                        >
                            Watchdog Alerts
                        </button>
                        <button
                            type="button"
                            data-testid="split-pane-release-btn"
                            onClick={() => setResultPaneId("release_health")}
                            className="w-full text-left px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[10px] font-mono text-slate-200 hover:bg-white/10"
                        >
                            Release Health
                        </button>
                        <button
                            type="button"
                            data-testid="split-pane-snapshots-btn"
                            onClick={() => setResultPaneId("runtime_snapshots")}
                            className="w-full text-left px-2.5 py-2 rounded border border-white/10 bg-black/20 text-[10px] font-mono text-slate-200 hover:bg-white/10"
                        >
                            Runtime Snapshots
                        </button>
                    </aside>

                    <main className="p-3 overflow-auto space-y-3">
                        <section className="rounded-2xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Primary Workflow Context</div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-mono">
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
                                    <div className="text-slate-500">Provider</div>
                                    <div className="text-slate-100">{String(runtimeState && runtimeState.providerHealth && runtimeState.providerHealth.activeProvider ? runtimeState.providerHealth.activeProvider : "ollama")}</div>
                                </div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
                                    <div className="text-slate-500">Model</div>
                                    <div className="text-slate-100">{String(runtimeState && runtimeState.providerHealth && runtimeState.providerHealth.model ? runtimeState.providerHealth.model : "llama3")}</div>
                                </div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
                                    <div className="text-slate-500">Policy</div>
                                    <div className="text-slate-100">{String(runtimeState && runtimeState.policyState && runtimeState.policyState.activePolicyProfile ? runtimeState.policyState.activePolicyProfile : "none")}</div>
                                </div>
                                <div className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
                                    <div className="text-slate-500">Proof Status</div>
                                    <div className="text-slate-100">{String(runtimeState && runtimeState.proofEngine && runtimeState.proofEngine.lastProofStatus ? runtimeState.proofEngine.lastProofStatus : "idle")}</div>
                                </div>
                            </div>
                        </section>
                    </main>

                    <aside className="border-l border-white/10 p-3 overflow-auto space-y-3 bg-black/20">
                        <ResultPaneRouter
                            paneId={resultPaneId}
                            payload={resultPayload}
                        />
                        <SnapshotManager
                            snapshots={snapshots}
                            activeSnapshotId={activeSnapshotId}
                            onCapture={capture}
                            onRestore={restore}
                            onCompare={compare}
                        />
                    </aside>
                </div>
            </section>
        </>
    );
}

