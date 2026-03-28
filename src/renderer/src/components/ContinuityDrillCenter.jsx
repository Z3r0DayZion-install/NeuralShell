import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import DrillTemplateEditor from "./DrillTemplateEditor.jsx";
import RecoveryScorecard from "./RecoveryScorecard.jsx";
import defaultTemplates from "../config/continuity_drill_templates.json";

const TEMPLATES_KEY = "neuralshell_continuity_templates_v1";
const SCHEDULES_KEY = "neuralshell_continuity_schedules_v1";
const RUNS_KEY = "neuralshell_continuity_runs_v1";

function readJson(key, fallback) {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
        return parsed == null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

function compareState(expected, actual) {
    const left = expected && typeof expected === "object" ? expected : {};
    const right = actual && typeof actual === "object" ? actual : {};
    const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
    return keys
        .map((key) => ({
            key,
            expected: left[key],
            actual: right[key],
        }))
        .filter((entry) => JSON.stringify(entry.expected) !== JSON.stringify(entry.actual));
}

function scoreRuns(runs) {
    const safe = Array.isArray(runs) ? runs : [];
    if (!safe.length) return { score: 0, passed: 0, failed: 0, total: 0 };
    const passed = safe.filter((entry) => entry && entry.passed).length;
    return {
        score: Math.round((passed / safe.length) * 100),
        passed,
        failed: safe.length - passed,
        total: safe.length,
    };
}

export default function ContinuityDrillCenter({
    open,
    onClose,
}) {
    const [templates, setTemplates] = React.useState(() => {
        const parsed = readJson(TEMPLATES_KEY, defaultTemplates);
        return Array.isArray(parsed) && parsed.length ? parsed : defaultTemplates;
    });
    const [selectedTemplateId, setSelectedTemplateId] = React.useState(() => {
        const first = Array.isArray(defaultTemplates) && defaultTemplates.length ? defaultTemplates[0] : null;
        return first ? first.templateId : "";
    });
    const [scheduleAt, setScheduleAt] = React.useState("");
    const [scheduledRuns, setScheduledRuns] = React.useState(() => {
        const parsed = readJson(SCHEDULES_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [drillRuns, setDrillRuns] = React.useState(() => {
        const parsed = readJson(RUNS_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [simulateFailure, setSimulateFailure] = React.useState(false);
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        writeJson(TEMPLATES_KEY, templates);
    }, [templates]);
    React.useEffect(() => {
        writeJson(SCHEDULES_KEY, scheduledRuns);
    }, [scheduledRuns]);
    React.useEffect(() => {
        writeJson(RUNS_KEY, drillRuns);
    }, [drillRuns]);

    const selectedTemplate = React.useMemo(
        () => (Array.isArray(templates) ? templates : []).find((entry) => entry.templateId === selectedTemplateId) || null,
        [selectedTemplateId, templates],
    );
    const score = React.useMemo(() => scoreRuns(drillRuns), [drillRuns]);

    const runDrill = () => {
        if (!selectedTemplate) return;
        const expected = selectedTemplate.expectedState && typeof selectedTemplate.expectedState === "object"
            ? selectedTemplate.expectedState
            : {};
        let actual = { ...expected };
        if (simulateFailure) {
            const keys = Object.keys(expected);
            const targetKey = keys[0] || "unexpectedState";
            actual[targetKey] = expected[targetKey] === true ? false : `mismatch-${Date.now()}`;
        }
        const deltas = compareState(expected, actual);
        const now = new Date().toISOString();
        const run = {
            runId: `drill-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            templateId: selectedTemplate.templateId,
            title: selectedTemplate.title,
            startedAt: now,
            finishedAt: now,
            passed: deltas.length === 0,
            expectedState: expected,
            actualState: actual,
            deltas,
            evidence: {
                artifactId: `drill-evidence-${Date.now()}`,
                generatedAt: now,
                summary: deltas.length === 0
                    ? "Drill passed expected recovery state."
                    : `Drill failed with ${deltas.length} delta(s).`,
                attachablePacks: ["audit", "support", "board"],
            },
        };
        setDrillRuns((prev) => [run, ...(Array.isArray(prev) ? prev : [])].slice(0, 300));
        setStatus(`Drill ${run.passed ? "passed" : "failed"}: ${run.title}`);
    };

    const scheduleDrill = () => {
        if (!selectedTemplate || !scheduleAt) return;
        setScheduledRuns((prev) => [{
            scheduleId: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            templateId: selectedTemplate.templateId,
            title: selectedTemplate.title,
            scheduledAt: scheduleAt,
            status: "scheduled",
        }, ...(Array.isArray(prev) ? prev : [])].slice(0, 200));
        setStatus(`Scheduled ${selectedTemplate.title} for ${new Date(scheduleAt).toLocaleString()}.`);
        setScheduleAt("");
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[150] bg-black/60" onClick={onClose} />
            <section data-testid="continuity-drill-center" className="fixed inset-x-8 top-16 bottom-6 z-[151] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Continuity Drill Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Schedule and run repeatable recovery drills with evidence bundles and scorecard output.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="continuity-drill-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-3 border-b border-white/10 flex items-center gap-2">
                    <input
                        type="datetime-local"
                        data-testid="continuity-schedule-input"
                        value={scheduleAt}
                        onChange={(event) => setScheduleAt(event.target.value)}
                        className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-100"
                    />
                    <button
                        type="button"
                        data-testid="continuity-schedule-btn"
                        onClick={scheduleDrill}
                        className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                    >
                        Schedule Drill
                    </button>
                    <label className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            data-testid="continuity-simulate-failure"
                            checked={simulateFailure}
                            onChange={(event) => setSimulateFailure(Boolean(event.target.checked))}
                        />
                        simulate failure
                    </label>
                    <button
                        type="button"
                        data-testid="continuity-run-btn"
                        onClick={runDrill}
                        className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                    >
                        Run Drill
                    </button>
                    <button
                        type="button"
                        data-testid="continuity-export-evidence-btn"
                        onClick={() => {
                            const latest = Array.isArray(drillRuns) && drillRuns.length ? drillRuns[0] : null;
                            if (!latest) return;
                            downloadJson(`neuralshell_continuity_evidence_${latest.runId}.json`, latest);
                        }}
                        className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                    >
                        Export Evidence
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr] gap-3 p-3 overflow-auto">
                    <div className="space-y-3">
                        <DrillTemplateEditor
                            templates={templates}
                            selectedTemplateId={selectedTemplateId}
                            onSelectTemplate={setSelectedTemplateId}
                            onUpdateTemplates={setTemplates}
                        />
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-1">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Scheduled Drills</div>
                            <div className="max-h-[180px] overflow-auto pr-1 space-y-1">
                                {(Array.isArray(scheduledRuns) ? scheduledRuns : []).map((entry) => (
                                    <article key={entry.scheduleId} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-mono text-slate-300">
                                        {entry.title} · {new Date(entry.scheduledAt).toLocaleString()}
                                    </article>
                                ))}
                                {(Array.isArray(scheduledRuns) ? scheduledRuns : []).length === 0 && (
                                    <div className="text-[10px] font-mono text-slate-500">No drills scheduled.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-3">
                        <RecoveryScorecard score={score} runs={drillRuns} />
                        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-1">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Drill Runs</div>
                            <div className="max-h-[200px] overflow-auto pr-1 space-y-1.5">
                                {(Array.isArray(drillRuns) ? drillRuns : []).map((run) => (
                                    <article key={run.runId} className={`rounded border px-2 py-1.5 ${
                                        run.passed
                                            ? "border-emerald-300/30 bg-emerald-500/10"
                                            : "border-rose-300/35 bg-rose-500/10"
                                    }`}>
                                        <div className="text-[10px] font-mono text-slate-100">{run.title}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{run.passed ? "passed" : "failed"} · {run.evidence.artifactId}</div>
                                    </article>
                                ))}
                                {(Array.isArray(drillRuns) ? drillRuns : []).length === 0 && (
                                    <div className="text-[10px] font-mono text-slate-500">No drill runs yet.</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {status && (
                    <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-cyan-100 bg-cyan-500/10">
                        {status}
                    </div>
                )}
            </section>
        </>
    );
}
