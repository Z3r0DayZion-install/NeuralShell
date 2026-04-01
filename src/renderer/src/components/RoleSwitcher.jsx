import React from "react";
import { ROLE_CAPABILITIES } from "../runtime/roles/roleCapabilities.ts";

export default function RoleSwitcher({
    role,
    onChange,
}) {
    const safeRole = String(role || "operator").toLowerCase();
    const capabilities = ROLE_CAPABILITIES[safeRole] || ROLE_CAPABILITIES.operator;

    return (
        <section data-testid="role-switcher" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Role Switcher</div>
            <select
                data-testid="role-switcher-select"
                value={safeRole}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-200"
            >
                <option value="founder">Founder</option>
                <option value="operator">Operator</option>
                <option value="support">Support</option>
                <option value="security">Security/Compliance</option>
                <option value="sales">Sales/Success</option>
            </select>
            <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5 text-[9px] font-mono text-slate-400">
                {Object.entries(capabilities).map(([key, enabled]) => (
                    <div key={key}>{key}: <span className={enabled ? "text-emerald-300" : "text-slate-500"}>{enabled ? "yes" : "no"}</span></div>
                ))}
            </div>
        </section>
    );
}