import React, { useState, useEffect } from 'react';
import { useShell } from '../state/ShellContext';

export default function SettingsDrawer() {
    const { closeSettings } = useShell();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        window.api.settings.get().then(res => setSettings(res || {}));
    }, []);

    const updateSetting = async (key, value) => {
        // Immediate optimistic UI update
        const next = { ...settings, [key]: value };
        setSettings(next);
        // Persist to main process
        await window.api.settings.update(next);
    };

    if (!settings) return null; // Wait for initial load

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-all" onClick={closeSettings} />
            <div data-testid="settings-drawer" className="fixed right-0 top-0 bottom-0 max-w-lg w-full z-50 bg-slate-950 border-l border-cyan-400/20 shadow-[-20px_0_50px_rgba(0,0,0,0.6)] p-8 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Configuration</h2>
                    <button data-testid="settings-close-btn" onClick={closeSettings} className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {/* Security Subsystem */}
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
                        </div>
                    </section>

                    {/* Bridge Connection Profiles */}
                    <section>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-4 font-bold flex items-center gap-2">
                            LLM Bridge Profile
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-mono border border-emerald-500/20">LIVE</span>
                        </div>
                        <div className="space-y-4 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">

                            {/* Provider Select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Provider Engine</label>
                                <select
                                    data-testid="settings-provider-select"
                                    value={settings.provider || 'ollama'}
                                    onChange={e => updateSetting('provider', e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400/50 transition-all cursor-pointer font-mono"
                                >
                                    <option value="ollama">Local Node (Ollama)</option>
                                    <option value="openai">OpenAI Network</option>
                                    <option value="openrouter">OpenRouter Network</option>
                                </select>
                            </div>

                            {/* Base URL */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Base URL / Endpoint</label>
                                <input
                                    type="text"
                                    value={settings.ollamaBaseUrl || ''}
                                    onChange={e => updateSetting('ollamaBaseUrl', e.target.value)}
                                    placeholder={settings.provider === 'ollama' ? "http://127.0.0.1:11434" : "https://api.openai.com/v1"}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                                />
                            </div>

                            {/* API Key */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1 flex justify-between">
                                    <span>Authorization Key</span>
                                    {settings.provider === 'ollama' && <span className="text-slate-600 italic">Optional for Local</span>}
                                </label>
                                <input
                                    type="password"
                                    value={settings.apiKey || ''}
                                    onChange={e => updateSetting('apiKey', e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                                />
                            </div>

                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
