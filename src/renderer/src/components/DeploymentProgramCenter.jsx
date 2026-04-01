import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const PREFLIGHT_REPORT_KEY = "neuralshell_deployment_preflight_report_v1";
const POSTINSTALL_REPORT_KEY = "neuralshell_deployment_postinstall_report_v1";

function runMockPreflight() {
    const report = {
        generatedAt: new Date().toISOString(),
        passed: true,
        checks: [
            { label: "OS baseline", passed: true },
            { label: "PKI trust bundle", passed: true },
            { label: "Air-gap transfer controls", passed: true },
            { label: "Deployment runbooks", passed: true },
        ],
    };
    window.localStorage.setItem(PREFLIGHT_REPORT_KEY, JSON.stringify(report));
    return report;
}

function runMockPostinstall() {
    const report = {
        generatedAt: new Date().toISOString(),
        passed: true,
        checks: [
            { label: "Runtime smoke", passed: true },
            { label: "Trust chain", passed: true },
            { label: "Policy baseline", passed: true },
            { label: "Evidence export", passed: true },
        ],
    };
    window.localStorage.setItem(POSTINSTALL_REPORT_KEY, JSON.stringify(report));
    return report;
}

export default function DeploymentProgramCenter({ open, onClose }) {
    const [status, setStatus] = React.useState("");

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[162] bg-black/60" onClick={onClose} />
            <section data-testid="deployment-program-center" className="fixed inset-x-8 top-16 bottom-6 z-[163] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Deployment Program Pack</div>
                        <div className="text-[10px] font-mono text-slate-500">Runbook and validation control surface for institutional deployment teams.</div>
                    </div>
                    <button type="button" data-testid="deployment-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Validation</div>
                        <button
                            type="button"
                            data-testid="deployment-run-preflight-btn"
                            onClick={() => {
                                const report = runMockPreflight();
                                setStatus(`Preflight ${report.passed ? "PASS" : "FAIL"}`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Run Preflight Check
                        </button>
                        <button
                            type="button"
                            data-testid="deployment-run-postinstall-btn"
                            onClick={() => {
                                const report = runMockPostinstall();
                                setStatus(`Post-install ${report.passed ? "PASS" : "FAIL"}`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Run Post-install Check
                        </button>
                        <button
                            type="button"
                            data-testid="deployment-export-checklist-btn"
                            onClick={() => {
                                downloadJson("deployment_program_checklist.json", {
                                    generatedAt: new Date().toISOString(),
                                    roles: ["it_admin", "security_admin", "platform_operator", "support_engineer"],
                                    runbooks: ["standard", "airgap", "appliance", "oversight", "pki"],
                                });
                                setStatus("Exported deployment checklist.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-blue-100"
                        >
                            Export Checklist
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Runbook Coverage</div>
                        <ul className="text-[10px] font-mono text-slate-300 list-disc pl-4 space-y-1">
                            <li>Standard desktop install</li>
                            <li>Air-gapped install</li>
                            <li>Hardware appliance install</li>
                            <li>Oversight node install</li>
                            <li>PKI-enabled install</li>
                            <li>Rollback and decommission</li>
                            <li>Upgrade ring promotion</li>
                        </ul>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
