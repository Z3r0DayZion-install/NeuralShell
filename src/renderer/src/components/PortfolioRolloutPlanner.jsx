import React from "react";
import RolloutStageMatrix from "./RolloutStageMatrix.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_portfolio_rollout_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function PortfolioRolloutPlanner({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [rows, setRows] = React.useState(() => (
        Array.isArray(initial.rows) && initial.rows.length
            ? initial.rows
            : [
                { siteId: "site-001", account: "NorthGrid Utility", region: "us-west", stage: "rollout", blockerCount: 1 },
                { siteId: "site-002", account: "Metro Water Authority", region: "us-central", stage: "pilot", blockerCount: 2 },
                { siteId: "site-003", account: "Regional Transit Ops", region: "us-east", stage: "security_review", blockerCount: 1 },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows }));
    }, [rows]);

    if (!open) return null;

    const blockerTotal = rows.reduce((acc, row) => acc + Number(row.blockerCount || 0), 0);

    return (
        <>
            <div className="fixed inset-0 z-[196] bg-black/60" onClick={onClose} />
            <section data-testid="portfolio-rollout-planner" className="fixed inset-x-6 top-14 bottom-4 z-[197] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Portfolio Rollout Planner</div>
                        <div className="text-[10px] font-mono text-slate-500">Multi-site stage matrix, dependency visibility, and resource strain indicators.</div>
                    </div>
                    <button type="button" data-testid="portfolio-rollout-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <RolloutStageMatrix rows={rows} />
                        <button
                            type="button"
                            data-testid="portfolio-rollout-add-blocker-btn"
                            onClick={() => {
                                setRows((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, blockerCount: Number(entry.blockerCount || 0) + 1 }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Increment Lead Site Blockers
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-100">
                            portfolio blockers {blockerTotal}
                        </div>
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            resource strain {blockerTotal >= 5 ? "high" : blockerTotal >= 3 ? "medium" : "low"}
                        </div>
                        <button
                            type="button"
                            data-testid="portfolio-rollout-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    rows,
                                    blockerTotal,
                                    dependencyClusters: ["trust_chain", "operator_training"],
                                };
                                downloadJson("portfolio_rollout_summary.json", payload);
                                setStatus("Exported portfolio rollout summary.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Portfolio Summary
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
