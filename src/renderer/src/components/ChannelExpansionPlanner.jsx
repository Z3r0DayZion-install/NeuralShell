import React from "react";
import ChannelScorecard from "./ChannelScorecard.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_channel_expansion_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function scoreStatus(score) {
    if (score >= 80) return "ready";
    if (score >= 60) return "attention";
    return "blocked";
}

export default function ChannelExpansionPlanner({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [scorecards, setScorecards] = React.useState(() => (
        Array.isArray(initial.scorecards) && initial.scorecards.length
            ? initial.scorecards
            : [
                { channelType: "consultants", score: 72, status: "attention" },
                { channelType: "managed_service_providers", score: 78, status: "attention" },
                { channelType: "integrators", score: 66, status: "attention" },
                { channelType: "oem", score: 58, status: "blocked" },
                { channelType: "compliance_partners", score: 71, status: "attention" },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ scorecards }));
    }, [scorecards]);

    if (!open) return null;

    const readyCount = scorecards.filter((entry) => entry.status === "ready").length;

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/60" onClick={onClose} />
            <section data-testid="channel-expansion-planner" className="fixed inset-x-6 top-14 bottom-4 z-[201] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Channel Expansion Planner</div>
                        <div className="text-[10px] font-mono text-slate-500">Channel model scorecards, enablement gaps, and launch package readiness.</div>
                    </div>
                    <button type="button" data-testid="channel-expansion-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Channel scorecards">
                            {scorecards.map((card) => <ChannelScorecard key={card.channelType} card={card} />)}
                        </div>
                        <button
                            type="button"
                            data-testid="channel-expansion-improve-btn"
                            onClick={() => {
                                setScorecards((prev) => prev.map((card, index) => (
                                    index !== 0 ? card : {
                                        ...card,
                                        score: Math.min(Number(card.score || 0) + 7, 100),
                                        status: scoreStatus(Math.min(Number(card.score || 0) + 7, 100)),
                                    }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Improve Lead Channel Score
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-100">
                            channel-ready motions {readyCount}
                        </div>
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-100">
                            open enablement gaps {scorecards.length - readyCount}
                        </div>
                        <button
                            type="button"
                            data-testid="channel-expansion-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    scorecards,
                                    readyCount,
                                    noAutoMagic: true,
                                };
                                downloadJson("channel_expansion_plan.json", payload);
                                setStatus("Exported channel expansion plan.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Channel Plan
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
