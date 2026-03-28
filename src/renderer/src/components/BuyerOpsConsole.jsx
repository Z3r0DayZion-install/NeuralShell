import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_buyer_ops_timeline_v1";
const STAGES = [
    {
        id: "discovery",
        title: "Discovery",
        recommendations: [
            "Share evaluator quickstart and 30-minute walkthrough.",
            "Confirm buyer deployment constraints and stakeholders.",
        ],
    },
    {
        id: "security_review",
        title: "Security Review",
        recommendations: [
            "Generate security review packet from current truth.",
            "Attach trust and air-gap posture references.",
        ],
    },
    {
        id: "procurement",
        title: "Procurement",
        recommendations: [
            "Generate procurement FAQ and topology sheets.",
            "Map support entitlement and commercial package fit.",
        ],
    },
    {
        id: "pilot_planning",
        title: "Pilot Planning",
        recommendations: [
            "Run demo-to-pilot fit scorecard.",
            "Finalize pilot scope and success criteria worksheet.",
        ],
    },
];

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function BuyerOpsConsole({ open, onClose }) {
    const [accountName, setAccountName] = React.useState("Institutional Evaluator");
    const [stageId, setStageId] = React.useState("security_review");
    const [daysSinceTouch, setDaysSinceTouch] = React.useState(4);
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const stage = STAGES.find((entry) => entry.id === stageId) || STAGES[0];
    const stale = Number(daysSinceTouch || 0) >= 7;

    return (
        <>
            <div className="fixed inset-0 z-[178] bg-black/60" onClick={onClose} />
            <section data-testid="buyer-ops-console" className="fixed inset-x-6 top-14 bottom-4 z-[179] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Buyer Ops Automation</div>
                        <div className="text-[10px] font-mono text-slate-500">Stage-aware follow-up generation and buyer timeline controls.</div>
                    </div>
                    <button type="button" data-testid="buyer-ops-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[0.95fr_1.05fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="buyer-ops-account-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Stage
                            <select
                                data-testid="buyer-ops-stage-select"
                                value={stageId}
                                onChange={(event) => setStageId(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            >
                                {STAGES.map((entry) => (
                                    <option key={entry.id} value={entry.id}>{entry.title}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Days Since Buyer Activity
                            <input
                                data-testid="buyer-ops-days-input"
                                type="number"
                                value={daysSinceTouch}
                                min={0}
                                onChange={(event) => setDaysSinceTouch(Number(event.target.value || 0))}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className={`rounded border px-2 py-1.5 text-[10px] font-mono ${stale ? "border-amber-300/30 bg-amber-500/10 text-amber-100" : "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"}`}>
                            {stale ? "stale evaluator nudge recommended" : "evaluator cadence healthy"}
                        </div>
                        <button
                            type="button"
                            data-testid="buyer-ops-generate-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    accountName,
                                    stageId: stage.id,
                                    stageTitle: stage.title,
                                    recommendations: stage.recommendations,
                                    staleEvaluator: stale,
                                    outboundAutoSend: false,
                                };
                                downloadJson("buyer_followup_pack.json", payload);
                                setHistory([{ generatedAt, accountName, stageTitle: stage.title, stale }, ...history].slice(0, 120));
                                setStatus(`Generated buyer follow-up pack for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Follow-Up Pack
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Stage Recommendations</div>
                        <div className="space-y-1">
                            {stage.recommendations.map((entry, index) => (
                                <div key={`${stage.id}-${index}`} className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                                    {index + 1}. {entry}
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Timeline Summary</div>
                            <div className="space-y-1.5 max-h-56 overflow-auto pr-1 mt-2" aria-label="Buyer ops timeline history">
                                {history.map((entry, index) => (
                                    <article key={`${entry.generatedAt}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="text-[10px] font-mono text-slate-100">{entry.accountName}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{entry.stageTitle}</div>
                                        <div className="text-[9px] font-mono text-slate-500">{new Date(entry.generatedAt).toLocaleString()}</div>
                                    </article>
                                ))}
                                {!history.length && <div className="text-[10px] font-mono text-slate-500">No buyer follow-up history yet.</div>}
                            </div>
                        </div>
                    </section>
                </div>

                {status && <div data-testid="buyer-ops-status" className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
