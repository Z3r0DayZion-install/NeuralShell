import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_pilot_expansion_history_v1";
const EXPANSION_PATHS = [
    "additional_seats",
    "appliance_rollout",
    "oversight_node",
    "training_bundle",
    "support_tier_upgrade",
    "federation_enablement",
];

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function PilotExpansionConsole({ open, onClose }) {
    const [accountName, setAccountName] = React.useState("Institutional Pilot Account");
    const [selectedPaths, setSelectedPaths] = React.useState(() => new Set(EXPANSION_PATHS.slice(0, 2)));
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const selected = Array.from(selectedPaths);

    return (
        <>
            <div className="fixed inset-0 z-[182] bg-black/60" onClick={onClose} />
            <section data-testid="pilot-expansion-console" className="fixed inset-x-6 top-14 bottom-4 z-[183] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Pilot-to-Expansion Command</div>
                        <div className="text-[10px] font-mono text-slate-500">Milestone tracking and evidence-based expansion path planning.</div>
                    </div>
                    <button type="button" data-testid="pilot-expansion-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="pilot-expansion-account-input"
                                value={accountName}
                                onChange={(event) => setAccountName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Expansion Paths</div>
                        <div className="grid grid-cols-2 gap-1.5" role="list" aria-label="Expansion path suggestions">
                            {EXPANSION_PATHS.map((entry) => (
                                <label key={entry} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-300 flex items-center gap-1.5" role="listitem">
                                    <input
                                        type="checkbox"
                                        checked={selectedPaths.has(entry)}
                                        onChange={(event) => {
                                            setSelectedPaths((prev) => {
                                                const next = new Set(prev);
                                                if (event.target.checked) next.add(entry);
                                                else next.delete(entry);
                                                return next;
                                            });
                                        }}
                                    />
                                    <span>{entry}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="pilot-expansion-generate-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    accountName,
                                    selectedPaths: selected,
                                    deploymentPhases: ["single_site", "multi_site", "regional", "federated"],
                                    outboundAutoSend: false,
                                };
                                downloadJson("pilot_expansion_summary.json", payload);
                                setHistory([{ generatedAt, accountName, selectedPaths: selected }, ...history].slice(0, 100));
                                setStatus(`Generated expansion summary for ${accountName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Expansion Summary
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Pilot Milestone Tracker</div>
                        <div className="space-y-1">
                            {["pilot_kickoff", "week2_review", "week4_review", "proof_validation", "expansion_decision"].map((entry, index) => (
                                <div key={entry} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-mono text-slate-300">
                                    {index < 3 ? "complete" : "pending"} · {entry}
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">History</div>
                            <div className="space-y-1.5 max-h-48 overflow-auto pr-1 mt-2">
                                {history.map((entry, index) => (
                                    <article key={`${entry.generatedAt}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="text-[10px] font-mono text-slate-100">{entry.accountName}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{Array.isArray(entry.selectedPaths) ? entry.selectedPaths.join(", ") : ""}</div>
                                    </article>
                                ))}
                                {!history.length && <div className="text-[10px] font-mono text-slate-500">No expansion summaries yet.</div>}
                            </div>
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
