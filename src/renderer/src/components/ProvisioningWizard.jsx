import React from "react";

const ROLE_OPTIONS = ["operator", "support", "security", "founder"];

export default function ProvisioningWizard({
    open,
    profile,
    onClose,
    onProvision,
}) {
    const [role, setRole] = React.useState("operator");
    const [steps, setSteps] = React.useState({
        baselinePolicy: true,
        identityBinding: true,
        trustCheck: true,
        diagnosticsCheck: true,
    });

    React.useEffect(() => {
        if (!open) {
            setRole("operator");
            setSteps({
                baselinePolicy: true,
                identityBinding: true,
                trustCheck: true,
                diagnosticsCheck: true,
            });
        }
    }, [open]);

    if (!open || !profile) return null;

    const completed = Object.values(steps).filter(Boolean).length;
    const total = Object.keys(steps).length;

    return (
        <>
            <div className="fixed inset-0 z-[156] bg-black/55" onClick={onClose} />
            <section data-testid="provisioning-wizard" className="fixed inset-x-[20%] top-[18%] z-[157] rounded-2xl border border-cyan-300/30 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.7)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Provisioning Wizard</div>
                        <div className="text-[10px] font-mono text-slate-500">{profile.title} · {profile.profileId}</div>
                    </div>
                    <button
                        type="button"
                        data-testid="provisioning-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <label className="block text-[10px] font-mono text-slate-300">
                    Role Binding
                    <select
                        data-testid="provisioning-role-select"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    >
                        {ROLE_OPTIONS.map((entry) => (
                            <option key={entry} value={entry}>{entry}</option>
                        ))}
                    </select>
                </label>

                <div className="rounded border border-white/10 bg-black/20 p-2 space-y-1">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-bold">First-Boot Controls ({completed}/{total})</div>
                    <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={steps.baselinePolicy}
                            onChange={(event) => setSteps((prev) => ({ ...prev, baselinePolicy: Boolean(event.target.checked) }))}
                        />
                        Baseline policy applied
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={steps.identityBinding}
                            onChange={(event) => setSteps((prev) => ({ ...prev, identityBinding: Boolean(event.target.checked) }))}
                        />
                        Identity and certificate binding complete
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={steps.trustCheck}
                            onChange={(event) => setSteps((prev) => ({ ...prev, trustCheck: Boolean(event.target.checked) }))}
                        />
                        Trust chain and update signature verified
                    </label>
                    <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                        <input
                            type="checkbox"
                            checked={steps.diagnosticsCheck}
                            onChange={(event) => setSteps((prev) => ({ ...prev, diagnosticsCheck: Boolean(event.target.checked) }))}
                        />
                        Diagnostics baseline captured
                    </label>
                </div>

                <button
                    type="button"
                    data-testid="provisioning-apply-btn"
                    onClick={() => {
                        if (typeof onProvision === "function") {
                            onProvision({
                                role,
                                completedSteps: completed,
                                totalSteps: total,
                            });
                        }
                    }}
                    className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                >
                    Apply Provisioning
                </button>
            </section>
        </>
    );
}
