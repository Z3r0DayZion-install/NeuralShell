import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_field_feedback_notes_v1";

const CATEGORIES = [
    { id: "product_gap", label: "Product Gap", route: "product_queue" },
    { id: "deployment_friction", label: "Deployment Friction", route: "deployment_queue" },
    { id: "buyer_confusion", label: "Buyer Confusion", route: "buyer_docs_queue" },
    { id: "support_issue", label: "Support Issue", route: "support_queue" },
    { id: "docs_training_gap", label: "Docs/Training Gap", route: "enablement_queue" },
    { id: "packaging_pricing_confusion", label: "Packaging/Pricing Confusion", route: "commercial_queue" },
];

function readNotes() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function FieldFeedbackConsole({ open, onClose }) {
    const [account, setAccount] = React.useState("Institutional Account");
    const [summary, setSummary] = React.useState("Field note summary");
    const [categoryId, setCategoryId] = React.useState("deployment_friction");
    const [severity, setSeverity] = React.useState("medium");
    const [notes, setNotes] = React.useState(() => (typeof window === "undefined" ? [] : readNotes()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }, [notes]);

    if (!open) return null;

    const routeCounts = notes.reduce((acc, note) => {
        const category = CATEGORIES.find((entry) => entry.id === note.categoryId) || CATEGORIES[0];
        const route = category.route;
        acc[route] = Number(acc[route] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div className="fixed inset-0 z-[190] bg-black/60" onClick={onClose} />
            <section data-testid="field-feedback-console" className="fixed inset-x-6 top-14 bottom-4 z-[191] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Field Feedback Intake + Routing</div>
                        <div className="text-[10px] font-mono text-slate-500">Structured notes, category routing, and weekly summary export.</div>
                    </div>
                    <button type="button" data-testid="field-feedback-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Account
                            <input
                                data-testid="field-feedback-account-input"
                                value={account}
                                onChange={(event) => setAccount(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Category
                            <select
                                data-testid="field-feedback-category-select"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            >
                                {CATEGORIES.map((entry) => (
                                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Severity
                            <select
                                data-testid="field-feedback-severity-select"
                                value={severity}
                                onChange={(event) => setSeverity(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            >
                                <option value="low">low</option>
                                <option value="medium">medium</option>
                                <option value="high">high</option>
                                <option value="critical">critical</option>
                            </select>
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Feedback Summary
                            <textarea
                                data-testid="field-feedback-summary-input"
                                value={summary}
                                onChange={(event) => setSummary(event.target.value)}
                                rows={4}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <button
                            type="button"
                            data-testid="field-feedback-add-note-btn"
                            onClick={() => {
                                const category = CATEGORIES.find((entry) => entry.id === categoryId) || CATEGORIES[0];
                                setNotes((prev) => [{
                                    noteId: `field-note-${Date.now()}`,
                                    account,
                                    categoryId: category.id,
                                    severity,
                                    summary,
                                    route: category.route,
                                }, ...prev].slice(0, 300));
                                setStatus("Captured field feedback note.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Add Feedback Note
                        </button>
                        <button
                            type="button"
                            data-testid="field-feedback-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    totalNotes: notes.length,
                                    notes,
                                    routeCounts,
                                };
                                downloadJson("field_feedback_weekly_summary.json", payload);
                                setStatus("Exported weekly field feedback summary.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Weekly Summary
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Route Counts</div>
                        <div className="space-y-1">
                            {Object.entries(routeCounts).map(([route, total]) => (
                                <div key={route} className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[9px] font-mono text-cyan-100">
                                    {route}: {total}
                                </div>
                            ))}
                            {!Object.keys(routeCounts).length && <div className="text-[10px] font-mono text-slate-500">No routed feedback yet.</div>}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Recent Notes</div>
                            <div className="space-y-1.5 max-h-56 overflow-auto pr-1 mt-2" aria-label="Field feedback notes">
                                {notes.slice(0, 150).map((note) => (
                                    <article key={note.noteId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="text-[10px] font-mono text-slate-100">{note.account}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{note.categoryId} · {note.severity}</div>
                                        <div className="text-[9px] font-mono text-slate-500">{note.summary}</div>
                                    </article>
                                ))}
                                {!notes.length && <div className="text-[10px] font-mono text-slate-500">No field feedback captured.</div>}
                            </div>
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
