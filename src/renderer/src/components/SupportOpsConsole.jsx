import React from "react";

const QUEUE_KEY = "neuralshell_support_triage_queue_v1";

function readQueue() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function SupportOpsConsole({ open, onClose }) {
    const [queue, setQueue] = React.useState(() => (typeof window === "undefined" ? [] : readQueue()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }, [queue]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[166] bg-black/60" onClick={onClose} />
            <section data-testid="support-ops-console" className="fixed inset-x-8 top-16 bottom-6 z-[167] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Support Ops Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Intake, severity triage, and escalation-ready handoff.</div>
                    </div>
                    <button type="button" data-testid="support-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Severity Matrix</div>
                        <div className="text-[10px] font-mono text-slate-300 space-y-1">
                            <div>SEV1 critical: 15m response / 4h workaround</div>
                            <div>SEV2 high: 30m response / 1d workaround</div>
                            <div>SEV3 medium: 4h response / 3d resolution</div>
                            <div>SEV4 low: 1d response / 7d resolution</div>
                        </div>
                        <button
                            type="button"
                            data-testid="support-intake-btn"
                            onClick={() => {
                                const next = [
                                    {
                                        ticketId: `SUP-${Date.now()}`,
                                        severity: "medium",
                                        summary: "Imported support bundle pending triage",
                                        owner: "support-l1",
                                    },
                                    ...queue,
                                ].slice(0, 120);
                                setQueue(next);
                                setStatus("Support intake checklist captured.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Capture Intake
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Triage Queue</div>
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                            {queue.map((ticket) => (
                                <article key={ticket.ticketId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-slate-100">{ticket.ticketId} · {ticket.severity}</div>
                                    <div className="text-[9px] font-mono text-slate-400">{ticket.summary}</div>
                                    <div className="text-[9px] font-mono text-slate-500">owner {ticket.owner}</div>
                                </article>
                            ))}
                            {!queue.length && <div className="text-[10px] font-mono text-slate-500">No active support tickets.</div>}
                        </div>
                    </section>
                </div>

                {status && <div data-testid="support-triage-status" className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
