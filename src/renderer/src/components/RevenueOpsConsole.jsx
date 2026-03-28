import React from "react";
import RevenueCohortView from "./RevenueCohortView.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_revenue_ops_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function RevenueOpsConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [pipeline, setPipeline] = React.useState(() => (
        Array.isArray(initial.pipeline) && initial.pipeline.length
            ? initial.pipeline
            : [
                { stage: "evaluation", accounts: 5, estimatedValueUsd: 145000 },
                { stage: "security_review", accounts: 4, estimatedValueUsd: 178000 },
                { stage: "pilot", accounts: 3, estimatedValueUsd: 126000 },
                { stage: "procurement", accounts: 2, estimatedValueUsd: 98000 },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pipeline }));
    }, [pipeline]);

    if (!open) return null;

    const totalPipeline = pipeline.reduce((acc, row) => acc + Number(row.estimatedValueUsd || 0), 0);

    return (
        <>
            <div className="fixed inset-0 z-[198] bg-black/60" onClick={onClose} />
            <section data-testid="revenue-ops-console" className="fixed inset-x-6 top-14 bottom-4 z-[199] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Revenue Operations Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Pipeline-to-revenue, SKU mix, and expansion vs renewal signal view.</div>
                    </div>
                    <button type="button" data-testid="revenue-ops-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <RevenueCohortView cohorts={pipeline} />
                        <button
                            type="button"
                            data-testid="revenue-ops-advance-btn"
                            onClick={() => {
                                setPipeline((prev) => prev.map((row, index) => (
                                    index !== 0 ? row : { ...row, estimatedValueUsd: Number(row.estimatedValueUsd || 0) + 12000 }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Increase Lead Stage Value
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            pipeline total ${totalPipeline.toLocaleString()}
                        </div>
                        <div className="rounded border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">
                            expansion/renewal split 42% / 58%
                        </div>
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-100">
                            partner-sourced share 36%
                        </div>
                        <button
                            type="button"
                            data-testid="revenue-ops-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    pipeline,
                                    totalPipeline,
                                    won: 7,
                                    lost: 3,
                                    stalled: 4,
                                };
                                downloadJson("monthly_revenue_ops_pack.json", payload);
                                setStatus("Exported monthly revenue ops pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Monthly Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
