import React from 'react';
import trustedPublishers from '../config/white_label_trusted_publishers.json';
import defaultProfile from '../config/white_label_default_profile.json';
import { downloadJson, readTextFile } from '../utils/recordIO.js';
import { fingerprintPublicKey, verifyArtifactSignature } from '../utils/signedArtifacts.js';

const STORAGE_KEY = 'neuralshell_branding_profile_active_v1';

function sanitizeBrandingProfile(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const branding = payload.branding && typeof payload.branding === 'object' ? payload.branding : {};
    const policyDefaults = payload.policyDefaults && typeof payload.policyDefaults === 'object'
        ? payload.policyDefaults
        : {};
    return {
        schema: 'neuralshell_branding_profile_v1',
        profileId: String(payload.profileId || 'unnamed-profile').trim(),
        displayName: String(payload.displayName || payload.profileId || 'Unnamed Profile').trim(),
        branding: {
            productName: String(branding.productName || 'NeuralShell').trim(),
            logoText: String(branding.logoText || branding.productName || 'NeuralShell').trim(),
            accentColor: String(branding.accentColor || '#22d3ee').trim(),
            supportUrl: String(branding.supportUrl || '').trim(),
            docsUrl: String(branding.docsUrl || '').trim(),
            installerName: String(branding.installerName || '').trim(),
        },
        policyDefaults: {
            allowRemoteBridge: Boolean(policyDefaults.allowRemoteBridge),
            offlineOnly: Boolean(policyDefaults.offlineOnly),
            updateRing: String(policyDefaults.updateRing || 'stable').trim().toLowerCase(),
            allowedProviders: Array.isArray(policyDefaults.allowedProviders)
                ? policyDefaults.allowedProviders.map((item) => String(item || '').trim()).filter(Boolean)
                : [],
        },
        source: {
            publisherId: String(payload.publisherId || payload.sourcePublisherId || '').trim(),
            appliedAt: new Date().toISOString(),
        },
    };
}

function loadActiveProfile() {
    if (typeof window === 'undefined' || !window.localStorage) return sanitizeBrandingProfile(defaultProfile);
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        if (!parsed || typeof parsed !== 'object' || !parsed.profileId) {
            return sanitizeBrandingProfile(defaultProfile);
        }
        return sanitizeBrandingProfile(parsed);
    } catch {
        return sanitizeBrandingProfile(defaultProfile);
    }
}

export default function BrandingOverrides() {
    const [activeProfile, setActiveProfile] = React.useState(() => loadActiveProfile());
    const [status, setStatus] = React.useState('');
    const [error, setError] = React.useState('');

    const knownPublisherFingerprints = React.useMemo(() => {
        const rows = trustedPublishers && Array.isArray(trustedPublishers.publishers)
            ? trustedPublishers.publishers
            : [];
        return new Set(rows.map((entry) => String(entry && entry.fingerprint ? entry.fingerprint : '').trim()).filter(Boolean));
    }, []);

    const persistProfile = React.useCallback(async (nextProfile) => {
        const safeProfile = sanitizeBrandingProfile(nextProfile);
        setActiveProfile(safeProfile);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeProfile));
        }
        window.dispatchEvent(new window.CustomEvent('neuralshell:branding-updated', { detail: safeProfile }));
        if (window.api && window.api.audit && typeof window.api.audit.append === 'function') {
            window.api.audit.append({
                event: 'white_label_profile_applied',
                profileId: safeProfile.profileId,
                displayName: safeProfile.displayName,
                publisherId: safeProfile.source.publisherId,
                appliedAt: safeProfile.source.appliedAt,
            }).catch(() => undefined);
        }
    }, []);

    const applySignedProfileImport = async (event) => {
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
                throw new Error('Signed profile requires payload, signature, and signer public key.');
            }
            const verified = await verifyArtifactSignature(payload, signature, publicKeyPem);
            if (!verified) {
                throw new Error('Branding profile signature verification failed.');
            }
            const signerFingerprint = await fingerprintPublicKey(publicKeyPem);
            if (knownPublisherFingerprints.size > 0 && !knownPublisherFingerprints.has(signerFingerprint)) {
                throw new Error(`Untrusted branding signer fingerprint: ${signerFingerprint}`);
            }
            await persistProfile({
                ...payload,
                sourcePublisherId: payload && payload.publisherId ? payload.publisherId : '',
            });
            setStatus(`Applied signed profile "${payload.displayName || payload.profileId}" (${signerFingerprint.slice(0, 26)}...).`);
            setError('');
        } catch (err) {
            setStatus('');
            setError(err && err.message ? err.message : String(err));
        }
    };

    const resetDefault = async () => {
        await persistProfile(defaultProfile);
        setStatus('Restored default NeuralShell branding profile.');
        setError('');
    };

    return (
        <section data-testid="branding-overrides" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">White-Label / OEM Mode</div>
                    <div className="text-[10px] text-slate-500 font-mono">Signed branding profile import with capability-safe policy defaults.</div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100 cursor-pointer">
                        Import Signed Profile
                        <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            data-testid="branding-overrides-import-input"
                            onChange={applySignedProfileImport}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="branding-overrides-reset-btn"
                        onClick={resetDefault}
                        className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200"
                    >
                        Reset Default
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Active Profile</div>
                <div className="text-[13px] text-slate-100 font-bold">{activeProfile.displayName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{activeProfile.profileId}</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                    <div>Product: {activeProfile.branding.productName}</div>
                    <div>Logo Text: {activeProfile.branding.logoText}</div>
                    <div>Accent: {activeProfile.branding.accentColor}</div>
                    <div>Update Ring: {activeProfile.policyDefaults.updateRing}</div>
                    <div>Remote Bridge: {activeProfile.policyDefaults.allowRemoteBridge ? 'enabled' : 'disabled'}</div>
                    <div>Offline Only: {activeProfile.policyDefaults.offlineOnly ? 'true' : 'false'}</div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    data-testid="branding-overrides-export-btn"
                    onClick={() => {
                        downloadJson(`neuralshell_active_branding_profile_${Date.now()}.json`, activeProfile);
                    }}
                    className="px-2.5 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                >
                    Export Active Profile
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

