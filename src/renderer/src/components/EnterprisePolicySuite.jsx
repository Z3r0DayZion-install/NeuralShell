import React from 'react';
import { downloadJson, readTextFile } from '../utils/recordIO.js';
import { fingerprintPublicKey, verifyArtifactSignature } from '../utils/signedArtifacts.js';

function normalizePolicy(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    return {
        policyId: String(payload.policyId || payload.id || `policy-${Date.now()}`).trim(),
        label: String(payload.label || payload.policyId || 'Enterprise Policy').trim(),
        allowedProviders: Array.isArray(payload.allowedProviders)
            ? payload.allowedProviders.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean)
            : ['ollama'],
        offlineOnly: Boolean(payload.offlineOnly),
        allowRemoteBridge: Boolean(payload.allowRemoteBridge),
        proofRelayEnabled: Boolean(payload.proofRelayEnabled),
        updateRing: String(payload.updateRing || 'stable').trim().toLowerCase(),
        certPins: Array.isArray(payload.certPins) ? payload.certPins.map((entry) => String(entry || '').trim()).filter(Boolean) : [],
        relayRestriction: String(payload.relayRestriction || 'local-only').trim().toLowerCase(),
    };
}

export default function EnterprisePolicySuite() {
    const [policy, setPolicy] = React.useState(() => normalizePolicy({}));
    const [status, setStatus] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const loadFromRuntime = React.useCallback(async () => {
        try {
            const settings = window.api && window.api.settings && typeof window.api.settings.get === 'function'
                ? await window.api.settings.get()
                : {};
            const enforced = settings && settings.enterprisePolicyEnforced && typeof settings.enterprisePolicyEnforced === 'object'
                ? settings.enterprisePolicyEnforced
                : {};
            setPolicy(normalizePolicy({
                ...enforced,
                allowedProviders: Array.isArray(enforced.allowedProviders) && enforced.allowedProviders.length
                    ? enforced.allowedProviders
                    : ['ollama'],
                offlineOnly: Boolean(settings && settings.offlineOnlyEnforced),
                allowRemoteBridge: Boolean(settings && settings.allowRemoteBridge),
                proofRelayEnabled: Boolean(settings && settings.proofRelayEnabled),
                updateRing: String(settings && settings.autoUpdateChannel ? settings.autoUpdateChannel : enforced.updateRing || 'stable'),
            }));
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    }, []);

    React.useEffect(() => {
        loadFromRuntime();
    }, [loadFromRuntime]);

    const applyToRuntime = async (nextPolicy) => {
        const safe = normalizePolicy(nextPolicy);
        setBusy(true);
        try {
            if (window.api && window.api.settings && typeof window.api.settings.update === 'function') {
                await window.api.settings.update({
                    allowRemoteBridge: Boolean(safe.allowRemoteBridge),
                    proofRelayEnabled: Boolean(safe.proofRelayEnabled),
                    autoUpdateChannel: safe.updateRing,
                    offlineOnlyEnforced: Boolean(safe.offlineOnly),
                    enterprisePolicyEnforced: {
                        ...safe,
                        enforcedAt: new Date().toISOString(),
                    },
                });
            }
            if (window.api && window.api.audit && typeof window.api.audit.append === 'function') {
                await window.api.audit.append({
                    event: 'enterprise_policy_enforced',
                    policyId: safe.policyId,
                    updateRing: safe.updateRing,
                    relayRestriction: safe.relayRestriction,
                    offlineOnly: safe.offlineOnly,
                });
            }
            setPolicy(safe);
            setStatus(`Applied policy "${safe.label}" to runtime.`);
            setError('');
        } catch (err) {
            setStatus('');
            setError(err && err.message ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const importSignedPolicyBundle = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || '{}'));
            const payload = parsed && typeof parsed === 'object' ? parsed.payload : null;
            const signature = parsed && typeof parsed === 'object' ? String(parsed.signature || '') : '';
            const publicKeyPem = parsed && parsed.signer && typeof parsed.signer === 'object'
                ? String(parsed.signer.publicKeyPem || '')
                : '';
            if (!payload || !signature || !publicKeyPem) {
                throw new Error('Signed policy bundle requires payload/signature/public key.');
            }
            const verified = await verifyArtifactSignature(payload, signature, publicKeyPem);
            if (!verified) {
                throw new Error('Policy bundle signature verification failed.');
            }
            await applyToRuntime(payload);
            const fp = await fingerprintPublicKey(publicKeyPem);
            setStatus(`Policy applied from signed bundle (${fp.slice(0, 26)}...).`);
            setError('');
        } catch (err) {
            setStatus('');
            setError(err && err.message ? err.message : String(err));
        }
    };

    const updatePolicyField = (patch) => {
        setPolicy((prev) => normalizePolicy({ ...prev, ...patch }));
    };

    return (
        <section data-testid="enterprise-policy-suite" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Deployment Policy Suite</div>
                    <div className="text-[10px] text-slate-500 font-mono">Apply signed policy bundles with provider controls, relay restrictions, update rings, and cert pinning.</div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100 cursor-pointer">
                        Import Signed Policy
                        <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            data-testid="enterprise-policy-import-input"
                            onChange={importSignedPolicyBundle}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="enterprise-policy-export-btn"
                        onClick={() => {
                            downloadJson(`neuralshell_enterprise_policy_${Date.now()}.json`, {
                                exportedAt: new Date().toISOString(),
                                payload: policy,
                            });
                        }}
                        className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                    >
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Policy Label
                    <input
                        value={policy.label}
                        onChange={(event) => updatePolicyField({ label: event.target.value })}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Policy ID
                    <input
                        value={policy.policyId}
                        onChange={(event) => updatePolicyField({ policyId: event.target.value })}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Allowed Providers (comma separated)
                    <input
                        value={policy.allowedProviders.join(',')}
                        onChange={(event) => updatePolicyField({
                            allowedProviders: String(event.target.value || '')
                                .split(',')
                                .map((entry) => entry.trim().toLowerCase())
                                .filter(Boolean),
                        })}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Update Ring
                    <select
                        value={policy.updateRing}
                        onChange={(event) => updatePolicyField({ updateRing: event.target.value })}
                        className="mt-1 w-full bg-slate-900 border border-white/10 rounded px-2 py-1"
                    >
                        <option value="stable">stable</option>
                        <option value="canary">canary</option>
                        <option value="beta">beta</option>
                        <option value="frozen">frozen</option>
                    </select>
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Relay Restriction
                    <select
                        value={policy.relayRestriction}
                        onChange={(event) => updatePolicyField({ relayRestriction: event.target.value })}
                        className="mt-1 w-full bg-slate-900 border border-white/10 rounded px-2 py-1"
                    >
                        <option value="local-only">local-only</option>
                        <option value="allowlisted-remotes">allowlisted-remotes</option>
                        <option value="blocked">blocked</option>
                    </select>
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Cert Pins (one per comma)
                    <input
                        value={policy.certPins.join(',')}
                        onChange={(event) => updatePolicyField({
                            certPins: String(event.target.value || '')
                                .split(',')
                                .map((entry) => entry.trim())
                                .filter(Boolean),
                        })}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-300">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={Boolean(policy.offlineOnly)}
                        onChange={(event) => updatePolicyField({ offlineOnly: Boolean(event.target.checked) })}
                    />
                    Offline-only enforced
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={Boolean(policy.allowRemoteBridge)}
                        onChange={(event) => updatePolicyField({ allowRemoteBridge: Boolean(event.target.checked) })}
                    />
                    Allow remote bridge
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={Boolean(policy.proofRelayEnabled)}
                        onChange={(event) => updatePolicyField({ proofRelayEnabled: Boolean(event.target.checked) })}
                    />
                    Proof relay enabled
                </label>
                <button
                    type="button"
                    data-testid="enterprise-policy-apply-btn"
                    disabled={busy}
                    onClick={() => applyToRuntime(policy)}
                    className="px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.12em] text-cyan-100 disabled:opacity-60"
                >
                    Apply Policy
                </button>
            </div>

            {status && (
                <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-100 font-mono">
                    {status}
                </div>
            )}
            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}
        </section>
    );
}

