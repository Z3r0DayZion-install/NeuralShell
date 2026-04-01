import React from "react";
import starterRules from "../config/nodechain_starter_rules.json";
import { NodeChainEngine } from "../runtime/nodechain/engine.ts";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";
import NodeChainRuleEditor from "./NodeChainRuleEditor.jsx";

const STORAGE_RULES_KEY = "neuralshell_nodechain_rules_v1";
const COMMAND_ALLOWLIST = ["releaseHealth:check", "audit:verify", "verification:run"];
const EVENT_TYPES = [
    "provider.sweep.passed",
    "provider.sweep.failed",
    "vault.unlocked",
    "vault.locked",
    "proof.started",
    "proof.passed",
    "proof.failed",
    "relay.sent",
    "relay.failed",
    "policy.changed",
    "update.verification.failed",
    "collab.peer.joined",
    "collab.peer.left",
    "runtime.watchdog.alert",
];

function loadRules() {
    if (typeof window === "undefined" || !window.localStorage) return starterRules;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_RULES_KEY) || "[]");
        if (!Array.isArray(parsed) || !parsed.length) return starterRules;
        return parsed;
    } catch {
        return starterRules;
    }
}

export default function NodeChainPanel({
    open,
    onClose,
    onSnapshotRequest,
    onOpenPanel,
}) {
    const [rules, setRules] = React.useState(() => loadRules());
    const [selectedRuleId, setSelectedRuleId] = React.useState(() => String((loadRules()[0] && loadRules()[0].id) || ""));
    const [logs, setLogs] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [manualEventType, setManualEventType] = React.useState(EVENT_TYPES[0]);
    const [dryRun, setDryRun] = React.useState(true);

    const engineRef = React.useRef(null);

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(rules || []));
        }
    }, [rules]);

    const buildEngine = React.useCallback((activeRules) => {
        const engine = new NodeChainEngine(activeRules || [], {
            showAlert: (payload) => {
                appendRuntimeEvent("nodechain.alert", payload || {}, {
                    severity: String(payload && payload.severity ? payload.severity : "warning"),
                    source: "nodechain",
                });
            },
            openPanel: (payload) => {
                const panel = String(payload && payload.panel ? payload.panel : "");
                if (typeof onOpenPanel === "function") {
                    onOpenPanel(panel);
                }
            },
            shareProofBadge: async () => {
                if (window.api && window.api.system && typeof window.api.system.openExternal === "function") {
                    await window.api.system.openExternal("https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/proof_badge.svg");
                }
            },
            snapshotState: async () => {
                if (typeof onSnapshotRequest === "function") {
                    await onSnapshotRequest();
                }
            },
            disableRelay: async () => {
                if (!(window.api && window.api.settings && typeof window.api.settings.get === "function")) return;
                const current = await window.api.settings.get();
                await window.api.settings.update({
                    ...(current || {}),
                    proofRelayEnabled: false,
                });
            },
            blockUpdateApply: async () => {
                if (window.api && window.api.autoUpdate && typeof window.api.autoUpdate.setPolicy === "function") {
                    await window.api.autoUpdate.setPolicy({ autoApply: false, blockedBy: "nodechain" });
                }
            },
            promptVaultSave: async () => {
                window.dispatchEvent(new window.CustomEvent("neuralshell:prompt-vault-save"));
            },
            writeAuditLog: async (payload) => {
                if (window.api && window.api.audit && typeof window.api.audit.append === "function") {
                    await window.api.audit.append({
                        event: "nodechain_action",
                        ...(payload || {}),
                    });
                }
            },
            switchSafePolicy: async () => {
                if (!(window.api && window.api.settings && typeof window.api.settings.get === "function")) return;
                const current = await window.api.settings.get();
                await window.api.settings.update({
                    ...(current || {}),
                    offlineOnlyEnforced: true,
                    allowRemoteBridge: false,
                    autoUpdateChannel: "frozen",
                });
            },
            runLocalScript: async (payload) => {
                if (!(window.api && window.api.command && typeof window.api.command.run === "function")) return;
                const commandId = String(payload && payload.commandId ? payload.commandId : "");
                await window.api.command.run(commandId, payload && payload.args ? payload.args : []);
            },
        }, COMMAND_ALLOWLIST);
        return engine;
    }, [onOpenPanel, onSnapshotRequest]);

    React.useEffect(() => {
        const engine = buildEngine(rules);
        engineRef.current = engine;
        engine.start();
        return () => {
            engine.stop();
            engineRef.current = null;
        };
    }, [buildEngine, rules]);

    const runManualEvent = async () => {
        if (!engineRef.current) return;
        setBusy(true);
        try {
            const results = await engineRef.current.dispatch({
                type: manualEventType,
                at: new Date().toISOString(),
                payload: {
                    source: "manual-trigger",
                },
            }, dryRun);
            const nextLogs = engineRef.current.getLogs();
            setLogs(nextLogs);
            appendRuntimeEvent("nodechain.manual.dispatch", {
                eventType: manualEventType,
                dryRun,
                rulesEvaluated: Array.isArray(results) ? results.length : 0,
            }, { source: "nodechain", severity: "info" });
        } finally {
            setBusy(false);
        }
    };

    const selectedRule = (rules || []).find((entry) => String(entry.id || "") === selectedRuleId) || null;

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[122] bg-black/60" onClick={onClose} />
            <section data-testid="nodechain-panel" className="fixed inset-x-8 top-20 bottom-8 z-[123] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">NodeChain Runtime Engine</div>
                        <div className="text-[10px] font-mono text-slate-500">Local rule listeners, dry-run simulation, action logs, and allowlisted automation.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="nodechain-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 xl:grid-cols-[420px_1fr]">
                    <div className="border-r border-white/10 p-3 overflow-auto space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-bold">Manual Event Dispatch</div>
                            <select
                                data-testid="nodechain-event-select"
                                value={manualEventType}
                                onChange={(event) => setManualEventType(event.target.value)}
                                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
                            >
                                {EVENT_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <label className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={dryRun}
                                    onChange={(event) => setDryRun(Boolean(event.target.checked))}
                                />
                                Dry-run mode
                            </label>
                            <button
                                type="button"
                                data-testid="nodechain-run-event-btn"
                                disabled={busy}
                                onClick={runManualEvent}
                                className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-60"
                            >
                                {busy ? "Running..." : "Dispatch Event"}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(rules || []).map((rule) => (
                                <button
                                    key={rule.id}
                                    type="button"
                                    data-testid={`nodechain-rule-${rule.id}`}
                                    onClick={() => setSelectedRuleId(String(rule.id || ""))}
                                    className={`w-full rounded-xl border p-2 text-left ${
                                        String(rule.id || "") === selectedRuleId
                                            ? "border-cyan-300/30 bg-cyan-500/10"
                                            : "border-white/10 bg-black/20 hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[10px] font-mono text-slate-100">{String(rule.label || rule.id)}</div>
                                        <label className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(rule.enabled)}
                                                onChange={(event) => {
                                                    event.stopPropagation();
                                                    setRules((prev) => (Array.isArray(prev) ? prev.map((entry) => (
                                                        String(entry.id || "") === String(rule.id || "")
                                                            ? { ...entry, enabled: Boolean(event.target.checked) }
                                                            : entry
                                                    )) : prev));
                                                }}
                                            />
                                            enabled
                                        </label>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500 mt-0.5">{String(rule.eventType || "unknown")}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-3 overflow-auto space-y-3">
                        <NodeChainRuleEditor
                            rule={selectedRule}
                            onChange={(nextRule) => {
                                setRules((prev) => (Array.isArray(prev) ? prev.map((entry) => (
                                    String(entry.id || "") === String(nextRule.id || "")
                                        ? nextRule
                                        : entry
                                )) : prev));
                            }}
                        />

                        <section data-testid="nodechain-logs" className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Execution Logs</div>
                            <div className="max-h-[360px] overflow-auto space-y-1.5 pr-1">
                                {(logs || []).slice(-120).reverse().map((log) => (
                                    <article key={log.id} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                            <span className="text-slate-200">{log.ruleId}</span>
                                            <span className="text-slate-500">{String(log.status || "unknown")}</span>
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-500">{log.eventType} · {log.at}</div>
                                        <div className="text-[9px] font-mono text-slate-400">{log.detail}</div>
                                    </article>
                                ))}
                                {(!logs || logs.length === 0) && (
                                    <div className="text-[10px] font-mono text-slate-500">No rule execution logs yet.</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </>
    );
}

