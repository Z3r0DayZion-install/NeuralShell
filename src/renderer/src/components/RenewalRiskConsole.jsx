import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_renewal_risk_history_v1";
const FACTORS = [
    { id: "support_load", label: "Support Load", weight: 20, higherIsRiskier: true },
    { id: "incident_backlog", label: "Incident Backlog", weight: 20, higherIsRiskier: true },
    { id: "deployment_health", label: "Deployment Health", weight: 20, higherIsRiskier: false },
    { id: "adoption_health", label: "Adoption Health", weight: 20, higherIsRiskier: false },
    { id: "executive_sponsor", label: "Executive Sponsor Confidence", weight: 20, higherIsRiskier: false },
];

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function clamp(value) {
    return Math.min(Math.max(Number(value || 0), 0), 100);
}

function bandForRisk(score) {
    if (score >= 70) return "high";
    if (score >= 45) return "medium";
    return "low";
}

export default function RenewalRiskConsole({ open, onClose }) {
    const [accountName, setAccountName] = React.useState("Institutional Account");
    const [values, setValues] = React.useState({
        support_load: 52,
        incident_backlog: 35,
        deployment_health: 82,
        adoption_health: 74,
        executive_sponsor: 78,
    });
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const scored = FACTORS.map((factor) => {
        const value = clamp(values[factor.id]);
        const normalizedRisk = factor.higherIsRiskier ? value : (100 - value);
        const weightedRisk = Number(((normalizedRisk * factor.weight) / 100).toFixed(2));
        return { ...factor, value, normalizedRisk, weightedRisk };
    });
    const riskScore = Number(scored.reduce((acc, item) => acc + Number(item.weightedRisk || 0), 0).toFixed(2));
    const riskBand = bandForRisk(riskScore);
    const interventions = [];
    if (riskScore >= 70) interventions.push("Schedule executive risk review within 48 hours.");
    if (values.support_load >= 80) interventions.push("Assign support surge owner and run daily triage.");
    if (values.adoption_health <= 50) interventions.push("Run targeted adoption and enablement intervention.");

    return (
        <>
            <div className="fixed inset-0 z-[184] bg-black/60" onClick={onClose} />
            <section data-testid="renewal-risk-console" className="fixed inset-x-6 top-14 bottom-4 z-[185] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Renewal / Retention / Risk Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Explainable renewal risk scoring with intervention guidance.</div>
                    </div>
                    <button type="button" data-testid="renewal-risk-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="renewal-risk-account-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className="space-y-1.5" aria-label="Renewal risk factors">
                            {FACTORS.map((factor) => (
                                <label key={factor.id} className="block text-[10px] font-mono text-slate-300">
                                    {factor.label}
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={values[factor.id]}
                                        onChange={(event) => setValues((prev) => ({ ...prev, [factor.id]: clamp(event.target.value) }))}
                                        className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                                    />
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="renewal-risk-generate-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    accountName,
                                    riskScore,
                                    riskBand,
                                    factors: scored,
                                    interventions,
                                };
                                downloadJson("renewal_summary.json", payload);
                                setHistory([{ generatedAt, accountName, riskScore, riskBand }, ...history].slice(0, 100));
                                setStatus(`Generated renewal summary for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Renewal Summary
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Risk Score</div>
                        <div className={`rounded border px-2 py-1.5 text-[10px] font-mono ${riskBand === "high" ? "border-rose-300/30 bg-rose-500/10 text-rose-100" : riskBand === "medium" ? "border-amber-300/30 bg-amber-500/10 text-amber-100" : "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"}`}>
                            risk {riskScore} ({riskBand})
                        </div>
                        <div className="space-y-1 max-h-40 overflow-auto pr-1">
                            {scored.map((entry) => (
                                <div key={entry.id} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-300">
                                    {entry.label}: value {entry.value} · weighted risk {entry.weightedRisk}
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Interventions</div>
                            <div className="space-y-1 mt-1">
                                {interventions.length ? interventions.map((entry, index) => (
                                    <div key={`${index}-${entry}`} className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-[9px] font-mono text-amber-100">
                                        {index + 1}. {entry}
                                    </div>
                                )) : <div className="text-[10px] font-mono text-slate-500">No intervention required.</div>}
                            </div>
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
