import React from "react";
import templates from "../config/nodechain_mission_templates.json";
import { MissionEngine } from "../runtime/nodechain/missions/missionEngine.ts";
import MissionHistoryPanel from "./MissionHistoryPanel.jsx";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

const STORAGE_KEY = "neuralshell_nodechain_mission_schedules_v1";

function readSchedules() {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function toNumber(value, fallback = 1) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export default function MissionScheduler({
    open,
    onClose,
    fleet,
    onOpenIncidentMode,
}) {
    const [schedules, setSchedules] = React.useState(() => readSchedules());
    const [selectedMissionId, setSelectedMissionId] = React.useState(() => String((templates[0] && templates[0].missionId) || ""));
    const [targetNodeIds, setTargetNodeIds] = React.useState([]);
    const [dryRun, setDryRun] = React.useState(true);
    const [intervalMinutes, setIntervalMinutes] = React.useState(30);
    const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
    const [history, setHistory] = React.useState([]);

    const engineRef = React.useRef(null);

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    }, [schedules]);

    React.useEffect(() => {
        const engine = new MissionEngine(schedules, {
            onRun: (entry) => {
                setHistory((prev) => [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 300));
                appendRuntimeEvent("nodechain.mission.run", {
                    missionId: entry.missionId,
                    dryRun: entry.dryRun,
                    status: entry.status,
                }, { source: "nodechain-missions", severity: entry.dryRun ? "info" : "warning" });
                if (!entry.dryRun && entry.missionId === "degraded_node_incident_trigger" && typeof onOpenIncidentMode === "function") {
                    onOpenIncidentMode();
                }
            },
        });
        engineRef.current = engine;
        engine.start();
        return () => {
            engine.stop();
            engineRef.current = null;
        };
    }, [onOpenIncidentMode, schedules]);

    const selectedTemplate = React.useMemo(() => (
        templates.find((entry) => String(entry.missionId || "") === String(selectedMissionId || "")) || null
    ), [selectedMissionId]);

    const nodes = Array.isArray(fleet && fleet.nodes) ? fleet.nodes : [];

    const toggleNode = (nodeId) => {
        const safe = String(nodeId || "");
        setTargetNodeIds((prev) => (
            prev.includes(safe)
                ? prev.filter((entry) => entry !== safe)
                : [...prev, safe]
        ));
    };

    const runNow = async () => {
        if (!engineRef.current || !selectedTemplate) return;
        await engineRef.current.runMission(selectedTemplate, {
            dryRun,
            targetNodeIds,
        });
    };

    const saveSchedule = () => {
        if (!selectedTemplate) return;
        const missionId = String(selectedTemplate.missionId || "");
        const nextSchedule = {
            missionId,
            enabled: Boolean(scheduleEnabled),
            intervalMs: Math.max(1000, Math.round(toNumber(intervalMinutes, 1) * 60000)),
            dryRun: Boolean(dryRun),
            targetNodeIds: targetNodeIds.slice(),
        };
        setSchedules((prev) => {
            const base = Array.isArray(prev) ? prev : [];
            const exists = base.some((entry) => String(entry.missionId || "") === missionId);
            if (exists) {
                return base.map((entry) => (
                    String(entry.missionId || "") === missionId ? nextSchedule : entry
                ));
            }
            return [...base, nextSchedule];
        });
    };

    const pauseSchedule = () => {
        if (!selectedTemplate) return;
        const missionId = String(selectedTemplate.missionId || "");
        setSchedules((prev) => (Array.isArray(prev) ? prev.map((entry) => (
            String(entry.missionId || "") === missionId
                ? { ...entry, enabled: false }
                : entry
        )) : prev));
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[142] bg-black/60" onClick={onClose} />
            <section data-testid="mission-scheduler" className="fixed inset-x-8 top-20 bottom-8 z-[143] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">NodeChain Mission Scheduler</div>
                        <div className="text-[10px] font-mono text-slate-500">Template-driven orchestration with dry-run, schedules, and history.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="mission-scheduler-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Mission Template</div>
                            <select
                                data-testid="mission-template-select"
                                value={selectedMissionId}
                                onChange={(event) => {
                                    setSelectedMissionId(event.target.value);
                                    const template = templates.find((entry) => String(entry.missionId || "") === String(event.target.value || ""));
                                    if (template) {
                                        setDryRun(Boolean(template.defaultDryRun));
                                        setIntervalMinutes(Number(template.defaultScheduleMinutes || 30));
                                    }
                                }}
                                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                            >
                                {templates.map((template) => (
                                    <option key={template.missionId} value={template.missionId}>{template.label}</option>
                                ))}
                            </select>
                            {selectedTemplate && (
                                <div className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-mono text-slate-400">
                                    {selectedTemplate.description}
                                </div>
                            )}
                            <label className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={dryRun}
                                    onChange={(event) => setDryRun(Boolean(event.target.checked))}
                                />
                                Dry-run
                            </label>
                            <label className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={scheduleEnabled}
                                    onChange={(event) => setScheduleEnabled(Boolean(event.target.checked))}
                                />
                                Schedule enabled
                            </label>
                            <label className="text-[10px] font-mono text-slate-300 block">
                                Interval Minutes
                                <input
                                    data-testid="mission-interval-input"
                                    type="number"
                                    min="1"
                                    value={intervalMinutes}
                                    onChange={(event) => setIntervalMinutes(Math.max(1, Number(event.target.value || 1)))}
                                    className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1"
                                />
                            </label>
                        </section>

                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Target Nodes</div>
                            <div className="max-h-36 overflow-auto space-y-1 pr-1">
                                {nodes.map((node) => (
                                    <label key={node.nodeId} className="flex items-center gap-2 text-[9px] font-mono text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={targetNodeIds.includes(node.nodeId)}
                                            onChange={() => toggleNode(node.nodeId)}
                                        />
                                        {node.displayName}
                                    </label>
                                ))}
                                {nodes.length === 0 && <div className="text-[9px] font-mono text-slate-500">No nodes in fleet.</div>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    data-testid="mission-run-now-btn"
                                    onClick={runNow}
                                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                                >
                                    Run Now
                                </button>
                                <button
                                    type="button"
                                    data-testid="mission-save-schedule-btn"
                                    onClick={saveSchedule}
                                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                                >
                                    Save Schedule
                                </button>
                                <button
                                    type="button"
                                    data-testid="mission-pause-schedule-btn"
                                    onClick={pauseSchedule}
                                    className="px-2.5 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-amber-100"
                                >
                                    Pause
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <MissionHistoryPanel
                            history={history}
                            onCancel={(runId) => {
                                if (!engineRef.current) return;
                                engineRef.current.cancelRun(runId);
                                setHistory(engineRef.current.getHistory().slice().reverse());
                            }}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}