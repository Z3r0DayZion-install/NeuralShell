import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_global_planning_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function GlobalPlanningConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [rows, setRows] = React.useState(() => (
        Array.isArray(initial.rows) && initial.rows.length
            ? initial.rows
            : [
                { region: "us-west", deploymentFit: 78, complianceFit: 73, channelFit: 71, supportCoverage: 74, operatorCapacity: 68 },
                { region: "us-east", deploymentFit: 70, complianceFit: 69, channelFit: 72, supportCoverage: 66, operatorCapacity: 63 },
                { region: "eu-west", deploymentFit: 65, complianceFit: 61, channelFit: 58, supportCoverage: 62, operatorCapacity: 57 },
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
            <div className="fixed inset-0 z-[212] bg-black/60" onClick={onClose} />
            <section data-testid="global-planning-console" className="fixed inset-x-6 top-14 bottom-4 z-[213] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Global Account & Region Planning</div>
                        <div className="text-[10px] font-mono text-slate-500">Region-fit overlays and phased global rollout planning.</div>
                    </div>
                    <button type="button" data-testid="global-planning-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Global planning rows">
                            {rows.map((entry) => (
                                <article key={entry.region} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.region}</div>
                                    <div className="text-[9px] font-mono text-slate-400">deploy {entry.deploymentFit} · compliance {entry.complianceFit}</div>
                                    <div className="text-[9px] font-mono text-slate-500">channel {entry.channelFit} · support {entry.supportCoverage} · operators {entry.operatorCapacity}</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="global-planning-tune-btn"
                            onClick={() => {
                                setRows((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, operatorCapacity: Math.min(Number(entry.operatorCapacity || 0) + 8, 100) }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Improve Lead Region Capacity
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            regions tracked {rows.length}
                        </div>
                        <button
                            type="button"
                            data-testid="global-planning-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    rows,
                                    phases: ["initial_focus", "pilot_clusters", "regional_scale", "federation_expansion"],
                                };
                                downloadJson("global_planning_pack.json", payload);
                                setStatus("Exported global planning pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Global Planning Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
