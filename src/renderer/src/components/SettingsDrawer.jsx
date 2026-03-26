import React, { useState, useEffect, useMemo } from 'react';
import { useShell } from '../state/ShellContext';

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

export default function SettingsDrawer() {
    const { closeSettings } = useShell();
    const [settings, setSettings] = useState(null);
    const [modelDraft, setModelDraft] = useState('llama3');
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState({ tone: 'idle', text: '' });
    const [connectionReport, setConnectionReport] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [rawSettings, rawState] = await Promise.all([
                    window.api.settings.get(),
                    window.api.state.get(),
                ]);
                if (!mounted) return;
                const resolved = rawSettings || {};
                const provider = String(resolved.provider || 'ollama');
                const baseUrl = String(resolved.ollamaBaseUrl || defaultBaseUrlForProvider(provider)).trim();
                setSettings({
                    ...resolved,
                    provider,
                    ollamaBaseUrl: baseUrl || defaultBaseUrlForProvider(provider),
                });
                setModelDraft(String((rawState && rawState.model) || 'llama3'));
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

    const provider = String((settings && settings.provider) || 'ollama');
    const providerNeedsApiKey = providerRequiresApiKey(provider);
    const modelSuggestions = useMemo(() => {
        const seeded = PROVIDER_MODEL_SUGGESTIONS[provider] || [];
        const combined = [...seeded, String(modelDraft || '').trim()].filter(Boolean);
        return Array.from(new Set(combined));
    }, [provider, modelDraft]);

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
            }
            setConnectionReport(null);
        }

        setSettings(next);
        try {
            await window.api.settings.update(next);
            setStatus({ tone: 'ok', text: 'Settings saved.' });
        } catch (err) {
            setStatus({
                tone: 'bad',
                text: `Settings save failed: ${err && err.message ? err.message : String(err)}`,
            });
        }
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
                ollamaBaseUrl: defaultBaseUrlForProvider('ollama'),
                allowRemoteBridge: false,
                connectOnStartup: false,
            };
            setSettings(next);
            await window.api.settings.update(next);
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
            <div data-testid="settings-drawer" className="fixed right-0 top-0 bottom-0 max-w-lg w-full z-50 bg-slate-950 border-l border-cyan-400/20 shadow-[-20px_0_50px_rgba(0,0,0,0.6)] p-8 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Configuration</h2>
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
                                    {connectionReport.ok
                                        ? `Verified ${connectionReport.provider} at ${connectionReport.baseUrl} (${connectionReport.modelCount || 0} models)`
                                        : `Bridge test failed: ${connectionReport.health && connectionReport.health.reason ? connectionReport.health.reason : 'unknown reason'}`}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {status.text && (
                    <div data-testid="settings-status-text" className={`mt-4 rounded-xl border px-3 py-2 text-[10px] font-mono ${status.tone === 'ok' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : status.tone === 'bad' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-black/30 text-slate-300'}`}>
                        {status.text}
                    </div>
                )}
            </div>
        </>
    );
}
