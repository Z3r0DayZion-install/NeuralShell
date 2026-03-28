import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_launch_week_state_v1";
const CHECKLIST = [
    "Review critical issues and assign owners.",
    "Validate demo/deployment/training/support asset freshness.",
    "Confirm partner rollout and buyer follow-up queue ownership.",
    "Publish today's command priorities.",
];

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function LaunchWeekCommandCenter({ open, onClose, onOpenPanel }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [priorities, setPriorities] = React.useState(Array.isArray(initial.priorities) ? initial.priorities : [
        "Close launch-blocking security review question.",
        "Confirm support escalation coverage for pilot accounts.",
    ]);
    const [issues, setIssues] = React.useState(Array.isArray(initial.issues) ? initial.issues : [
        { issueId: "launch-issue-001", severity: "high", summary: "Partner training completion below threshold." },
    ]);
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ priorities, issues }));
    }, [priorities, issues]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[186] bg-black/60" onClick={onClose} />
            <section data-testid="launch-week-command-center" className="fixed inset-x-6 top-14 bottom-4 z-[187] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Launch Week Command Discipline</div>
                        <div className="text-[10px] font-mono text-slate-500">Live launch-day checklist, queues, and end-of-day command summary.</div>
                    </div>
                    <button type="button" data-testid="launch-week-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[0.9fr_1.1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Daily Checklist</div>
                        <div className="space-y-1">
                            {CHECKLIST.map((entry, index) => (
                                <div key={entry} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-mono text-slate-300">
                                    {index + 1}. {entry}
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Drill-Down</div>
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                {[
                                    ["partner-rollout", "Partner"],
                                    ["buyer-ops", "Buyer Ops"],
                                    ["demo-to-pilot", "Demo->Pilot"],
                                    ["pilot-expansion", "Pilot Expansion"],
                                    ["renewal-risk", "Renewal"],
                                    ["followup-generator", "Follow-Up"],
                                    ["field-feedback", "Feedback"],
                                ].map(([panelId, label]) => (
                                    <button
                                        key={panelId}
                                        type="button"
                                        data-testid={`launch-week-open-${panelId}`}
                                        onClick={() => {
                                            if (typeof onOpenPanel === "function") onOpenPanel(panelId);
                                        }}
                                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.1em] text-cyan-100 text-left"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Issue Escalation Board</div>
                            <button
                                type="button"
                                data-testid="launch-week-add-issue-btn"
                                onClick={() => setIssues((prev) => [{
                                    issueId: `launch-issue-${Date.now()}`,
                                    severity: "medium",
                                    summary: "New launch issue captured.",
                                }, ...prev].slice(0, 100))}
                                className="px-2 py-1 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] font-mono uppercase tracking-[0.1em] text-amber-100"
                            >
                                Add Issue
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                            {issues.map((entry) => (
                                <article key={entry.issueId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.issueId} · {entry.severity}</div>
                                    <div className="text-[9px] font-mono text-slate-400">{entry.summary}</div>
                                </article>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Today's Command Priorities</div>
                            <div className="space-y-1.5 mt-2">
                                {priorities.map((entry, index) => (
                                    <label key={`${index}-${entry}`} className="block text-[10px] font-mono text-slate-300">
                                        <input
                                            value={entry}
                                            onChange={(event) => setPriorities((prev) => prev.map((item, innerIndex) => (innerIndex === index ? event.target.value : item)))}
                                            className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            data-testid="launch-week-generate-summary-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    priorities,
                                    issues,
                                    checklist: CHECKLIST,
                                    outboundAutoSend: false,
                                };
                                downloadJson("launch_week_end_of_day_summary.json", payload);
                                setStatus("Generated launch-week end-of-day summary.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export End-of-Day Summary
                        </button>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
