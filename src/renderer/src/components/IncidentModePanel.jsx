import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import RecoveryPlaybookView from "./RecoveryPlaybookView.jsx";

export default function IncidentModePanel({
    open,
    onClose,
    incidents = [],
    fleetNodes = [],
    onDeclare,
    onResolve,
    onApplyPlaybook,
    onTriggerSafeMode,
}) {
    const [title, setTitle] = React.useState("Runtime Incident");
    const [severity, setSeverity] = React.useState("degraded");
    const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);
    const [activeIncidentId, setActiveIncidentId] = React.useState("");

    const safeIncidents = Array.isArray(incidents) ? incidents : [];
    const activeIncident = safeIncidents.find((incident) => String(incident.incidentId || "") === String(activeIncidentId || ""))
        || safeIncidents[0]
        || null;

    const toggleNode = (nodeId) => {
        const safe = String(nodeId || "");
        if (!safe) return;
        setSelectedNodeIds((prev) => (
            prev.includes(safe) ? prev.filter((entry) => entry !== safe) : [...prev, safe]
        ));
    };

    const declareIncident = () => {
        if (typeof onDeclare !== "function") return;
        const incident = onDeclare({
            title,
            severity,
            affectedNodes: selectedNodeIds,
        });
        if (incident && incident.incidentId) {
            setActiveIncidentId(incident.incidentId);
        }
    };

    const exportIncident = () => {
        if (!activeIncident) return;
        downloadJson(`neuralshell_incident_${activeIncident.incidentId}.json`, {
            exportedAt: new Date().toISOString(),
            incident: activeIncident,
        });
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[136] bg-black/60" onClick={onClose} />
            <section data-testid="incident-mode-panel" className="fixed inset-x-8 top-16 bottom-6 z-[137] rounded-2xl border border-rose-300/35 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-rose-300 font-bold">Incident Mode</div>
                        <div className="text-[10px] font-mono text-slate-500">Declare incidents, capture timeline, and execute recovery playbooks.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="incident-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr]">
                    <div className="p-3 border-r border-white/10 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Declare Incident</div>
                            <input
                                data-testid="incident-title-input"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                            />
                            <select
                                data-testid="incident-severity-select"
                                value={severity}
                                onChange={(event) => setSeverity(event.target.value)}
                                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                            >
                                <option value="warning">warning</option>
                                <option value="degraded">degraded</option>
                                <option value="critical">critical</option>
                            </select>
                            <div className="max-h-36 overflow-auto space-y-1 pr-1">
                                {(Array.isArray(fleetNodes) ? fleetNodes : []).map((node) => (
                                    <label key={node.nodeId} className="flex items-center gap-2 text-[9px] font-mono text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedNodeIds.includes(node.nodeId)}
                                            onChange={() => toggleNode(node.nodeId)}
                                        />
                                        {node.displayName}
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                data-testid="incident-declare-btn"
                                onClick={declareIncident}
                                className="w-full px-3 py-1.5 rounded border border-rose-300/35 bg-rose-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-rose-100"
                            >
                                Declare Incident
                            </button>
                            <button
                                type="button"
                                data-testid="incident-trigger-safe-mode-btn"
                                onClick={() => {
                                    if (typeof onTriggerSafeMode === "function") onTriggerSafeMode();
                                }}
                                className="w-full px-3 py-1.5 rounded border border-amber-300/35 bg-amber-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-amber-100"
                            >
                                Trigger Safe Mode
                            </button>
                        </section>

                        <RecoveryPlaybookView
                            onApply={(playbook) => {
                                if (typeof onApplyPlaybook === "function") {
                                    onApplyPlaybook(playbook, activeIncident);
                                }
                            }}
                        />
                    </div>

                    <div className="p-3 min-h-0 overflow-auto space-y-3">
                        <section className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Incident Queue</div>
                            <div className="space-y-1 max-h-40 overflow-auto pr-1">
                                {safeIncidents.map((incident) => (
                                    <button
                                        key={incident.incidentId}
                                        type="button"
                                        data-testid={`incident-row-${incident.incidentId}`}
                                        onClick={() => setActiveIncidentId(incident.incidentId)}
                                        className={`w-full rounded border px-2 py-1.5 text-left ${
                                            String(activeIncidentId || activeIncident && activeIncident.incidentId || "") === String(incident.incidentId)
                                                ? "border-rose-300/35 bg-rose-500/10"
                                                : "border-white/10 bg-black/25 hover:bg-white/10"
                                        }`}
                                    >
                                        <div className="text-[10px] font-mono text-slate-100">{incident.title}</div>
                                        <div className="text-[9px] font-mono text-slate-500">{incident.severity} · {incident.status}</div>
                                    </button>
                                ))}
                                {safeIncidents.length === 0 && (
                                    <div className="text-[10px] font-mono text-slate-500">No incidents declared.</div>
                                )}
                            </div>
                        </section>

                        {activeIncident && (
                            <section data-testid="incident-active-view" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] font-mono text-slate-100">{activeIncident.title}</div>
                                        <div className="text-[9px] font-mono text-slate-500">{activeIncident.incidentId} · {activeIncident.severity} · {activeIncident.status}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            data-testid="incident-export-btn"
                                            onClick={exportIncident}
                                            className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                                        >
                                            Export
                                        </button>
                                        <button
                                            type="button"
                                            data-testid="incident-resolve-btn"
                                            onClick={() => {
                                                if (typeof onResolve === "function") onResolve(activeIncident.incidentId);
                                            }}
                                            className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-auto space-y-1 pr-1">
                                    {(Array.isArray(activeIncident.timeline) ? activeIncident.timeline : []).slice(-120).reverse().map((entry, index) => (
                                        <div key={`${entry.at}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-mono text-slate-300">
                                            <div>{entry.type} · {entry.source}</div>
                                            <div className="text-slate-500">{entry.at}</div>
                                        </div>
                                    ))}
                                    {(!activeIncident.timeline || activeIncident.timeline.length === 0) && (
                                        <div className="text-[9px] font-mono text-slate-500">No timeline events captured yet.</div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}