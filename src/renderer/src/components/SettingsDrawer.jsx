import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShell } from '../state/ShellContext';
import VaultCard from './Settings/VaultCard';
import ProofRelayToggle from './Settings/ProofRelayToggle';
import AutoUpdateLaneCard from './Settings/AutoUpdateLaneCard';
import ProofRelayMap from './Settings/ProofRelayMap';
import ShareProofModal from './ShareProofModal';
import { useAccent } from '../hooks/useAccent.ts';
import ProviderSweep from './ProviderSweep';
import BillingCenter from './BillingCenter';
import AgentStore from './AgentStore';
import ReferralCard from './ReferralCard';
import SupportBundleCard from './SupportBundleCard';
import ReleaseHealthConsole from './ReleaseHealthConsole';
import PolicyProfileCard from './PolicyProfileCard';
import UIAppearanceCard from './Settings/UIAppearanceCard';

const PROVIDER_OPTIONS = [
    { id: 'ollama', label: 'Local Node (Ollama)', defaultBaseUrl: 'http://127.0.0.1:11434', remote: false },
    { id: 'openai', label: 'OpenAI Network', defaultBaseUrl: 'https://api.openai.com', remote: true },
    { id: 'openrouter', label: 'OpenRouter Network', defaultBaseUrl: 'https://openrouter.ai/api', remote: true },
    { id: 'groq', label: 'Groq Network', defaultBaseUrl: 'https://api.groq.com/openai', remote: true },
    { id: 'together', label: 'Together Network', defaultBaseUrl: 'https://api.together.xyz', remote: true },
    { id: 'custom_openai', label: 'Custom OpenAI-Compatible', defaultBaseUrl: 'https://api.example.com', remote: true },
];

const PROVIDER_MODEL_SUGGESTIONS = {
    ollama: ['llama3', 'mistral', 'qwen2.5-coder:7b'],
    openai: ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1'],
    openrouter: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct'],
    groq: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
    together: ['meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', 'Qwen/Qwen2.5-Coder-32B-Instruct'],
    custom_openai: [],
};

const PROVIDER_KEY_HINTS = {
    openai: 'OPENAI_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    groq: 'GROQ_API_KEY',
    together: 'TOGETHER_API_KEY',
    custom_openai: 'CUSTOM_OPENAI_API_KEY',
};

function formatSweepReason(reason) {
    const text = String(reason || '').trim();
    if (!text) return '';
    return text.replace(/_/g, ' ');
}

function defaultBaseUrlForProvider(providerId) {
    const found = PROVIDER_OPTIONS.find((item) => item.id === String(providerId || '').trim());
    return found ? found.defaultBaseUrl : 'http://127.0.0.1:11434';
}

function providerRequiresApiKey(providerId) {
    return providerId !== 'ollama';
}

function providerIsRemote(providerId) {
    const found = PROVIDER_OPTIONS.find((item) => item.id === String(providerId || '').trim());
    return Boolean(found && found.remote);
}

function hasCapability(settings, capabilityId) {
    const list = Array.isArray(settings && settings.capabilities) ? settings.capabilities : [];
    return list.includes(String(capabilityId || '').trim());
}

function normalizeSettingsForForm(rawSettings = {}) {
    const resolved = rawSettings || {};
    const provider = String(resolved.provider || 'ollama');
    const baseUrl = String(resolved.ollamaBaseUrl || defaultBaseUrlForProvider(provider)).trim();
    return {
        ...resolved,
        provider,
        apiKey: String(resolved.apiKey || ''),
        apiKeyPresent: Boolean(resolved.apiKeyPresent),
        ollamaBaseUrl: baseUrl || defaultBaseUrlForProvider(provider),
        hostedProxyEnabled: Boolean(resolved.hostedProxyEnabled),
    };
}

