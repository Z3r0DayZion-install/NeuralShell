import React from "react";

function severityTone(severity) {
    const safe = String(severity || "info").toLowerCase();
    if (safe === "critical") return "border-rose-300/40 bg-rose-500/10 text-rose-100";
    if (safe === "degraded") return "border-amber-300/40 bg-amber-500/10 text-amber-100";
    if (safe === "warning") return "border-amber-300/30 bg-amber-500/10 text-amber-100";
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-100";
}

export default function RuntimeAlertsDrawer({
    open,
    alerts = [],
    onClose,
    onAcknowledge,
}) {
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 z-[124] bg-black/50" onClick={onClose} />
            <aside
                data-testid="runtime-alerts-drawer"
                aria-label="Runtime Alerts"
                className="fixed right-4 top-16 bottom-4 z-[125] w-[440px] rounded-2xl border border-amber-300/30 bg-slate-950 shadow-[0_18px_80px_rgba(0,0,0,0.7)] flex flex-col"
            >
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-amber-300 font-bold">Runtime Watchdog Alerts</div>
                        <div className="text-[10px] font-mono text-slate-500">Sticky failures remain visible until acknowledged.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="runtime-alerts-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
                    {(Array.isArray(alerts) ? alerts : []).map((alert) => (
                        <article key={alert.id} className={`rounded-xl border p-3 ${severityTone(alert.severity)}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[10px] font-mono uppercase tracking-[0.14em]">{String(alert.source || "watchdog")}</div>
                                <div className="text-[9px] font-mono uppercase tracking-[0.14em]">{String(alert.severity || "info")}</div>
                            </div>
                            <div className="text-[10px] font-mono mt-1">{String(alert.message || "")}</div>
                            <div className="text-[9px] font-mono opacity-90 mt-1">{String(alert.suggestedAction || "")}</div>
                            <div className="text-[9px] font-mono text-slate-300 mt-1">
                                {String(alert.at || "")}{alert.recoveredAt ? ` · recovered ${alert.recoveredAt}` : ""}
                            </div>
                            <div className="mt-2 flex items-center justify-end">
                                <button
                                    type="button"
                                    data-testid={`runtime-alert-ack-${alert.id}`}
                                    onClick={() => onAcknowledge(alert.id)}
                                    className="px-2 py-1 rounded border border-white/20 bg-black/25 text-[9px] font-mono uppercase tracking-[0.12em]"
                                >
                                    {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                                </button>
                            </div>
                        </article>
                    ))}
                    {(!alerts || alerts.length === 0) && (
                        <div className="text-[10px] font-mono text-slate-500">No active watchdog alerts.</div>
                    )}
                </div>
            </aside>
        </>
    );
}

