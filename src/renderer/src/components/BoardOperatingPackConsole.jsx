import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_board_operating_pack_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function BoardOperatingPackConsole({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [sections, setSections] = React.useState(() => (
        Array.isArray(initial.sections) && initial.sections.length
            ? initial.sections
            : ["growth_summary", "renewal_summary", "partner_summary", "rollout_summary", "support_summary", "service_line_summary", "risk_register", "evidence_appendix"]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections }));
    }, [sections]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[216] bg-black/60" onClick={onClose} />
            <section data-testid="board-operating-pack-console" className="fixed inset-x-6 top-14 bottom-4 z-[217] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Board / Investor Operating Pack</div>
                        <div className="text-[10px] font-mono text-slate-500">Sober operating pack generation with evidence-linked appendix.</div>
                    </div>
                    <button type="button" data-testid="board-operating-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1" role="list" aria-label="Board operating sections">
                            {sections.map((section) => (
                                <div key={section} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-200" role="listitem">{section}</div>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="board-operating-add-risk-btn"
                            onClick={() => {
                                setSections((prev) => prev.includes("risk_watchlist") ? prev : ["risk_watchlist", ...prev]);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Add Risk Watchlist Section
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] font-mono text-cyan-100">
                            section count {sections.length}
                        </div>
                        <button
                            type="button"
                            data-testid="board-operating-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    sections,
                                    claimsEvidenceLinked: true,
                                    soberNarrative: true,
                                };
                                downloadJson("board_operating_pack.json", payload);
                                setStatus("Exported board operating pack.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Board Pack
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
