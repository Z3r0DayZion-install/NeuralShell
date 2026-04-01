import React from "react";
import { downloadJson } from "../utils/recordIO.js";
import ProvisioningWizard from "./ProvisioningWizard.jsx";
import hardwareProfiles from "../config/hardware_profiles.json";

const PROVISION_STATE_KEY = "neuralshell_hardware_appliance_provision_v1";
const HEALTH_STATE_KEY = "neuralshell_hardware_appliance_health_v1";

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

function buildDefaultHealth(profileId) {
    const seed = String(profileId || "").length;
    if (seed % 4 === 0) return { power: "healthy", trust: "healthy", relay: "healthy" };
    if (seed % 3 === 0) return { power: "healthy", trust: "expiring", relay: "healthy" };
    return { power: "healthy", trust: "healthy", relay: "degraded" };
}

function toneClass(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "healthy") return "bg-emerald-400";
    if (safe === "expiring" || safe === "degraded") return "bg-amber-400";
    if (safe === "critical" || safe === "revoked") return "bg-rose-400";
    return "bg-slate-500";
}

export default function HardwareApplianceManager({
    open,
    onClose,
}) {
    const [provisionState, setProvisionState] = React.useState(() => readJson(PROVISION_STATE_KEY, {}));
    const [healthState, setHealthState] = React.useState(() => {
        const stored = readJson(HEALTH_STATE_KEY, {});
        const base = stored && typeof stored === "object" ? stored : {};
        const out = {};
        (Array.isArray(hardwareProfiles) ? hardwareProfiles : []).forEach((profile) => {
            const profileId = String(profile.profileId || "");
            out[profileId] = base[profileId] && typeof base[profileId] === "object"
                ? base[profileId]
                : buildDefaultHealth(profileId);
        });
        return out;
    });
    const [activeProfile, setActiveProfile] = React.useState(null);
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        writeJson(PROVISION_STATE_KEY, provisionState);
    }, [provisionState]);
    React.useEffect(() => {
        writeJson(HEALTH_STATE_KEY, healthState);
    }, [healthState]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[146] bg-black/60" onClick={onClose} />
            <section data-testid="hardware-appliance-manager" className="fixed inset-x-8 top-16 bottom-6 z-[147] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Hardware Appliance Program</div>
                        <div className="text-[10px] font-mono text-slate-500">Build profiles, provisioning, support diagnostics scope, and decommission controls.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="hardware-appliance-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {(Array.isArray(hardwareProfiles) ? hardwareProfiles : []).map((profile) => {
                        const profileId = String(profile.profileId || "");
                        const health = healthState[profileId] || buildDefaultHealth(profileId);
                        const provision = provisionState[profileId] || null;
                        return (
                            <article key={profileId} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-200 font-bold">{profile.title}</div>
                                        <div className="text-[10px] font-mono text-slate-500">{profile.profileId} · role {profile.roleClass}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`h-2 w-2 rounded-full ${toneClass(health.power)}`} title={`power ${health.power}`} />
                                        <span className={`h-2 w-2 rounded-full ${toneClass(health.trust)}`} title={`trust ${health.trust}`} />
                                        <span className={`h-2 w-2 rounded-full ${toneClass(health.relay)}`} title={`relay ${health.relay}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-[9px] font-mono text-slate-300">
                                    <div className="rounded border border-white/10 bg-black/20 px-2 py-1">{profile.cpu}</div>
                                    <div className="rounded border border-white/10 bg-black/20 px-2 py-1">{profile.memoryGb}GB</div>
                                    <div className="rounded border border-white/10 bg-black/20 px-2 py-1">{profile.storageGb}GB</div>
                                    <div className="rounded border border-white/10 bg-black/20 px-2 py-1">{profile.networkMode}</div>
                                </div>
                                <div className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-mono text-slate-400">
                                    support diagnostics: {profile.supportDiagnostics.join(", ")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        data-testid={`hardware-provision-${profileId}`}
                                        onClick={() => setActiveProfile(profile)}
                                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100"
                                    >
                                        Provision
                                    </button>
                                    <button
                                        type="button"
                                        data-testid={`hardware-export-decommission-${profileId}`}
                                        onClick={() => {
                                            downloadJson(`neuralshell_${profileId}_decommission_checklist.json`, {
                                                profileId,
                                                checklist: [
                                                    "Freeze runtime policy and disable update apply.",
                                                    "Export scoped support diagnostics bundle.",
                                                    "Revoke appliance certificate and sync CRL.",
                                                    "Perform secure erase and verify wipe proof.",
                                                    "Record retirement attestation with operator sign-off.",
                                                ],
                                            });
                                        }}
                                        className="px-2 py-1 rounded border border-amber-300/35 bg-amber-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-amber-100"
                                    >
                                        Export Decommission
                                    </button>
                                </div>
                                {provision && (
                                    <div className="rounded border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono text-emerald-100">
                                        provisioned {new Date(provision.at).toLocaleString()} · role {provision.role}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>

                {status && (
                    <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">
                        {status}
                    </div>
                )}
            </section>

            <ProvisioningWizard
                open={Boolean(activeProfile)}
                profile={activeProfile}
                onClose={() => setActiveProfile(null)}
                onProvision={(payload) => {
                    const profileId = String(activeProfile && activeProfile.profileId ? activeProfile.profileId : "");
                    if (!profileId) return;
                    setProvisionState((prev) => ({
                        ...(prev && typeof prev === "object" ? prev : {}),
                        [profileId]: {
                            at: new Date().toISOString(),
                            role: String(payload && payload.role ? payload.role : "operator"),
                            completedSteps: Number(payload && payload.completedSteps ? payload.completedSteps : 0),
                            totalSteps: Number(payload && payload.totalSteps ? payload.totalSteps : 0),
                        },
                    }));
                    setHealthState((prev) => ({
                        ...(prev && typeof prev === "object" ? prev : {}),
                        [profileId]: {
                            power: "healthy",
                            trust: "healthy",
                            relay: "healthy",
                        },
                    }));
                    setStatus(`Provisioning applied for ${activeProfile.title}.`);
                    setActiveProfile(null);
                }}
            />
        </>
    );
}
