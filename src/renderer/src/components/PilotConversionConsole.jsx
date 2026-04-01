import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_pilot_conversion_history_v1";

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function PilotConversionConsole({ open, onClose }) {
    const [pilotName, setPilotName] = React.useState("Institutional Pilot");
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[170] bg-black/60" onClick={onClose} />
            <section data-testid="pilot-conversion-console" className="fixed inset-x-8 top-16 bottom-6 z-[171] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Pilot Conversion Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Evidence-first pilot review and expansion mapping.</div>
                    </div>
                    <button type="button" data-testid="pilot-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Pilot Name
                            <input
                                data-testid="pilot-name-input"
                                value={pilotName}
                                onChange={(event) => setPilotName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <button
                            type="button"
                            data-testid="pilot-generate-pack-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const payload = {
                                    generatedAt,
                                    pilotName,
                                    cadence: ["2-week review", "4-week review"],
                                    valueWorksheet: [
                                        "time_to_triage_minutes",
                                        "recovery_success_rate",
                                        "policy_integrity_rate",
                                    ],
                                    expansionMap: ["single-site", "multi-site", "regional", "federated"],
                                };
                                downloadJson("pilot_conversion_pack.json", payload);
                                setHistory([{ generatedAt, pilotName }, ...history].slice(0, 100));
                                setStatus(`Generated pilot conversion pack for ${pilotName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Conversion Pack
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Pilot History</div>
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                            {history.map((entry, index) => (
                                <article key={`${entry.generatedAt}-${index}`} className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-cyan-100">{entry.pilotName}</div>
                                    <div className="text-[9px] font-mono text-slate-300">{new Date(entry.generatedAt).toLocaleString()}</div>
                                </article>
                            ))}
                            {!history.length && <div className="text-[10px] font-mono text-slate-500">No pilot conversion packs yet.</div>}
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
