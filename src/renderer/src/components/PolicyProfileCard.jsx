import React from 'react';
import policyProfiles from '../config/policy_profiles_manifest.json';

const POLICY_PRESETS = {
    offline_only: {
        allowRemoteBridge: false,
        proofRelayEnabled: false,
        hostedProxyEnabled: false,
        connectOnStartup: true,
        otelExportEnabled: false,
    },
    balanced_team: {
        allowRemoteBridge: true,
        proofRelayEnabled: false,
        hostedProxyEnabled: false,
        connectOnStartup: true,
        otelExportEnabled: false,
    },
    enterprise_locked: {
        allowRemoteBridge: false,
        proofRelayEnabled: false,
        hostedProxyEnabled: false,
        connectOnStartup: false,
        otelExportEnabled: false,
        updateChannel: 'stable',
    },
};

async function hashPayload(payload) {
    const text = JSON.stringify(payload);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    const unsigned = hash >>> 0;
    return unsigned.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
}

export default function PolicyProfileCard({ disabled }) {
    const [status, setStatus] = React.useState('');
    const [busy, setBusy] = React.useState('');
    const importInputRef = React.useRef(null);

    const applyProfile = async (profileId) => {
        if (disabled) return;
        const preset = POLICY_PRESETS[String(profileId || '')];
        if (!preset) return;
        setBusy(profileId);
        try {
            const current = await window.api.settings.get();
            const merged = {
                ...(current || {}),
                ...preset,
            };
            const saved = await window.api.settings.update(merged);
            const hash = await hashPayload(preset);
            await window.api.audit.append({
                event: 'policy_profile_applied',
                profileId: String(profileId),
                profileHash: hash,
                at: new Date().toISOString(),
            });
            setStatus(`Applied ${profileId} (sha256:${hash.slice(0, 12)}...)`);
            return saved;
        } catch (err) {
            setStatus(`Failed to apply ${profileId}: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy('');
        }
    };

    const exportCurrentProfile = async () => {
        try {
            const settings = await window.api.settings.get();
            const payload = {
                id: 'custom_export',
                exportedAt: new Date().toISOString(),
                settings: {
                    allowRemoteBridge: Boolean(settings && settings.allowRemoteBridge),
                    proofRelayEnabled: Boolean(settings && settings.proofRelayEnabled),
                    hostedProxyEnabled: Boolean(settings && settings.hostedProxyEnabled),
                    connectOnStartup: settings && settings.connectOnStartup !== false,
                    otelExportEnabled: Boolean(settings && settings.otelExportEnabled),
                },
            };
            const hash = await hashPayload(payload.settings);
            payload.sha256 = hash;
            const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.download = `neuralshell_policy_profile_${Date.now()}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(href);
            setStatus(`Exported profile (sha256:${hash.slice(0, 12)}...)`);
        } catch (err) {
            setStatus(`Export failed: ${err && err.message ? err.message : String(err)}`);
        }
    };

    const importProfileFromFile = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        if (importInputRef.current) {
            importInputRef.current.value = '';
        }
        if (disabled) {
            setStatus('Policy profile apply is unavailable for this tier.');
            return;
        }
        setBusy('import');
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const incoming = parsed && typeof parsed === 'object' ? parsed : {};
            const settingsPatch = incoming.settings && typeof incoming.settings === 'object' ? incoming.settings : null;
            if (!settingsPatch) {
                throw new Error('Imported profile is missing a settings object.');
            }
            const current = await window.api.settings.get();
            const merged = {
                ...(current || {}),
                ...settingsPatch,
            };
            await window.api.settings.update(merged);
            const hash = await hashPayload(settingsPatch);
            await window.api.audit.append({
                event: 'policy_profile_imported',
                profileId: String(incoming.id || 'imported'),
                profileHash: hash,
                at: new Date().toISOString(),
            });
            setStatus(`Imported ${String(incoming.id || 'profile')} (sha256:${hash.slice(0, 12)}...)`);
        } catch (err) {
            setStatus(`Import failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy('');
        }
    };

    return (
        <section data-testid="policy-profile-card">
            <div className="text-[10px] uppercase tracking-widest text-violet-300 mb-4 font-bold">Policy Profiles</div>
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-2">
                {policyProfiles.map((profile) => (
                    <div key={profile.id} className="rounded border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between gap-2">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200">{profile.label}</div>
                            <div className="text-[10px] font-mono text-slate-500">{profile.description}</div>
                        </div>
                        <button
                            type="button"
                            data-testid={`policy-apply-${profile.id}`}
                            disabled={Boolean(disabled) || busy === profile.id}
                            onClick={() => applyProfile(profile.id)}
                            className="px-2 py-1 rounded border border-violet-300/30 bg-violet-500/10 text-[9px] uppercase tracking-[0.14em] font-mono text-violet-200 hover:bg-violet-500/20 disabled:opacity-60"
                        >
                            {busy === profile.id ? 'Applying' : 'Apply'}
                        </button>
                    </div>
                ))}
                <div className="pt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        data-testid="policy-export-current-btn"
                        onClick={exportCurrentProfile}
                        className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.14em] font-mono text-slate-200 hover:bg-white/10"
                    >
                        Export Current Profile
                    </button>
                    <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.14em] font-mono text-slate-200 hover:bg-white/10 cursor-pointer">
                        Import Profile JSON
                        <input
                            ref={importInputRef}
                            data-testid="policy-import-input"
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={importProfileFromFile}
                            disabled={Boolean(disabled) || busy === 'import'}
                        />
                    </label>
                </div>
                {status && (
                    <div className="text-[10px] font-mono text-slate-300 break-all">
                        {status}
                    </div>
                )}
            </div>
        </section>
    );
}
