import React from "react";
import UpdatePackManager from "./UpdatePackManager.jsx";
import UpdateRingConsole from "./UpdateRingConsole.jsx";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

export default function OfflineUpdateConsole({
    open,
    onClose,
    fleet,
}) {
    const [verifiedPack, setVerifiedPack] = React.useState(null);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[140] bg-black/60" onClick={onClose} />
            <section data-testid="offline-update-console" className="fixed inset-x-10 top-20 bottom-8 z-[141] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Offline Update Packs</div>
                        <div className="text-[10px] font-mono text-slate-500">Import verified packs, assign rings, and promote deliberately.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="offline-update-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3 p-3 overflow-auto">
                    <UpdatePackManager
                        onPackVerified={(pack) => {
                            setVerifiedPack(pack);
                            appendRuntimeEvent("update.pack.verified", {
                                version: String(pack && pack.payload && pack.payload.version ? pack.payload.version : "unknown"),
                                ring: String(pack && pack.payload && pack.payload.ring ? pack.payload.ring : "standard"),
                            }, { source: "updates", severity: "info" });
                        }}
                    />
                    <UpdateRingConsole
                        fleet={fleet}
                        verifiedPack={verifiedPack}
                        onAssignPack={(assignment) => {
                            if (!(fleet && typeof fleet.assignUpdatePack === "function")) return;
                            fleet.assignUpdatePack(assignment.nodeIds, {
                                packId: assignment.packId,
                                ring: assignment.ring,
                                version: assignment.version,
                            });
                            appendRuntimeEvent("update.pack.assigned", {
                                packId: assignment.packId,
                                ring: assignment.ring,
                                targets: assignment.nodeIds.length,
                            }, { source: "updates", severity: "info" });
                        }}
                    />
                </div>
            </section>
        </>
    );
}