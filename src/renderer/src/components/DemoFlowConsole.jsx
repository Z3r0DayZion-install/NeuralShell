import React from "react";
import demoProfiles from "../config/demo_profiles.json";

function applySeed(seed = {}) {
    if (typeof window === "undefined" || !window.localStorage) return;
    Object.entries(seed).forEach(([key, value]) => {
        if (typeof value === "string") {
            window.localStorage.setItem(key, value);
            return;
        }
        window.localStorage.setItem(key, JSON.stringify(value));
    });
}

function clearKeys(keys = []) {
    if (typeof window === "undefined" || !window.localStorage) return;
    keys.forEach((key) => {
        window.localStorage.removeItem(String(key));
    });
}

export default function DemoFlowConsole({
    open,
    onClose,
    enabled,
    onToggleEnabled,
    onOpenPanel,
}) {
    const profiles = React.useMemo(() => (Array.isArray(demoProfiles) ? demoProfiles : []), []);
    const [activeProfileId, setActiveProfileId] = React.useState(() => {
        if (typeof window === "undefined" || !window.localStorage) return profiles[0] ? profiles[0].profileId : "";
        return String(window.localStorage.getItem("neuralshell_demo_active_profile_v1") || (profiles[0] ? profiles[0].profileId : ""));
    });
    const [status, setStatus] = React.useState("");
    const [autoplayRunning, setAutoplayRunning] = React.useState(false);

    const profile = React.useMemo(() => (
        profiles.find((entry) => String(entry && entry.profileId ? entry.profileId : "") === String(activeProfileId || "")) || profiles[0] || null
    ), [profiles, activeProfileId]);

    React.useEffect(() => {
        if (!profile) return;
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem("neuralshell_demo_active_profile_v1", String(profile.profileId || ""));
    }, [profile]);

    const handleApplySeed = React.useCallback(() => {
        if (!profile) return;
        applySeed(profile.seedLocalStorage || {});
        setStatus(`Applied demo seed: ${String(profile.title || profile.profileId)}`);
    }, [profile]);

    const handleReset = React.useCallback(() => {
        if (!profile) return;
        clearKeys(Array.isArray(profile.resetKeys) ? profile.resetKeys : []);
        applySeed(profile.seedLocalStorage || {});
        setStatus(`Reset demo baseline: ${String(profile.title || profile.profileId)}`);
    }, [profile]);

    const handleAutoplay = React.useCallback(() => {
        if (!profile || autoplayRunning) return;
        const flow = Array.isArray(profile.presenterFlow) ? profile.presenterFlow : [];
        if (!flow.length) return;
        setAutoplayRunning(true);
        let cursor = 0;
        const tick = () => {
            const step = flow[cursor];
            if (step && typeof onOpenPanel === "function") {
                onOpenPanel(String(step.panelId || ""));
            }
            cursor += 1;
            if (cursor >= flow.length) {
                setAutoplayRunning(false);
                setStatus(`Autoplay complete: ${String(profile.title || profile.profileId)}`);
                return;
            }
            window.setTimeout(tick, 1300);
        };
        tick();
    }, [autoplayRunning, onOpenPanel, profile]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[160] bg-black/60" onClick={onClose} />
            <section data-testid="demo-flow-console" className="fixed inset-x-8 top-16 bottom-6 z-[161] rounded-2xl border border-emerald-300/30 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-bold">Demo Flow Console</div>
                        <div className="text-[10px] font-mono text-slate-500">Guided institutional walkthrough with deterministic seeded state.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="demo-flow-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        x
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Demo Profile
                            <select
                                data-testid="demo-profile-select"
                                value={String(profile && profile.profileId ? profile.profileId : "")}
                                onChange={(event) => setActiveProfileId(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            >
                                {profiles.map((entry) => (
                                    <option key={entry.profileId} value={entry.profileId}>{entry.title}</option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            data-testid="demo-toggle-btn"
                            onClick={() => {
                                if (typeof onToggleEnabled === "function") onToggleEnabled(!enabled);
                            }}
                            className={`w-full px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-[0.12em] ${
                                enabled
                                    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                                    : "border-amber-300/30 bg-amber-500/10 text-amber-100"
                            }`}
                        >
                            Demo mode {enabled ? "enabled" : "disabled"}
                        </button>
                        <button
                            type="button"
                            data-testid="demo-apply-seed-btn"
                            onClick={handleApplySeed}
                            className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                        >
                            Apply Seeded State
                        </button>
                        <button
                            type="button"
                            data-testid="demo-autoplay-btn"
                            onClick={handleAutoplay}
                            className="w-full px-3 py-1.5 rounded border border-blue-300/30 bg-blue-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-blue-100"
                        >
                            {autoplayRunning ? "Autoplay Running" : "Run Guided Autoplay"}
                        </button>
                        <button
                            type="button"
                            data-testid="demo-reset-btn"
                            onClick={handleReset}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Reset Demo Baseline
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Presenter Flow</div>
                            <div className="text-[10px] text-slate-500 font-mono">Operator-safe route with deterministic panel sequence.</div>
                        </div>
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                            {(profile && Array.isArray(profile.presenterFlow) ? profile.presenterFlow : []).map((step, index) => (
                                <article key={`${String(step.panelId || "step")}-${index}`} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-slate-100">{index + 1}. {String(step.title || step.panelId || "Step")}</div>
                                    <div className="text-[9px] font-mono text-slate-400">Panel: {String(step.panelId || "")}</div>
                                    <div className="text-[9px] font-mono text-slate-500">{String(step.talkTrack || "")}</div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                {status && (
                    <div className="px-3 py-2 border-t border-white/10 bg-emerald-500/10 text-[10px] font-mono text-emerald-100">
                        {status}
                    </div>
                )}
            </section>
        </>
    );
}
