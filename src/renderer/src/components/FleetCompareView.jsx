import React from "react";

export default function FleetCompareView({
    selectedNodes = [],
    compareRows = [],
}) {
    const safeNodes = Array.isArray(selectedNodes) ? selectedNodes : [];
    const left = safeNodes[0] || null;
    const right = safeNodes[1] || null;

    return (
        <section data-testid="fleet-compare-view" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Compare Selected Nodes</div>
            {!left || !right ? (
                <div className="text-[10px] font-mono text-slate-500">Select exactly two nodes to compare.</div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div className="text-slate-500">Field</div>
                        <div className="text-slate-300">{String(left.displayName || left.nodeId)}</div>
                        <div className="text-slate-300">{String(right.displayName || right.nodeId)}</div>
                    </div>
                    <div className="max-h-52 overflow-auto space-y-1 pr-1">
                        {(Array.isArray(compareRows) ? compareRows : []).map((row) => (
                            <div key={row.key} className="grid grid-cols-3 gap-2 rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1.5 text-[10px] font-mono">
                                <div className="text-amber-100">{String(row.label || row.key)}</div>
                                <div className="text-slate-200 break-all">{String(row.left)}</div>
                                <div className="text-slate-200 break-all">{String(row.right)}</div>
                            </div>
                        ))}
                        {(!compareRows || compareRows.length === 0) && (
                            <div className="text-[10px] font-mono text-emerald-300">No meaningful differences across selected fields.</div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}