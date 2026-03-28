import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_ecosystem_portfolio_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function EcosystemPortfolioConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [lines, setLines] = React.useState(() => (
        Array.isArray(initial.lines) && initial.lines.length
            ? initial.lines
            : [
                { line: "core_product", health: 78 },
                { line: "appliance_program", health: 72 },
                { line: "managed_services", health: 69 },
                { line: "training_delivery", health: 81 },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines }));
    }, [lines]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[206] bg-black/60" onClick={onClose} />
            <section data-testid="ecosystem-portfolio-console" className="fixed inset-x-6 top-14 bottom-4 z-[207] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Portfolio Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Portfolio line health and attachment-path command view.</div>
                    </div>
                    <button type="button" data-testid="ecosystem-portfolio-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Ecosystem portfolio lines">
                            {lines.map((entry) => (
                                <article key={entry.line} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.line}</div>
                                    <div className="text-[9px] font-mono text-slate-400">health {entry.health}</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-portfolio-improve-btn"
                            onClick={() => {
                                setLines((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, health: Math.min(Number(entry.health || 0) + 6, 100) }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Improve Lead Line Health
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            lines healthy {lines.filter((entry) => Number(entry.health || 0) >= 80).length}/{lines.length}
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-portfolio-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    lines,
                                    attachmentPaths: ["core_to_training", "enterprise_to_appliance", "pilot_to_managed_services"],
                                };
                                downloadJson("ecosystem_portfolio_brief.json", payload);
                                setStatus("Exported ecosystem portfolio brief.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Portfolio Brief
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