export default function SettingsDrawer() {
    const { closeSettings } = useShell();
    const { accent, setAccent, isValidAccent, normalizeAccent } = useAccent();
    const [settings, setSettings] = useState(null);
    const [modelDraft, setModelDraft] = useState('llama3');
    const [accentDraft, setAccentDraft] = useState('#22D3EE');
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState({ tone: 'idle', text: '' });
    const [connectionReport, setConnectionReport] = useState(null);
    const [providerSweep, setProviderSweep] = useState(null);
    const [providerSweepBusy, setProviderSweepBusy] = useState(false);
    const [providerSweepUpdatedAt, setProviderSweepUpdatedAt] = useState('');
    const [hostedProxyStatus, setHostedProxyStatus] = useState({ running: false, enabled: false, rateCapPerMinute: 60 });
    const [otelStatus, setOtelStatus] = useState({ enabled: false, host: '127.0.0.1', port: 4317, ok: false, reason: '' });
    const [showShareProofModal, setShowShareProofModal] = useState(false);
    const [shareProofPayload, setShareProofPayload] = useState(null);
    const [sharePromptShown, setSharePromptShown] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [rawSettings, rawState, initialSweep] = await Promise.all([
                    window.api.settings.get(),
                    window.api.state.get(),
                    window.api && window.api.bridge && typeof window.api.bridge.sweep === 'function'
                        ? window.api.bridge.sweep().catch(() => null)
                        : Promise.resolve(null),
                ]);
                if (!mounted) return;
                setSettings(normalizeSettingsForForm(rawSettings || {}));
                if (rawSettings && rawSettings.hostedProxyStatus) {
                    setHostedProxyStatus({
                        running: Boolean(rawSettings.hostedProxyStatus.running),
                        enabled: Boolean(rawSettings.hostedProxyStatus.enabled),
                        rateCapPerMinute: Number(rawSettings.hostedProxyStatus.rateCapPerMinute || 60),
                        baseUrl: String(rawSettings.hostedProxyStatus.baseUrl || ''),
                    });
                }
                if (window.api && window.api.otel && typeof window.api.otel.status === 'function') {
                    const otel = await window.api.otel.status().catch(() => null);
                    if (otel && typeof otel === 'object') {
                        setOtelStatus({
                            enabled: Boolean(otel.enabled),
                            host: String(otel.host || '127.0.0.1'),
                            port: Number(otel.port || 4317),
                            ok: false,
                            reason: '',
                        });
                    }
                }
                setModelDraft(String((rawState && rawState.model) || 'llama3'));
                if (initialSweep && typeof initialSweep === 'object') {
                    setProviderSweep(initialSweep);
                    setProviderSweepUpdatedAt(String(initialSweep.generatedAt || new Date().toISOString()));
                    if (initialSweep.hostedProxy) {
                        setHostedProxyStatus({
                            running: Boolean(initialSweep.hostedProxy.running),
                            enabled: Boolean(initialSweep.hostedProxy.enabled),
                            rateCapPerMinute: Number(initialSweep.hostedProxy.rateCapPerMinute || 60),
                            baseUrl: String(initialSweep.hostedProxy.baseUrl || ''),
                        });
                    }
                }
            } catch (err) {
                if (!mounted) return;
                setStatus({
                    tone: 'bad',
                    text: `Failed to load settings: ${err && err.message ? err.message : String(err)}`,
                });
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        setAccentDraft(String(accent || '#22D3EE'));
    }, [accent]);

    const provider = String((settings && settings.provider) || 'ollama');
    const licenseMode = String((settings && settings.licenseMode) || 'preview').toLowerCase();
    const canApplyPolicyProfiles = hasCapability(settings, 'policy_profiles_apply');
    const canViewReleaseHealth = hasCapability(settings, 'release_health_console') || licenseMode === 'enterprise';
    const providerNeedsApiKey = providerRequiresApiKey(provider);
    const modelSuggestions = useMemo(() => {
        const seeded = PROVIDER_MODEL_SUGGESTIONS[provider] || [];
        const combined = [...seeded, String(modelDraft || '').trim()].filter(Boolean);
        return Array.from(new Set(combined));
    }, [provider, modelDraft]);
    const providerSweepRows = useMemo(() => {
        const results = Array.isArray(providerSweep && providerSweep.results)
            ? providerSweep.results
            : [];
        const lookup = new Map(results.map((entry) => [String(entry.provider || '').trim(), entry]));
        return PROVIDER_OPTIONS.map((option) => {
            const item = lookup.get(option.id);
            if (!item) {
                return {
                    id: option.id,
                    label: option.label,
                    status: 'unknown',
                    detail: 'Not checked yet',
                };
            }
            if (item.status === 'connected') {
                return {
                    id: option.id,
                    label: option.label,
                    status: 'connected',
                    detail: `${Number(item.modelCount || 0)} models · ${Number(item.latencyMs || 0)} ms`,
                };
            }
            if (item.status === 'skipped') {
                const hint = PROVIDER_KEY_HINTS[option.id];
                const reason = formatSweepReason(item.reason || item.healthReason || 'skipped');
                const detail = String(reason || '').startsWith('missing') && hint
                    ? `${reason} (${hint})`
                    : reason || 'skipped';
                return {
                    id: option.id,
                    label: option.label,
                    status: 'skipped',
                    detail,
                };
            }
            return {
                id: option.id,
                label: option.label,
                status: 'failed',
                detail: formatSweepReason(item.reason || item.healthReason || 'connection failed'),
            };
        });
    }, [providerSweep]);

    const saveSettings = useCallback(async (nextSettings, successText = 'Settings saved.') => {
        const normalizedNext = normalizeSettingsForForm(nextSettings || {});
        setSettings(normalizedNext);
        try {
            const saved = await window.api.settings.update(normalizedNext);
            const normalizedSaved = normalizeSettingsForForm(saved || normalizedNext);
            setSettings(normalizedSaved);
            setStatus({ tone: 'ok', text: successText });
            return normalizedSaved;
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Settings save failed: ${err && err.message ? err.message : String(err)}`,
            });
            return null;
        }
    }, []);

    const runProviderSweep = useCallback(async () => {
        if (!(window.api && window.api.bridge && typeof window.api.bridge.sweep === 'function')) {
            setStatus({
                tone: 'bad',
                text: 'Provider sweep bridge is unavailable in this runtime.',
            });
            return null;
        }
        setProviderSweepBusy(true);
        try {
            const report = await window.api.bridge.sweep();
            const normalizedReport = report && typeof report === 'object' ? report : null;
            setProviderSweep(normalizedReport);
            if (normalizedReport && normalizedReport.hostedProxy) {
                setHostedProxyStatus({
                    running: Boolean(normalizedReport.hostedProxy.running),
                    enabled: Boolean(normalizedReport.hostedProxy.enabled),
                    rateCapPerMinute: Number(normalizedReport.hostedProxy.rateCapPerMinute || 60),
                    baseUrl: String(normalizedReport.hostedProxy.baseUrl || ''),
                });
            }
            setProviderSweepUpdatedAt(String(
                (normalizedReport && normalizedReport.generatedAt) || new Date().toISOString(),
            ));
            if (normalizedReport) {
                setStatus({
                    tone: normalizedReport.failed > 0 ? 'bad' : 'ok',
                    text: `Provider sweep complete: ${normalizedReport.connected}/${normalizedReport.total} connected.`,
                });
            }
            return normalizedReport;
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Provider sweep failed: ${err && err.message ? err.message : String(err)}`,
            });
            return null;
        } finally {
            setProviderSweepBusy(false);
        }
    }, []);

    const applyLocalLanePreset = useCallback(async () => {
        if (!settings) return;
        setBusy(true);
        setConnectionReport(null);
        const next = {
            ...settings,
            provider: 'ollama',
            ollamaBaseUrl: defaultBaseUrlForProvider('ollama'),
            apiKey: '',
            apiKeyPresent: false,
            allowRemoteBridge: false,
            connectOnStartup: true,
        };
        const saved = await saveSettings(next, 'Local lane enabled. Remote providers are now disabled.');
        if (saved) {
            await runProviderSweep();
        }
        setBusy(false);
    }, [runProviderSweep, saveSettings, settings]);

    const applyHostedLanePreset = useCallback(async () => {
        if (!settings) return;
        setBusy(true);
        setConnectionReport(null);
        const nextProvider = providerIsRemote(provider) ? provider : 'openai';
        const next = {
            ...settings,
            provider: nextProvider,
            ollamaBaseUrl: defaultBaseUrlForProvider(nextProvider),
            allowRemoteBridge: true,
            connectOnStartup: true,
            apiKeyPresent: providerRequiresApiKey(nextProvider) ? Boolean(settings.apiKeyPresent) : false,
            apiKey: providerRequiresApiKey(nextProvider) ? String(settings.apiKey || '') : '',
        };
        const saved = await saveSettings(next, 'Hosted lane enabled. Add API credentials, then run validation.');
        if (saved) {
            await runProviderSweep();
        }
        setBusy(false);
    }, [provider, runProviderSweep, saveSettings, settings]);

    const importEnvProfiles = useCallback(async () => {
        if (!(window.api && window.api.bridge && typeof window.api.bridge.importEnvProfiles === 'function')) {
            setStatus({
                tone: 'bad',
                text: 'Environment profile import is unavailable in this runtime.',
            });
            return;
        }
        setBusy(true);
        try {
            const result = await window.api.bridge.importEnvProfiles();
            const refreshedSettings = await window.api.settings.get();
            setSettings(normalizeSettingsForForm(refreshedSettings || {}));
            setConnectionReport(null);
            const importedCount = Array.isArray(result && result.importedProfiles)
                ? result.importedProfiles.length
                : 0;
            setStatus({
                tone: 'ok',
                text: `Imported ${importedCount} profile${importedCount === 1 ? '' : 's'} from environment.`,
            });
            await runProviderSweep();
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Env profile import failed: ${err && err.message ? err.message : String(err)}`,
            });
        } finally {
            setBusy(false);
        }
    }, [runProviderSweep]);

    const toggleHostedProxy = useCallback(async () => {
        if (!settings) return;
        setBusy(true);
        try {
            const next = {
                ...settings,
                hostedProxyEnabled: !settings.hostedProxyEnabled,
            };
            const saved = await saveSettings(
                next,
                next.hostedProxyEnabled
                    ? 'Hosted fallback proxy enabled (Together gateway, rate capped).'
                    : 'Hosted fallback proxy disabled.',
            );
            if (saved) {
                await runProviderSweep();
            }
        } finally {
            setBusy(false);
        }
    }, [runProviderSweep, saveSettings, settings]);

    const toggleOtelExport = useCallback(async () => {
        if (!settings) return;
        const nextEnabled = !settings.otelExportEnabled;
        const saved = await saveSettings(
            {
                ...settings,
                otelExportEnabled: nextEnabled,
            },
            nextEnabled ? 'OpenTelemetry export enabled.' : 'OpenTelemetry export disabled.',
        );
        if (!saved) return;
        if (window.api && window.api.otel && typeof window.api.otel.setEnabled === 'function') {
            const next = await window.api.otel.setEnabled(nextEnabled).catch(() => null);
            if (next && typeof next === 'object') {
                setOtelStatus((prev) => ({
                    ...prev,
                    enabled: Boolean(next.enabled),
                    host: String(next.host || prev.host),
                    port: Number(next.port || prev.port),
                }));
            }
        }
    }, [saveSettings, settings]);

    const verifyOtel = useCallback(async () => {
        if (!(window.api && window.api.otel && typeof window.api.otel.verify === 'function')) return;
        const result = await window.api.otel.verify().catch(() => null);
        if (!result || typeof result !== 'object') return;
        setOtelStatus((prev) => ({
            ...prev,
            ok: Boolean(result.ok),
            reason: String(result.reason || ''),
            host: String(result.host || prev.host),
            port: Number(result.port || prev.port),
        }));
    }, []);

    const updateSetting = async (key, value) => {
        if (!settings) return;
        const previousProvider = String(settings.provider || 'ollama');
        const next = { ...settings, [key]: value };

        if (key === 'provider') {
            const nextProvider = String(value || 'ollama');
            const previousDefault = defaultBaseUrlForProvider(previousProvider);
            const currentBaseUrl = String(settings.ollamaBaseUrl || '').trim();
            const shouldResetEndpoint = !currentBaseUrl || currentBaseUrl === previousDefault;
            if (shouldResetEndpoint) {
                next.ollamaBaseUrl = defaultBaseUrlForProvider(nextProvider);
            }
            if (!providerRequiresApiKey(nextProvider)) {
                next.apiKey = '';
                next.apiKeyPresent = false;
            }
            setConnectionReport(null);
        }

        if (key === 'apiKey') {
            next.apiKeyPresent = Boolean(String(value || '').trim());
        }

        await saveSettings(next);
    };

    const applyModel = async () => {
        const safeModel = String(modelDraft || '').trim();
        if (!safeModel) {
            setStatus({ tone: 'bad', text: 'Model is required.' });
            return;
        }
        setBusy(true);
        try {
            await window.api.state.update({ model: safeModel });
            setStatus({ tone: 'ok', text: `Model set to ${safeModel}.` });
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Model update failed: ${err && err.message ? err.message : String(err)}`,
            });
        } finally {
            setBusy(false);
        }
    };

    const testConnection = async () => {
        if (!settings) return;
        const baseUrl = String(settings.ollamaBaseUrl || defaultBaseUrlForProvider(provider)).trim();
        if (!baseUrl) {
            setStatus({ tone: 'bad', text: 'Base URL is required for bridge test.' });
            return;
        }
        const profile = {
            id: String(settings.activeProfileId || ''),
            provider,
            baseUrl,
            timeoutMs: Number(settings.timeoutMs) || 15000,
            retryCount: Number(settings.retryCount) || 2,
            defaultModel: String(modelDraft || 'llama3').trim() || 'llama3',
            apiKey: String(settings.apiKey || ''),
        };
        setBusy(true);
        setConnectionReport(null);
        try {
            const result = await window.api.bridge.test(profile);
            setConnectionReport(result);
            if (result && result.ok) {
                setStatus({
                    tone: 'ok',
                    text: `Live bridge verified (${result.provider}) with ${Number(result.modelCount) || 0} models.`,
                });
                const payload = {
                    provider: String(result.provider || provider),
                    model: String(modelDraft || ''),
                    modelCount: Number(result.modelCount || 0),
                    baseUrl: String(result.baseUrl || baseUrl),
                };
                setShareProofPayload(payload);
                if (!sharePromptShown) {
                    setShowShareProofModal(true);
                    setSharePromptShown(true);
                }
            } else {
                const reason = result && result.health && result.health.reason ? result.health.reason : 'Bridge test failed.';
                setStatus({ tone: 'bad', text: reason });
            }
        } catch (err) {
            setConnectionReport(null);
            setStatus({
                tone: 'bad',
                text: `Connection test failed: ${err && err.message ? err.message : String(err)}`,
            });
        } finally {
            setBusy(false);
        }
    };

    const triggerOfflineKillSwitch = async () => {
        if (!settings) return;
        setBusy(true);
        setConnectionReport(null);
        try {
            await window.api.llm.cancelStream().catch(() => false);
            const next = {
                ...settings,
                provider: 'ollama',
                apiKey: '',
                apiKeyPresent: false,
                ollamaBaseUrl: defaultBaseUrlForProvider('ollama'),
                allowRemoteBridge: false,
                connectOnStartup: false,
            };
            const saved = await window.api.settings.update(next);
            setSettings(normalizeSettingsForForm(saved || next));
            setStatus({
                tone: 'ok',
                text: 'Offline kill switch engaged. Hosted providers disabled and bridge stream cancelled.',
            });
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Offline kill switch failed: ${err && err.message ? err.message : String(err)}`,
            });
        } finally {
            setBusy(false);
        }
    };

    if (!settings) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-all" onClick={closeSettings} />
            <div data-testid="settings-drawer" className="fixed right-0 top-0 bottom-0 max-w-lg w-full z-50 bg-slate-950 border-l border-cyan-400/20 shadow-[-20px_0_50px_rgba(0,0,0,0.6)] p-8 flex flex-col animate-fade-up" style={{ borderImage: 'linear-gradient(180deg, rgba(6,182,212,0.3), rgba(139,92,246,0.15), rgba(217,70,239,0.08)) 1' }}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-gradient animate-gradient-shift" style={{ backgroundImage: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #d946ef, #06b6d4)' }}>Configuration</h2>
                    <button data-testid="settings-close-btn" onClick={closeSettings} className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-4 font-bold">Security Subsystem</div>
                        <div className="space-y-3">
                            <label className="flex justify-between items-center p-4 bg-black/30 hover:bg-black/40 transition-colors rounded-2xl border border-white/5 cursor-pointer group">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Safe Defaults</div>
                                    <div className="text-[10px] text-slate-500">Enable OMEGA-hardened zero-trust guards</div>
                                </div>
                                <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.safeMode !== false ? 'bg-cyan-400/20 border border-cyan-400/40' : 'bg-slate-800 border border-white/5'}`}>
                                    <div className={`h-3 w-3 rounded-full transition-all ${settings.safeMode !== false ? 'bg-cyan-400 ml-auto' : 'bg-slate-500'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={settings.safeMode !== false} onChange={e => updateSetting('safeMode', e.target.checked)} />
                            </label>

                            <label className="flex justify-between items-center p-4 bg-black/30 hover:bg-black/40 transition-colors rounded-2xl border border-white/5 cursor-pointer group opacity-60">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">P2P Network Tunnel</div>
                                    <div className="text-[10px] text-slate-500">Enable decentralized swarming (Requires APEX)</div>
                                </div>
                                <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.networkTunnel ? 'bg-amber-400/20 border border-amber-400/40' : 'bg-slate-800 border border-white/5'}`}>
                                    <div className={`h-3 w-3 rounded-full transition-all ${settings.networkTunnel ? 'bg-amber-400 ml-auto' : 'bg-slate-500'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={!!settings.networkTunnel} onChange={e => updateSetting('networkTunnel', e.target.checked)} />
                            </label>

                            <label className="flex justify-between items-center p-4 bg-black/30 hover:bg-black/40 transition-colors rounded-2xl border border-white/5 cursor-pointer group">
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Hosted Provider Access</div>
                                    <div className="text-[10px] text-slate-500">Allow network-hosted model providers in this runtime</div>
                                </div>
                                <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${settings.allowRemoteBridge ? 'bg-emerald-400/20 border border-emerald-400/40' : 'bg-slate-800 border border-white/5'}`}>
                                    <div className={`h-3 w-3 rounded-full transition-all ${settings.allowRemoteBridge ? 'bg-emerald-400 ml-auto' : 'bg-slate-500'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={!!settings.allowRemoteBridge} onChange={e => updateSetting('allowRemoteBridge', e.target.checked)} />
                            </label>
                        </div>
                    </section>

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-fuchsia-300 mb-4 font-bold">Visual Accent</div>
                        <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Accent Hex</label>
                            <div className="flex items-center gap-2">
                                <input
                                    data-testid="settings-accent-input"
                                    type="text"
                                    value={accentDraft}
                                    onChange={(event) => setAccentDraft(event.target.value)}
                                    onBlur={() => {
                                        if (isValidAccent(accentDraft)) {
                                            setAccent(normalizeAccent(accentDraft));
                                            return;
                                        }
                                        setAccentDraft(accent);
                                    }}
                                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                                    placeholder="#22D3EE"
                                />
                                <div
                                    className="h-10 w-10 rounded-lg border border-white/10"
                                    style={{ backgroundColor: accent }}
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-violet-300 mb-4 font-bold">Appearance & Layout</div>
                        <UIAppearanceCard />
                    </section>

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-amber-300 mb-4 font-bold">Provider Setup Wizard</div>
                        <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    data-testid="settings-setup-local-btn"
                                    type="button"
                                    onClick={applyLocalLanePreset}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                                >
                                    Local Lane
                                </button>
                                <button
                                    data-testid="settings-setup-hosted-btn"
                                    type="button"
                                    onClick={applyHostedLanePreset}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-xl border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                    Hosted Lane
                                </button>
                            </div>
                            <button
                                data-testid="settings-import-env-btn"
                                type="button"
                                onClick={importEnvProfiles}
                                disabled={busy}
                                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.16em] font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                            >
                                Import Provider Profiles from Environment
                            </button>
                        </div>
                    </section>

                    <ProviderSweep
                        providerSweep={providerSweep}
                        providerSweepRows={providerSweepRows}
                        providerSweepBusy={providerSweepBusy}
                        providerSweepUpdatedAt={providerSweepUpdatedAt}
                        onRefresh={runProviderSweep}
                        hostedProxyEnabled={Boolean(settings.hostedProxyEnabled)}
                        hostedProxyStatus={hostedProxyStatus}
                        onToggleHostedProxy={toggleHostedProxy}
                    />

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-violet-300 mb-4 font-bold">OpenTelemetry Export</div>
                        <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                            <div className="text-[11px] text-slate-400 font-mono">
                                Optional local OTLP bridge to <code className="text-cyan-300">localhost:4317</code>. Disabled by default.
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    data-testid="settings-otel-toggle-btn"
                                    onClick={toggleOtelExport}
                                    className={`px-3 py-2 rounded-xl border text-[10px] uppercase tracking-[0.16em] font-bold ${
                                        settings.otelExportEnabled
                                            ? 'border-violet-300/35 bg-violet-500/10 text-violet-200'
                                            : 'border-white/15 bg-white/5 text-slate-200'
                                    }`}
                                >
                                    {settings.otelExportEnabled ? 'Disable Export' : 'Enable Export'}
                                </button>
                                <button
                                    type="button"
                                    data-testid="settings-otel-verify-btn"
                                    onClick={verifyOtel}
                                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.16em] font-bold text-slate-200 hover:bg-white/10"
                                >
                                    Verify Collector
                                </button>
                                <span className={`text-[10px] font-mono ${otelStatus.ok ? 'text-emerald-300' : 'text-slate-500'}`}>
                                    {otelStatus.ok ? 'Collector reachable' : `Collector ${otelStatus.host}:${otelStatus.port}`}
                                    {otelStatus.reason ? ` (${otelStatus.reason})` : ''}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-slate-300 mb-4 font-bold">Legal</div>
                        <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                            <div className="text-[11px] text-slate-400 font-mono">
                                Third-party attribution is generated at <code className="text-cyan-300">public/about.html</code>.
                            </div>
                            <button
                                type="button"
                                data-testid="settings-legal-open-about-btn"
                                onClick={() => {
                                    const fallbackUrl = 'https://github.com/Z3r0DayZion-install/NeuralShell/blob/master/public/about.html';
                                    if (window.api && window.api.system && typeof window.api.system.openExternal === 'function') {
                                        window.api.system.openExternal(fallbackUrl);
                                    }
                                }}
                                className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.16em] font-bold text-slate-200 hover:bg-white/10"
                            >
                                Open Attribution Page
                            </button>
                        </div>
                    </section>

                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-4 font-bold flex items-center gap-2">
                            LLM Bridge Profile
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-mono border border-emerald-500/20">LIVE</span>
                        </div>
                        <div className="space-y-4 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Provider Engine</label>
                                <select
                                    data-testid="settings-provider-select"
                                    value={provider}
                                    onChange={e => updateSetting('provider', e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50 transition-all cursor-pointer font-mono"
                                >
                                    {PROVIDER_OPTIONS.map((item) => (
                                        <option key={item.id} value={item.id}>{item.label}</option>
                                    ))}
                                </select>
                                <div className="text-[10px] text-slate-500">
                                    {providerIsRemote(provider) ? 'Hosted provider selected.' : 'Local provider selected.'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Base URL / Endpoint</label>
                                <input
                                    type="text"
                                    value={settings.ollamaBaseUrl || ''}
                                    onChange={e => updateSetting('ollamaBaseUrl', e.target.value)}
                                    placeholder={defaultBaseUrlForProvider(provider)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1 flex justify-between">
                                    <span>Authorization Key</span>
                                    {!providerNeedsApiKey && <span className="text-slate-600 italic">Not required for local</span>}
                                </label>
                                <input
                                    type="password"
                                    value={settings.apiKey || ''}
                                    onChange={e => updateSetting('apiKey', e.target.value)}
                                    placeholder={providerNeedsApiKey ? 'sk-...' : 'Optional'}
                                    disabled={!providerNeedsApiKey}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono disabled:opacity-50"
                                />
                                {providerNeedsApiKey && (
                                    <div data-testid="settings-api-key-status" className={`text-[10px] font-mono ${settings.apiKeyPresent ? 'text-emerald-300' : 'text-slate-500'}`}>
                                        {settings.apiKeyPresent ? 'Key stored securely in Vault+.' : 'No key stored for the active profile.'}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Active Model</label>
                                <input
                                    data-testid="settings-model-input"
                                    list="settings-model-suggestions"
                                    type="text"
                                    value={modelDraft}
                                    onChange={e => setModelDraft(e.target.value)}
                                    placeholder="Set active model name"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                                />
                                <datalist id="settings-model-suggestions">
                                    {modelSuggestions.map((item) => (
                                        <option key={item} value={item} />
                                    ))}
                                </datalist>
                                <button
                                    type="button"
                                    onClick={applyModel}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                                >
                                    Apply Model
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    data-testid="settings-test-connection-btn"
                                    type="button"
                                    onClick={testConnection}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-xl border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                    Test Live Connection
                                </button>
                                <button
                                    data-testid="settings-offline-kill-btn"
                                    type="button"
                                    onClick={triggerOfflineKillSwitch}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-xl border border-rose-300/30 bg-rose-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                                >
                                    Offline Kill Switch
                                </button>
                            </div>

                            {connectionReport && (
                                <div className={`rounded-xl border px-3 py-2 text-[10px] font-mono ${connectionReport.ok ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-200'}`}>
                                    <div>
                                        {connectionReport.ok
                                            ? `Verified ${connectionReport.provider} at ${connectionReport.baseUrl} (${connectionReport.modelCount || 0} models)`
                                            : `Bridge test failed: ${connectionReport.health && connectionReport.health.reason ? connectionReport.health.reason : 'unknown reason'}`}
                                    </div>
                                    {connectionReport.ok && (
                                        <button
                                            type="button"
                                            data-testid="share-proof-open-btn"
                                            onClick={() => setShowShareProofModal(true)}
                                            className="mt-2 px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-100 hover:bg-cyan-500/20"
                                        >
                                            Share Proof
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <AutoUpdateLaneCard licenseMode={settings.licenseMode} />
                    <ProofRelayToggle licenseMode={settings.licenseMode} />
                    <ProofRelayMap licenseMode={settings.licenseMode} />
                    <BillingCenter />
                    <SupportBundleCard />
                    <PolicyProfileCard disabled={!canApplyPolicyProfiles} />
                    {canViewReleaseHealth && <ReleaseHealthConsole />}
                    <AgentStore />
                    <ReferralCard />
                    <VaultCard />
                </div>

                {status.text && (
                    <div data-testid="settings-status-text" className={`mt-4 rounded-xl border px-3 py-2 text-[10px] font-mono ${status.tone === 'ok' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : status.tone === 'bad' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-black/30 text-slate-300'}`}>
                        {status.text}
                    </div>
                )}
            </div>

            <ShareProofModal
                open={showShareProofModal}
                payload={shareProofPayload}
                onClose={() => setShowShareProofModal(false)}
            />
        </>
    );
}






