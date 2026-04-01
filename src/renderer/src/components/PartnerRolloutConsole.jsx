import React from "react";
import PartnerReadinessCard from "./PartnerReadinessCard.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_partner_rollout_v1";

const DIMENSIONS = [
    { id: "assets", label: "Asset Delivery", weight: 25 },
    { id: "training", label: "Training Completion", weight: 20 },
    { id: "process", label: "Process Readiness", weight: 20 },
    { id: "security", label: "Security Alignment", weight: 20 },
    { id: "activity", label: "Deal Activity", weight: 15 },
];

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function statusFromScore(score) {
    if (score >= 80) return "ready";
    if (score >= 60) return "attention";
    return "blocked";
}

export default function PartnerRolloutConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [partnerName, setPartnerName] = React.useState(String(initial.partnerName || "NorthGrid Partner Group"));
    const [scores, setScores] = React.useState(() => (
        DIMENSIONS.reduce((acc, item, index) => {
            const fallback = 70 + ((index * 7) % 18);
            acc[item.id] = Number(initial.scores && initial.scores[item.id] != null ? initial.scores[item.id] : fallback);
            return acc;
        }, {})
    ));
    const [blockers, setBlockers] = React.useState(() => (
        Array.isArray(initial.blockers)
            ? initial.blockers
            : [{ blockerId: "partner-blocker-001", summary: "Assign partner security reviewer.", severity: "high" }]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ partnerName, scores, blockers }));
    }, [partnerName, scores, blockers]);

    if (!open) return null;

    const rows = DIMENSIONS.map((entry) => {
        const score = Number(scores[entry.id] || 0);
        return {
            ...entry,
            score,
            weighted: Number(((score * entry.weight) / 100).toFixed(2)),
            status: statusFromScore(score),
        };
    });
    const readinessScore = Number(rows.reduce((acc, row) => acc + Number(row.weighted || 0), 0).toFixed(2));
    const readinessStatus = statusFromScore(readinessScore);

    return (
        <>
            <div className="fixed inset-0 z-[176] bg-black/60" onClick={onClose} />
            <section data-testid="partner-rollout-console" className="fixed inset-x-6 top-14 bottom-4 z-[177] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Partner Rollout Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Activation checklist, readiness score, and blocker queue.</div>
                    </div>
                    <button type="button" data-testid="partner-rollout-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Partner Name
                            <input
                                data-testid="partner-rollout-partner-input"
                                value={partnerName}
                                onChange={(event) => setPartnerName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Partner readiness dimensions">
                            {rows.map((row) => (
                                <PartnerReadinessCard key={row.id} label={row.label} weight={row.weight} score={row.score} status={row.status} />
                            ))}
                        </div>
                        <div className={`rounded border px-2 py-1.5 text-[10px] font-mono ${readinessStatus === "ready" ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100" : readinessStatus === "attention" ? "border-amber-300/30 bg-amber-500/10 text-amber-100" : "border-rose-300/30 bg-rose-500/10 text-rose-100"}`}>
                            readiness {readinessScore} ({readinessStatus})
                        </div>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Rollout Blockers</div>
                            <button
                                type="button"
                                data-testid="partner-rollout-add-blocker-btn"
                                onClick={() => {
                                    setBlockers((prev) => [{
                                        blockerId: `partner-blocker-${Date.now()}`,
                                        summary: "New partner blocker captured.",
                                        severity: "medium",
                                    }, ...prev].slice(0, 100));
                                }}
                                className="px-2 py-1 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] font-mono uppercase tracking-[0.1em] text-amber-100"
                            >
                                Add Blocker
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-64 overflow-auto pr-1" aria-label="Partner blockers queue">
                            {blockers.map((entry) => (
                                <article key={entry.blockerId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.blockerId}</div>
                                    <div className="text-[9px] font-mono text-slate-400">{entry.summary}</div>
                                    <div className="text-[9px] font-mono text-slate-500">{entry.severity}</div>
                                </article>
                            ))}
                            {!blockers.length && <div className="text-[10px] font-mono text-slate-500">No partner blockers.</div>}
                        </div>
                        <button
                            type="button"
                            data-testid="partner-rollout-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    partnerName,
                                    readinessScore,
                                    readinessStatus,
                                    dimensions: rows,
                                    blockers,
                                };
                                downloadJson("partner_rollout_summary.json", payload);
                                setStatus(`Exported partner rollout summary for ${partnerName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Handoff Summary
                        </button>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
