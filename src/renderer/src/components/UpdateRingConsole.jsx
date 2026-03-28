import React from "react";

const RINGS = ["canary", "standard", "delayed", "locked"];

function summarizeByRing(nodes) {
    const safe = Array.isArray(nodes) ? nodes : [];
    return safe.reduce((acc, node) => {
        const ring = String(node && node.updateRing ? node.updateRing : "standard").toLowerCase();
        const key = RINGS.includes(ring) ? ring : "standard";
        acc[key] += 1;
        return acc;
    }, {
        canary: 0,
        standard: 0,
        delayed: 0,
        locked: 0,
    });
}

export default function UpdateRingConsole({
    fleet,
    verifiedPack,
    onAssignPack,
}) {
    const [targetRing, setTargetRing] = React.useState("canary");
    const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);

    const nodes = Array.isArray(fleet && fleet.nodes) ? fleet.nodes : [];
    const byRing = summarizeByRing(nodes);

    const toggleNode = (nodeId) => {
        const safe = String(nodeId || "");
        setSelectedNodeIds((prev) => (
            prev.includes(safe)
                ? prev.filter((entry) => entry !== safe)
                : [...prev, safe]
        ));
    };

    const assign = () => {
        if (!verifiedPack || !verifiedPack.payload) return;
        if (!selectedNodeIds.length) return;
        if (typeof onAssignPack === "function") {
            onAssignPack({
                nodeIds: selectedNodeIds,
                ring: targetRing,
                packId: String(verifiedPack.payload.packId || `pack-${verifiedPack.payload.version || "unknown"}`),
                version: String(verifiedPack.payload.version || "unknown"),
            });
        }
    };

    return (
        <section data-testid="update-ring-console" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Update Ring Console</div>
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
                {RINGS.map((ring) => (
                    <div key={ring} className="rounded border border-white/10 bg-black/30 px-1.5 py-1 text-slate-300">
                        {ring}: {byRing[ring]}
                    </div>
                ))}
            </div>

            <div className="text-[9px] font-mono text-slate-500">
                Verified pack required before assignment. Unverified packs cannot be applied.
            </div>

            <select
                data-testid="update-ring-target-select"
                value={targetRing}
                onChange={(event) => setTargetRing(event.target.value)}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
            >
                {RINGS.map((ring) => (
                    <option key={ring} value={ring}>{ring}</option>
                ))}
            </select>

            <div className="max-h-40 overflow-auto space-y-1 pr-1">
                {nodes.map((node) => (
                    <label key={node.nodeId} className="flex items-center gap-2 text-[9px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={selectedNodeIds.includes(node.nodeId)}
                            onChange={() => toggleNode(node.nodeId)}
                        />
                        {node.displayName} ({node.updateRing || "standard"})
                    </label>
                ))}
                {nodes.length === 0 && <div className="text-[9px] font-mono text-slate-500">No nodes available.</div>}
            </div>

            <button
                type="button"
                data-testid="update-ring-assign-btn"
                disabled={!verifiedPack || !verifiedPack.payload}
                onClick={assign}
                className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-50"
            >
                Assign Pack To Ring
            </button>
        </section>
    );
}