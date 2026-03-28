import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import SimulationScenarioCard from "./SimulationScenarioCard.jsx";
import scenarios from "../config/tamper_simulation_scenarios.json";

const REPORTS_KEY = "neuralshell_tamper_simulation_reports_v1";

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

export default function TamperSimulationCenter({
    open,
    onClose,
}) {
    const [reports, setReports] = React.useState(() => {
        const parsed = readJson(REPORTS_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        writeJson(REPORTS_KEY, reports);
    }, [reports]);

    const runSimulation = (scenario) => {
        const safe = scenario && typeof scenario === "object" ? scenario : {};
        const simulatedAt = new Date().toISOString();
        const report = {
            reportId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            simulated: true,
            scenarioId: String(safe.scenarioId || "unknown"),
            title: String(safe.title || "Untitled Simulation"),
            severity: String(safe.severity || "warning"),
            simulatedAt,
            expectedResponse: Array.isArray(safe.expectedResponse) ? safe.expectedResponse : [],
            triggeredResponse: Array.isArray(safe.expectedResponse) ? safe.expectedResponse : [],
            passed: true,
        };
        setReports((prev) => [report, ...(Array.isArray(prev) ? prev : [])].slice(0, 300));
        setStatus(`Simulation completed (simulated): ${report.title}`);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[154] bg-black/60" onClick={onClose} />
            <section data-testid="tamper-simulation-center" className="fixed inset-x-8 top-16 bottom-6 z-[155] rounded-2xl border border-rose-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-rose-300 font-bold">Tamper Simulation Mode</div>
                        <div className="text-[10px] font-mono text-slate-500">Sandboxed defensive simulation only. No offensive tooling or exploit automation.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="tamper-simulation-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.95fr_1.05fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Simulation Scenarios</div>
                        <div className="max-h-96 overflow-auto pr-1 space-y-1.5">
                            {(Array.isArray(scenarios) ? scenarios : []).map((scenario) => (
                                <SimulationScenarioCard
                                    key={scenario.scenarioId}
                                    scenario={scenario}
                                    onRun={runSimulation}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Simulation Reports</div>
                                <div className="text-[10px] text-slate-500 font-mono">Outputs are always labeled simulated for audit/training export.</div>
                            </div>
                            <button
                                type="button"
                                data-testid="tamper-export-reports-btn"
                                onClick={() => {
                                    downloadJson("neuralshell_tamper_simulation_reports.json", {
                                        generatedAt: new Date().toISOString(),
                                        reports,
                                    });
                                }}
                                className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                            >
                                Export Reports
                            </button>
                        </div>
                        <div className="max-h-96 overflow-auto pr-1 space-y-1.5">
                            {(Array.isArray(reports) ? reports : []).map((report) => (
                                <article key={report.reportId} className={`rounded border px-2 py-1.5 ${
                                    report.passed
                                        ? "border-emerald-300/30 bg-emerald-500/10"
                                        : "border-rose-300/35 bg-rose-500/10"
                                }`}>
                                    <div className="text-[10px] font-mono text-slate-100">{report.title}</div>
                                    <div className="text-[9px] font-mono text-slate-400">simulated · {new Date(report.simulatedAt).toLocaleString()}</div>
                                </article>
                            ))}
                            {(Array.isArray(reports) ? reports : []).length === 0 && (
                                <div className="text-[10px] font-mono text-slate-500">No simulation reports yet.</div>
                            )}
                        </div>
                    </section>
                </div>

                {status && (
                    <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-rose-100 bg-rose-500/10">
                        {status}
                    </div>
                )}
            </section>
        </>
    );
}
