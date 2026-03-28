import React from "react";

function toneByHealth(health) {
    const safe = String(health || "degraded").toLowerCase();
    if (safe === "healthy") return "border-emerald-300/35 bg-emerald-500/10 text-emerald-100";
    if (safe === "critical") return "border-rose-300/40 bg-rose-500/10 text-rose-100";
    if (safe === "offline") return "border-slate-300/30 bg-slate-500/10 text-slate-200";
    return "border-amber-300/35 bg-amber-500/10 text-amber-100";
}

function formatAt(iso) {
    const safe = String(iso || "").trim();
    if (!safe) return "n/a";
    const parsed = new Date(safe);
    if (Number.isNaN(parsed.getTime())) return safe;
    return parsed.toLocaleString();
}

export default function FleetNodeCard({
    node,
    selected,
    onToggleSelect,
    onRemove,
    onOpenFeed,
}) {
    const safe = node && typeof node === "object" ? node : {};
    const nodeId = String(safe.nodeId || "unknown-node");
    return (
        <article
            data-testid={`fleet-node-card-${nodeId}`}
            aria-label={`Fleet node ${nodeId}`}
            className={`rounded-xl border p-3 ${toneByHealth(safe.runtimeHealth)} transition-colors`}
        >
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] opacity-85">{String(safe.displayName || nodeId)}</div>
                    <div className="text-[9px] font-mono opacity-70">{nodeId}</div>
                </div>
                <label className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.12em]">
                    <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => onToggleSelect(nodeId)}
                        aria-label={`Select node ${nodeId} for compare`}
                    />
                    Compare
                </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[9px] font-mono">
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Provider: <span className="text-slate-100">{String(safe.providerHealth || "unknown")}</span>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Proof: <span className="text-slate-100">{String(safe.proofStatus || "unknown")}</span>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Policy: <span className="text-slate-100">{String(safe.policyProfile || "none")}</span>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Version: <span className="text-slate-100">{String(safe.updateVersion || "unknown")}</span>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Relay: <span className="text-slate-100">{String(safe.relayStatus || "unknown")}</span>
                </div>
                <div className="rounded border border-white/10 bg-black/20 px-1.5 py-1">
                    Collab: <span className="text-slate-100">{String(safe.collabState || "unknown")}</span>
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] font-mono opacity-80">
                <span>Seen {formatAt(safe.lastSeenAt)}</span>
                <span>{Array.isArray(safe.alerts) ? safe.alerts.length : 0} alert(s)</span>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
                <button
                    type="button"
                    data-testid={`fleet-open-feed-${nodeId}`}
                    onClick={() => onOpenFeed(nodeId)}
                    className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                >
                    Event Feed
                </button>
                <button
                    type="button"
                    data-testid={`fleet-remove-node-${nodeId}`}
                    onClick={() => onRemove(nodeId)}
                    className="px-2 py-1 rounded border border-rose-300/35 bg-rose-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-rose-100"
                >
                    Remove
                </button>
            </div>
        </article>
    );
}