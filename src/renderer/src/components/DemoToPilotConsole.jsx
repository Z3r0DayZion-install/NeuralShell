import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import PilotFitScorecard from "./PilotFitScorecard.jsx";

const HISTORY_KEY = "neuralshell_demo_to_pilot_history_v1";

const DIMENSIONS = [
    { id: "technical_fit", label: "Technical Fit", weight: 25 },
    { id: "security_fit", label: "Security Fit", weight: 20 },
    { id: "operational_fit", label: "Operational Fit", weight: 20 },
    { id: "stakeholder_alignment", label: "Stakeholder Alignment", weight: 20 },
    { id: "timeline_readiness", label: "Timeline Readiness", weight: 15 },
];

const REQUIRED_ARTIFACTS = [
    "demo_recap",
    "security_review_status",
    "deployment_profile_selection",
    "success_criteria_worksheet",
    "pilot_owner_assignment",
];

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function scoreDecision(totalScore) {
    if (totalScore >= 80) return "ready_for_pilot";
    if (totalScore >= 55) return "revisit";
    return "not_fit";
}

export default function DemoToPilotConsole({ open, onClose }) {
    const [accountName, setAccountName] = React.useState("Institutional Evaluator");
    const [scores, setScores] = React.useState(() => (
        DIMENSIONS.reduce((acc, item, index) => {
            acc[item.id] = 72 + ((index * 6) % 18);
            return acc;
        }, {})
    ));
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const dimensions = DIMENSIONS.map((entry) => {
        const score = Number(scores[entry.id] || 0);
        return {
            ...entry,
            score,
            weighted: Number(((score * entry.weight) / 100).toFixed(2)),
        };
    });
    const totalScore = Number(dimensions.reduce((acc, row) => acc + Number(row.weighted || 0), 0).toFixed(2));
    const decision = scoreDecision(totalScore);

    return (
        <>
            <div className="fixed inset-0 z-[180] bg-black/60" onClick={onClose} />
            <section data-testid="demo-to-pilot-console" className="fixed inset-x-6 top-14 bottom-4 z-[181] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Demo-to-Pilot Conversion Engine</div>
                        <div className="text-[10px] font-mono text-slate-500">Outcome capture, pilot-fit scoring, and conversion decision workflow.</div>
                    </div>
                    <button type="button" data-testid="demo-to-pilot-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[0.9fr_1.1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="demo-to-pilot-account-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className="space-y-1.5">
                            {DIMENSIONS.map((entry) => (
                                <label key={entry.id} className="block text-[10px] font-mono text-slate-300">
                                    {entry.label}
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={scores[entry.id]}
                                        onChange={(event) => setScores((prev) => ({ ...prev, [entry.id]: Number(event.target.value || 0) }))}
                                        className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                                    />
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="demo-to-pilot-generate-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    accountName,
                                    totalScore,
                                    decision,
                                    dimensions,
                                    requiredArtifacts: REQUIRED_ARTIFACTS,
                                    outboundAutoSend: false,
                                };
                                downloadJson("demo_to_pilot_pack.json", payload);
                                setHistory([{ generatedAt, accountName, decision, totalScore }, ...history].slice(0, 100));
                                setStatus(`Generated demo-to-pilot pack for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Pilot Launch Pack
                        </button>
                    </section>

                    <section className="space-y-2">
                        <PilotFitScorecard dimensions={dimensions} />
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Required Artifacts</div>
                            <div className="grid grid-cols-2 gap-1.5" role="list" aria-label="Required pilot artifacts">
                                {REQUIRED_ARTIFACTS.map((entry) => (
                                    <div key={entry} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-300" role="listitem">
                                        {entry}
                                    </div>
                                ))}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-100">decision {decision}</div>
                        </section>
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Conversion History</div>
                            <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                                {history.map((entry, index) => (
                                    <article key={`${entry.generatedAt}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="text-[10px] font-mono text-slate-100">{entry.accountName}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{entry.decision} · {entry.totalScore}</div>
                                    </article>
                                ))}
                                {!history.length && <div className="text-[10px] font-mono text-slate-500">No conversion runs yet.</div>}
                            </div>
                        </section>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
