import React from "react";

export default function VaultPanelPlus({
    vaultState,
    onPromptSave,
    onOpenSettings,
}) {
    const state = vaultState && typeof vaultState === "object" ? vaultState : {};
    const locked = Boolean(state.locked);

    return (
        <section
            data-testid="vault-panel-plus"
            aria-label="Vault Panel Plus"
            className="rounded-2xl border border-white/10 bg-black/35 p-3 space-y-3"
        >
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-300 font-bold">VaultPanel+</div>
                    <div className="text-[10px] text-slate-500 font-mono">Local profile custody, restore posture, and policy binding.</div>
                </div>
                <div className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                    locked
                        ? "border-amber-300/40 bg-amber-500/10 text-amber-100"
                        : "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                }`}>
                    {locked ? "locked" : "unlocked"}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-[10px] font-mono">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Active Profile</span>
                    <span className="text-slate-200 break-all">{String(state.activeProfile || "default")}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Import/Export</span>
                    <span className="text-slate-200 break-all">{String(state.exportImportStatus || "idle")}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Policy Bound</span>
                    <span className="text-slate-200">{state.policyBound ? "yes" : "no"}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    data-testid="vault-panel-plus-save-btn"
                    onClick={onPromptSave}
                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                >
                    Prompt Vault Save
                </button>
                <button
                    type="button"
                    data-testid="vault-panel-plus-settings-btn"
                    onClick={onOpenSettings}
                    className="px-2.5 py-1.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10"
                >
                    Settings
                </button>
            </div>
        </section>
    );
}

