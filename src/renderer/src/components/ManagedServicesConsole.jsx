import React from "react";
import ManagedAccountCard from "./ManagedAccountCard.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_managed_services_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function ManagedServicesConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [accounts, setAccounts] = React.useState(() => (
        Array.isArray(initial.accounts) && initial.accounts.length
            ? initial.accounts
            : [
                { accountId: "acct-001", accountName: "NorthGrid Utility", rolloutStage: "rollout", operator: "ops-a", riskScore: 62, riskBand: "medium" },
                { accountId: "acct-002", accountName: "Metro Water Authority", rolloutStage: "pilot", operator: "ops-b", riskScore: 74, riskBand: "high" },
                { accountId: "acct-003", accountName: "Regional Transit Ops", rolloutStage: "security_review", operator: "ops-c", riskScore: 41, riskBand: "low" },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts }));
    }, [accounts]);

    if (!open) return null;

    const highRisk = accounts.filter((entry) => entry.riskBand === "high");

    return (
        <>
            <div className="fixed inset-0 z-[192] bg-black/60" onClick={onClose} />
            <section data-testid="managed-services-console" className="fixed inset-x-6 top-14 bottom-4 z-[193] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Managed Services Command Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Multi-account health, rollout stage, and escalation queue control.</div>
                    </div>
                    <button type="button" data-testid="managed-services-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Managed Accounts</div>
                        <div className="space-y-1.5" role="list" aria-label="Managed account roster">
                            {accounts.map((account) => <ManagedAccountCard key={account.accountId} account={account} />)}
                        </div>
                        <button
                            type="button"
                            data-testid="managed-services-raise-risk-btn"
                            onClick={() => {
                                setAccounts((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : {
                                        ...entry,
                                        riskScore: Math.min(Number(entry.riskScore || 0) + 9, 99),
                                        riskBand: Number(entry.riskScore || 0) + 9 >= 70 ? "high" : "medium",
                                    }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Raise Lead Account Risk
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                            high-risk accounts {highRisk.length}
                        </div>
                        <div className="space-y-1 max-h-64 overflow-auto pr-1" aria-label="Managed services escalation queue">
                            {highRisk.map((entry) => (
                                <div key={entry.accountId} className="rounded border border-rose-300/25 bg-black/30 px-2 py-1 text-[9px] font-mono text-rose-100">
                                    {entry.accountName} · {entry.rolloutStage} · owner {entry.operator}
                                </div>
                            ))}
                            {!highRisk.length && <div className="text-[10px] font-mono text-slate-500">No escalations pending.</div>}
                        </div>
                        <button
                            type="button"
                            data-testid="managed-services-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    managedAccounts: accounts,
                                    highRisk,
                                    noCloudDependency: true,
                                };
                                downloadJson("managed_services_weekly_summary.json", payload);
                                setStatus("Exported managed services weekly summary.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Weekly Summary
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
