import React from "react";

export default function NodeChainRuleEditor({
    rule,
    onChange,
}) {
    const safeRule = rule && typeof rule === "object" ? rule : null;
    if (!safeRule) {
        return (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] font-mono text-slate-500">
                Select a rule to edit.
            </div>
        );
    }

    const threshold = Number(
        safeRule
        && safeRule.conditions
        && Number.isFinite(Number(safeRule.conditions.relayFailureThreshold))
            ? Number(safeRule.conditions.relayFailureThreshold)
            : 0
    );

    return (
        <section data-testid="nodechain-rule-editor" className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Rule Editor</div>
            <label className="block text-[10px] font-mono text-slate-300">
                Label
                <input
                    value={String(safeRule.label || "")}
                    onChange={(event) => onChange({ ...safeRule, label: event.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
                />
            </label>
            <label className="block text-[10px] font-mono text-slate-300">
                Event Type
                <input
                    value={String(safeRule.eventType || "")}
                    onChange={(event) => onChange({ ...safeRule, eventType: event.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
                />
            </label>
            <label className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-300">
                <input
                    type="checkbox"
                    checked={Boolean(safeRule.enabled)}
                    onChange={(event) => onChange({ ...safeRule, enabled: Boolean(event.target.checked) })}
                />
                Enabled
            </label>
            <label className="block text-[10px] font-mono text-slate-300">
                Relay Failure Threshold (0 = disabled)
                <input
                    type="number"
                    min="0"
                    value={threshold}
                    onChange={(event) => {
                        const next = Math.max(0, Number(event.target.value || 0));
                        onChange({
                            ...safeRule,
                            conditions: {
                                ...(safeRule.conditions || {}),
                                relayFailureThreshold: next,
                            },
                        });
                    }}
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
                />
            </label>
        </section>
    );
}

