import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_service_line_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function ServiceLineConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [rows, setRows] = React.useState(() => (
        Array.isArray(initial.rows) && initial.rows.length
            ? initial.rows
            : [
                { line: "deployment_services", staffedCapacity: 11, activeLoad: 8, utilizationPercent: 73 },
                { line: "training_delivery", staffedCapacity: 9, activeLoad: 6, utilizationPercent: 67 },
                { line: "support_operations", staffedCapacity: 14, activeLoad: 12, utilizationPercent: 86 },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows }));
    }, [rows]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[208] bg-black/60" onClick={onClose} />
            <section data-testid="service-line-console" className="fixed inset-x-6 top-14 bottom-4 z-[209] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Service Line Operating Layer</div>
                        <div className="text-[10px] font-mono text-slate-500">Capacity, utilization, and service-line delivery posture.</div>
                    </div>
                    <button type="button" data-testid="service-line-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Service line catalog">
                            {rows.map((entry) => (
                                <article key={entry.line} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.line}</div>
                                    <div className="text-[9px] font-mono text-slate-400">capacity {entry.staffedCapacity} · load {entry.activeLoad}</div>
                                    <div className="text-[9px] font-mono text-slate-500">utilization {entry.utilizationPercent}%</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="service-line-load-bump-btn"
                            onClick={() => {
                                setRows((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, activeLoad: Number(entry.activeLoad || 0) + 1, utilizationPercent: Math.min(Number(entry.utilizationPercent || 0) + 4, 100) }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Increase Lead Line Load
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-100">
                            high utilization lines {rows.filter((entry) => Number(entry.utilizationPercent || 0) >= 80).length}
                        </div>
                        <button
                            type="button"
                            data-testid="service-line-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    rows,
                                    localGrounded: true,
                                };
                                downloadJson("service_line_ops_pack.json", payload);
                                setStatus("Exported service line operations pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Service Ops Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
