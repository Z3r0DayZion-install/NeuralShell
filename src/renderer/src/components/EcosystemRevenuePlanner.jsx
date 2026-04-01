import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_ecosystem_revenue_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function EcosystemRevenuePlanner({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [rows, setRows] = React.useState(() => (
        Array.isArray(initial.rows) && initial.rows.length
            ? initial.rows
            : [
                { line: "product_core", revenueSharePercent: 34, marginProxyPercent: 56, supportLoadOverlay: 38 },
                { line: "appliance", revenueSharePercent: 18, marginProxyPercent: 48, supportLoadOverlay: 44 },
                { line: "managed_services", revenueSharePercent: 21, marginProxyPercent: 43, supportLoadOverlay: 62 },
                { line: "training", revenueSharePercent: 14, marginProxyPercent: 64, supportLoadOverlay: 29 },
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
            <div className="fixed inset-0 z-[214] bg-black/60" onClick={onClose} />
            <section data-testid="ecosystem-revenue-planner" className="fixed inset-x-6 top-14 bottom-4 z-[215] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Revenue Mix Planner</div>
                        <div className="text-[10px] font-mono text-slate-500">Revenue line mix, margin proxy, and support-load overlays.</div>
                    </div>
                    <button type="button" data-testid="ecosystem-revenue-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Ecosystem revenue rows">
                            {rows.map((entry) => (
                                <article key={entry.line} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.line}</div>
                                    <div className="text-[9px] font-mono text-slate-400">share {entry.revenueSharePercent}% · margin proxy {entry.marginProxyPercent}%</div>
                                    <div className="text-[9px] font-mono text-slate-500">support load {entry.supportLoadOverlay}%</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-revenue-adjust-btn"
                            onClick={() => {
                                setRows((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, revenueSharePercent: Number(entry.revenueSharePercent || 0) + 2 }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Adjust Lead Line Share
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-100">
                            high support load lines {rows.filter((entry) => Number(entry.supportLoadOverlay || 0) >= 55).length}
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-revenue-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    rows,
                                    falsePrecisionAvoided: true,
                                };
                                downloadJson("ecosystem_revenue_pack.json", payload);
                                setStatus("Exported ecosystem revenue mix pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Revenue Mix Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
