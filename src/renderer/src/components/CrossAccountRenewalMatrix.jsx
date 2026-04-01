import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_cross_account_renewal_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function CrossAccountRenewalMatrix({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [rows, setRows] = React.useState(() => (
        Array.isArray(initial.rows) && initial.rows.length
            ? initial.rows
            : [
                { accountId: "acct-001", accountName: "NorthGrid Utility", renewalDate: "2026-06-30", riskBand: "medium", supportLoad: 63, deploymentHealth: 76 },
                { accountId: "acct-002", accountName: "Metro Water Authority", renewalDate: "2026-07-20", riskBand: "high", supportLoad: 82, deploymentHealth: 61 },
                { accountId: "acct-003", accountName: "Regional Transit Ops", renewalDate: "2026-05-15", riskBand: "low", supportLoad: 44, deploymentHealth: 88 },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows }));
    }, [rows]);

    if (!open) return null;

    const urgent = rows.filter((entry) => entry.riskBand === "high");

    return (
        <>
            <div className="fixed inset-0 z-[202] bg-black/60" onClick={onClose} />
            <section data-testid="cross-account-renewal-matrix" className="fixed inset-x-6 top-14 bottom-4 z-[203] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Cross-Account Renewal Matrix</div>
                        <div className="text-[10px] font-mono text-slate-500">Renewal calendar with risk, support, and deployment overlays.</div>
                    </div>
                    <button type="button" data-testid="cross-account-renewal-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Cross-account renewal rows">
                            {rows.map((entry) => (
                                <article key={entry.accountId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.accountName}</div>
                                    <div className="text-[9px] font-mono text-slate-400">renewal {entry.renewalDate}</div>
                                    <div className="text-[9px] font-mono text-slate-400">risk {entry.riskBand}</div>
                                    <div className="text-[9px] font-mono text-slate-500">support {entry.supportLoad} · deploy {entry.deploymentHealth}</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="cross-account-renewal-escalate-btn"
                            onClick={() => {
                                setRows((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, riskBand: "high", supportLoad: Math.min(Number(entry.supportLoad || 0) + 10, 100) }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-rose-300/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-rose-100"
                        >
                            Escalate Lead Account Risk
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                            urgent renewals {urgent.length}
                        </div>
                        <div className="space-y-1 max-h-56 overflow-auto pr-1">
                            {urgent.map((entry) => (
                                <div key={entry.accountId} className="rounded border border-rose-300/25 bg-black/30 px-2 py-1 text-[9px] font-mono text-rose-100">
                                    intervention required · {entry.accountName}
                                </div>
                            ))}
                            {!urgent.length && <div className="text-[10px] font-mono text-slate-500">No urgent renewals.</div>}
                        </div>
                        <button
                            type="button"
                            data-testid="cross-account-renewal-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    rows,
                                    urgent,
                                    interventionTemplates: ["Executive renewal review", "Support surge plan", "Deployment stabilization sprint"],
                                };
                                downloadJson("cross_account_renewal_pack.json", payload);
                                setStatus("Exported cross-account renewal pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Renewal Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
