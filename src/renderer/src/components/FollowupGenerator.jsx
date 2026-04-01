import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_followup_generation_history_v1";
const STAGES = [
    { id: "demo_followup", title: "Demo Follow-Up", evidence: ["demo_recap", "field_launch_health"] },
    { id: "security_followup", title: "Security Follow-Up", evidence: ["security_review_pack", "trust_fabric_status"] },
    { id: "pilot_kickoff", title: "Pilot Kickoff", evidence: ["demo_to_pilot_pack", "deployment_program_pack"] },
    { id: "expansion_followup", title: "Expansion Follow-Up", evidence: ["expansion_summary_pack", "proof_of_value"] },
    { id: "renewal_followup", title: "Renewal Follow-Up", evidence: ["renewal_summary", "support_ops_status"] },
];

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function parseEvidence(input) {
    return String(input || "")
        .split(",")
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
}

export default function FollowupGenerator({ open, onClose }) {
    const [accountName, setAccountName] = React.useState("Institutional Evaluator");
    const [stageId, setStageId] = React.useState("demo_followup");
    const [evidenceInput, setEvidenceInput] = React.useState("demo_recap,field_launch_health");
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const stage = STAGES.find((entry) => entry.id === stageId) || STAGES[0];
    const attachedEvidence = parseEvidence(evidenceInput);
    const missing = stage.evidence.filter((entry) => !attachedEvidence.includes(entry));

    return (
        <>
            <div className="fixed inset-0 z-[188] bg-black/60" onClick={onClose} />
            <section data-testid="followup-generator" className="fixed inset-x-6 top-14 bottom-4 z-[189] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Proof-Backed Follow-Up Generator</div>
                        <div className="text-[10px] font-mono text-slate-500">Stage-aware follow-up drafts grounded in explicit evidence references.</div>
                    </div>
                    <button type="button" data-testid="followup-generator-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="followup-account-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Stage
                            <select
                                data-testid="followup-stage-select"
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
                            Evidence References (comma separated)
                            <textarea
                                data-testid="followup-evidence-input"
                                value={evidenceInput}
                                onChange={(event) => setEvidenceInput(event.target.value)}
                                rows={4}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <button
                            type="button"
                            data-testid="followup-generate-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    accountName,
                                    stageId: stage.id,
                                    stageTitle: stage.title,
                                    requiredEvidence: stage.evidence,
                                    attachedEvidence,
                                    missingEvidence: missing,
                                    outboundAutoSend: false,
                                };
                                downloadJson("proof_backed_followup.json", payload);
                                setHistory([{ generatedAt, accountName, stageTitle: stage.title, missingCount: missing.length }, ...history].slice(0, 100));
                                setStatus(`Generated ${stage.title} draft for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Follow-Up Draft
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Evidence Coverage</div>
                        <div className="space-y-1">
                            {stage.evidence.map((entry) => {
                                const present = attachedEvidence.includes(entry);
                                return (
                                    <div key={entry} className={`rounded border px-2 py-1 text-[9px] font-mono ${present ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-100" : "border-amber-300/25 bg-amber-500/10 text-amber-100"}`}>
                                        {present ? "attached" : "missing"} · {entry}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Generation History</div>
                            <div className="space-y-1.5 max-h-52 overflow-auto pr-1 mt-2">
                                {history.map((entry, index) => (
                                    <article key={`${entry.generatedAt}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="text-[10px] font-mono text-slate-100">{entry.accountName}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{entry.stageTitle} · missing {entry.missingCount}</div>
                                    </article>
                                ))}
                                {!history.length && <div className="text-[10px] font-mono text-slate-500">No follow-up drafts generated yet.</div>}
                            </div>
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
