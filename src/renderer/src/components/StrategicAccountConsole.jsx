import React from "react";
import StakeholderMap from "./StakeholderMap.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_strategic_account_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function StrategicAccountConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [accountName, setAccountName] = React.useState(String(initial.accountName || "Strategic Institutional Account"));
    const [stakeholders, setStakeholders] = React.useState(() => (
        Array.isArray(initial.stakeholders) && initial.stakeholders.length
            ? initial.stakeholders
            : [
                { stakeholderId: "stakeholder-1", role: "Executive Sponsor", name: "Exec Sponsor", alignment: "strong" },
                { stakeholderId: "stakeholder-2", role: "Security Lead", name: "Security Lead", alignment: "mixed" },
                { stakeholderId: "stakeholder-3", role: "Platform Operator", name: "Ops Lead", alignment: "pending" },
            ]
    ));
    const [risks, setRisks] = React.useState(() => (
        Array.isArray(initial.risks) ? initial.risks : [{ riskId: "risk-1", summary: "Security review ownership not finalized.", severity: "high" }]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accountName, stakeholders, risks }));
    }, [accountName, stakeholders, risks]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[194] bg-black/60" onClick={onClose} />
            <section data-testid="strategic-account-console" className="fixed inset-x-6 top-14 bottom-4 z-[195] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Strategic Account Orchestration</div>
                        <div className="text-[10px] font-mono text-slate-500">Stakeholder map, blockers, and evidence-linked next steps.</div>
                    </div>
                    <button type="button" data-testid="strategic-account-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="strategic-account-name-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <StakeholderMap stakeholders={stakeholders} />
                        <button
                            type="button"
                            data-testid="strategic-account-add-risk-btn"
                            onClick={() => {
                                setRisks((prev) => [{ riskId: `risk-${Date.now()}`, summary: "New strategic blocker captured.", severity: "medium" }, ...prev].slice(0, 100));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Add Blocker
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Active Risks</div>
                        <div className="space-y-1 max-h-56 overflow-auto pr-1">
                            {risks.map((entry) => (
                                <div key={entry.riskId} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-200">
                                    {entry.riskId} · {entry.severity} · {entry.summary}
                                </div>
                            ))}
                            {!risks.length && <div className="text-[10px] font-mono text-slate-500">No active risks.</div>}
                        </div>
                        <button
                            type="button"
                            data-testid="strategic-account-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    accountName,
                                    stakeholders,
                                    risks,
                                    expansionHypotheses: [
                                        { type: "appliance_rollout", evidenceRefs: ["pilot_conversion_pack", "deployment_program_pack"] },
                                        { type: "training_scale", evidenceRefs: ["training_bundle", "support_ops_summary"] },
                                    ],
                                };
                                downloadJson("strategic_account_brief.json", payload);
                                setStatus(`Exported strategic account brief for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Executive Brief
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
