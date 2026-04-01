import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_licensed_operator_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function LicensedOperatorFramework({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [checklist, setChecklist] = React.useState(() => (
        Array.isArray(initial.checklist) && initial.checklist.length
            ? initial.checklist
            : [
                { section: "territory_scope", complete: true },
                { section: "training_prerequisites", complete: true },
                { section: "certification_prerequisites", complete: false },
                { section: "governance_requirements", complete: false },
                { section: "policy_controls", complete: false },
                { section: "launch_readiness", complete: false },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ checklist }));
    }, [checklist]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[218] bg-black/60" onClick={onClose} />
            <section data-testid="licensed-operator-framework" className="fixed inset-x-6 top-14 bottom-4 z-[219] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Licensed Operator / Franchise Framework</div>
                        <div className="text-[10px] font-mono text-slate-500">Operational framework for controlled licensed-operator rollout readiness.</div>
                    </div>
                    <button type="button" data-testid="licensed-operator-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1" role="list" aria-label="Licensed operator checklist">
                            {checklist.map((entry) => (
                                <div key={entry.section} className={`rounded border px-2 py-1 text-[9px] font-mono ${entry.complete ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-100" : "border-amber-300/25 bg-amber-500/10 text-amber-100"}`} role="listitem">
                                    {entry.complete ? "complete" : "pending"} · {entry.section}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="licensed-operator-complete-btn"
                            onClick={() => {
                                setChecklist((prev) => prev.map((entry, index) => (index === 2 ? { ...entry, complete: true } : entry)));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Complete Certification Prerequisite
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            checklist complete {checklist.filter((entry) => entry.complete).length}/{checklist.length}
                        </div>
                        <button
                            type="button"
                            data-testid="licensed-operator-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    checklist,
                                    noLegalOverclaiming: true,
                                };
                                downloadJson("operator_launch_pack.json", payload);
                                setStatus("Exported operator launch pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Operator Launch Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
