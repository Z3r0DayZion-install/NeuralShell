import React from "react";
import FleetNodeCard from "./FleetNodeCard.jsx";
import FleetCompareView from "./FleetCompareView.jsx";

function summaryPill(label, value, tone) {
    return (
        <div className={`rounded border px-2 py-1 text-[10px] font-mono ${tone}`}>
            <span className="opacity-80">{label}</span>
            <span className="ml-1 font-bold">{value}</span>
        </div>
    );
}

export default function FleetControlPanel({
    open,
    onClose,
    fleet,
    onImportLocalRuntime,
}) {
    const [importError, setImportError] = React.useState("");
    const [importInfo, setImportInfo] = React.useState("");
    const [activeFeedNodeId, setActiveFeedNodeId] = React.useState("");

    if (!open) return null;

    const safeFleet = fleet && typeof fleet === "object" ? fleet : {};
    const nodes = Array.isArray(safeFleet.filteredNodes) ? safeFleet.filteredNodes : [];
    const allNodes = Array.isArray(safeFleet.nodes) ? safeFleet.nodes : [];
    const summary = safeFleet.healthSummary || { total: 0, healthy: 0, degraded: 0, critical: 0, offline: 0 };
    const activeFeedNode = allNodes.find((node) => String(node.nodeId || "") === String(activeFeedNodeId || "")) || null;

    const importFromFile = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const imported = await safeFleet.importFleetFile(file);
            setImportInfo(`Imported ${imported} node(s) from ${file.name}.`);
            setImportError("");
        } catch (err) {
            setImportInfo("");
            setImportError(err && err.message ? err.message : String(err));
        } finally {
            if (event && event.target) event.target.value = "";
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[128] bg-black/60" onClick={onClose} />
            <section
                data-testid="fleet-control-panel"
                aria-label="Fleet Control Panel"
                className="fixed inset-x-6 top-16 bottom-6 z-[129] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.72)] overflow-hidden flex flex-col"
            >
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Fleet Control Panel</div>
                        <div className="text-[10px] font-mono text-slate-500">Offline-first multi-node view from imported bundles and local runtime snapshots.</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="px-2 py-1 rounded border border-cyan-300/35 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100 cursor-pointer">
                            Import Bundle
                            <input
                                data-testid="fleet-import-input"
                                type="file"
                                accept=".json,.csv,application/json,text/csv"
                                className="hidden"
                                onChange={importFromFile}
                            />
                        </label>
                        <button
                            type="button"
                            data-testid="fleet-import-runtime-btn"
                            onClick={() => {
                                if (typeof onImportLocalRuntime === "function") {
                                    const importedNode = onImportLocalRuntime();
                                    if (importedNode) {
                                        setImportInfo(`Imported local runtime node: ${importedNode.displayName}.`);
                                        setImportError("");
                                    }
                                }
                            }}
                            className="px-2 py-1 rounded border border-blue-300/35 bg-blue-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-blue-100"
                        >
                            Import Local Node
                        </button>
                        <button
                            type="button"
                            data-testid="fleet-clear-btn"
                            onClick={() => safeFleet.clearFleet()}
                            className="px-2 py-1 rounded border border-rose-300/35 bg-rose-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-rose-100"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            data-testid="fleet-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2 border-b border-white/10 bg-black/20 flex flex-wrap items-center gap-2">
                    {summaryPill("Total", summary.total, "border-white/15 bg-black/25 text-slate-200")}
                    {summaryPill("Healthy", summary.healthy, "border-emerald-300/35 bg-emerald-500/10 text-emerald-100")}
                    {summaryPill("Degraded", summary.degraded, "border-amber-300/35 bg-amber-500/10 text-amber-100")}
                    {summaryPill("Critical", summary.critical, "border-rose-300/35 bg-rose-500/10 text-rose-100")}
                    {summaryPill("Offline", summary.offline, "border-slate-300/30 bg-slate-500/10 text-slate-200")}

                    <div className="ml-auto inline-flex rounded border border-white/10 bg-black/30 overflow-hidden">
                        {[
                            { id: "all", label: "All" },
                            { id: "healthy", label: "Healthy" },
                            { id: "degraded", label: "Degraded" },
                            { id: "critical", label: "Critical" },
                            { id: "offline", label: "Offline" },
                        ].map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                data-testid={`fleet-filter-${entry.id}`}
                                onClick={() => safeFleet.setStatusFilter(entry.id)}
                                className={`px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] border-l border-white/10 first:border-l-0 ${
                                    String(safeFleet.statusFilter || "all") === entry.id
                                        ? "bg-cyan-500/20 text-cyan-100"
                                        : "text-slate-300 hover:bg-white/10"
                                }`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                </div>

                {(importInfo || importError) && (
                    <div className="px-4 py-2 border-b border-white/10 bg-black/15">
                        {importInfo && (
                            <div data-testid="fleet-import-info" className="text-[10px] font-mono text-emerald-200">{importInfo}</div>
                        )}
                        {importError && (
                            <div data-testid="fleet-import-error" className="text-[10px] font-mono text-rose-200">{importError}</div>
                        )}
                    </div>
                )}

                <div className="flex-1 min-h-0 grid grid-cols-[1.1fr_0.9fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 flex flex-col">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold mb-2">Node List ({nodes.length})</div>
                        <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-2" data-testid="fleet-node-list">
                            {nodes.map((node) => (
                                <FleetNodeCard
                                    key={node.nodeId}
                                    node={node}
                                    selected={Array.isArray(safeFleet.selectedNodeIds) && safeFleet.selectedNodeIds.includes(node.nodeId)}
                                    onToggleSelect={safeFleet.toggleNodeSelected}
                                    onRemove={safeFleet.removeNode}
                                    onOpenFeed={setActiveFeedNodeId}
                                />
                            ))}
                            {nodes.length === 0 && (
                                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-[10px] font-mono text-slate-500">
                                    No nodes loaded. Import JSON/CSV bundles or pull the local runtime.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <FleetCompareView
                            selectedNodes={safeFleet.selectedNodes || []}
                            compareRows={safeFleet.compareRows || []}
                        />

                        <section data-testid="fleet-node-event-feed" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Node Event Feed</div>
                                <select
                                    data-testid="fleet-event-node-select"
                                    value={activeFeedNodeId}
                                    onChange={(event) => setActiveFeedNodeId(event.target.value)}
                                    className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                                >
                                    <option value="">Select node</option>
                                    {allNodes.map((node) => (
                                        <option key={node.nodeId} value={node.nodeId}>{node.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            {activeFeedNode ? (
                                <div className="max-h-64 overflow-auto space-y-1 pr-1">
                                    {(Array.isArray(activeFeedNode.events) ? activeFeedNode.events : []).slice(-80).reverse().map((event) => (
                                        <article key={event.id} className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
                                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                                <span className="text-slate-200">{String(event.type || "fleet.event")}</span>
                                                <span className="text-slate-500">{String(event.at || "")}</span>
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-500">{String(event.source || "fleet")} · {String(event.severity || "info")}</div>
                                        </article>
                                    ))}
                                    {(!activeFeedNode.events || activeFeedNode.events.length === 0) && (
                                        <div className="text-[10px] font-mono text-slate-500">No events for this node yet.</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] font-mono text-slate-500">Choose a node to inspect its timeline.</div>
                            )}
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}