import React from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { useLatencyHistory } from '../hooks/useLatencyHistory.ts';
import { useUIPreferences } from '../state/useUIPreferences';

function estimateCostPer1k(providerId) {
    const provider = String(providerId || '').trim().toLowerCase();
    if (provider === 'openai') return 0.25;
    if (provider === 'openrouter') return 0.35;
    if (provider === 'groq') return 0.12;
    if (provider === 'together') return 0.2;
    if (provider === 'custom_openai') return 0.3;
    return 0;
}

function buildSparkline(samples, width, height) {
    const safe = Array.isArray(samples) ? samples : [];
    if (!safe.length) {
        return `M 0 ${height / 2} L ${width} ${height / 2}`;
    }
    const max = Math.max(...safe.map((sample) => Number(sample.ms || 0)), 1);
    const min = Math.min(...safe.map((sample) => Number(sample.ms || 0)), 0);
    const span = Math.max(1, max - min);
    return safe.map((sample, index) => {
        const x = safe.length === 1 ? width : (index / (safe.length - 1)) * width;
        const y = height - ((Number(sample.ms || 0) - min) / span) * height;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

export function TopStatusBar({
    model,
    setModel,
    stats,
    xpState,
    workflowId,
    onOpenPalette,
    onOpenSettings,
    runtimeTier,
    connectionInfo,
    tokensRemaining,
}) {
    const tierName = ['INITIATE', 'OPERATOR', 'ANALYST', 'EXECUTOR', 'WARLORD', 'EXECUTIONER', 'APEX', 'GOD_MODE', 'PHASE_24_MUTANT'][Math.min((xpState?.tier || 1) - 1, 8)];
    const safeRuntimeTier = String(runtimeTier || 'PREVIEW').toUpperCase();
    const providerId = String((connectionInfo && connectionInfo.provider) || 'ollama');
    const connectionHealth = String((connectionInfo && connectionInfo.health) || 'unknown');
    const modelLabel = String((connectionInfo && connectionInfo.model) || model || 'llama3');
    const modelOptions = Array.from(new Set([
        String(model || '').trim(),
        'llama3',
        'mistral',
        'qwen',
        'gpt-4.1-mini',
        'gpt-4o-mini',
        'llama-3.3-70b-versatile',
    ].filter(Boolean)));

    const { samples, latencyMs, avgLatencyMs } = useLatencyHistory({ windowMs: 5000, pollMs: 1000 });
    const presencePath = React.useMemo(() => buildSparkline(samples, 54, 14), [samples]);
    const { temperature, setTemperature, theme, setTheme } = useUIPreferences();
    const costPer1k = estimateCostPer1k(providerId);

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.theme = String(theme || 'system');
    }, [theme]);

    const tooltip = `${providerId}/${modelLabel} | ${latencyMs}ms live (${avgLatencyMs}ms avg) | $${costPer1k.toFixed(2)}/1K tokens`;

    return (
        <header data-testid="top-status-bar" className="h-14 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
            <div className="flex gap-8 items-center">
                <div data-testid="trust-indicator" className="flex flex-col">
                    <div className="text-[9px] uppercase tracking-[0.4em] text-cyan-500/60 font-black mb-0.5">Trust_Node_Sovereign</div>
                    <div className="text-[13px] font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                        NeuralShell_V2.2.0
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                        <span className="px-1.5 py-0.5 rounded border border-cyan-400/30 bg-cyan-500/10 text-[8px] font-mono text-cyan-200 uppercase tracking-[0.16em]">
                            Proof-First
                        </span>
                        {safeRuntimeTier === 'AUDITOR' ? (
                            <span className="px-1.5 py-0.5 rounded border border-amber-300/40 bg-amber-400/10 text-[8px] font-mono text-amber-200 uppercase tracking-[0.16em]">
                                Audit-Only
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.5 rounded border border-emerald-300/30 bg-emerald-400/10 text-[8px] font-mono text-emerald-200 uppercase tracking-[0.16em]">
                                {safeRuntimeTier}
                            </span>
                        )}
                    </div>
                </div>

                <div className="h-6 w-px bg-white/5 mx-1" />

                <div className="flex gap-8 items-center">
                    <div className="flex flex-col">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-0.5 font-bold">Security_Clearance</div>
                        <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest">{tierName}</div>
                    </div>
                    <div className="flex flex-col min-w-36">
                        <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] text-cyan-500 mb-0.5 font-bold">
                            <span>System_Rank_{xpState?.tier || 1}</span>
                            <span className="text-cyan-400/80 font-mono tracking-tighter">{xpState?.xp || 0}</span>
                        </div>
                        <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 transition-all duration-1000 shadow-glow-cyan"
                                style={{ width: `${Math.min((xpState?.xp % 1000) / 10, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden 2xl:flex items-center gap-3 px-6 py-2 bg-black/60 rounded-full border border-white/[0.06] text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] shadow-inner transition-colors group hover:border-cyan-400/30">
                <span className="text-cyan-500/40 group-hover:text-cyan-500/80 transition-colors">active</span>
                <span className="opacity-40">/</span>
                <span className="text-cyan-500/40 group-hover:text-cyan-500/80 transition-colors">workflows</span>
                <span className="opacity-40">/</span>
                {workflowId ? (
                    <span className="text-cyan-300 font-bold tracking-tight bg-cyan-400/10 px-2 py-0.5 rounded">{workflowId}</span>
                ) : (
                    <span className="text-slate-600 italic">idle_empty_state</span>
                )}
            </div>

            <div className="flex gap-3 items-center">
                <div className="flex flex-col items-end mr-1">
                    <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">CPU_LOAD</div>
                    <div className="text-[10px] font-mono text-slate-400 leading-none">{stats.cpuPercent || 0}%</div>
                </div>

                <select
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 outline-none focus:border-cyan-400/40 transition-all font-mono hover:bg-white/10 cursor-pointer appearance-none tracking-widest uppercase text-center min-w-24 shadow-inner"
                >
                    {modelOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>

                <div
                    data-testid="presence-pill"
                    title={tooltip}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[9px] font-mono ${
                        connectionHealth === 'online'
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                            : connectionHealth === 'offline'
                                ? 'border-rose-300/30 bg-rose-500/10 text-rose-100'
                                : 'border-slate-300/20 bg-slate-500/10 text-slate-200'
                    }`}
                >
                    <span className="uppercase">{modelLabel}</span>
                    <span>·</span>
                    <span>{`T ${temperature.toFixed(2)}`}</span>
                    <span>·</span>
                    <span>{`🔋 ${Math.max(0, Number(tokensRemaining || 0)).toLocaleString()}`}</span>
                    <svg data-testid="latency-sparkline" width="54" height="14" viewBox="0 0 54 14" className="opacity-90">
                        <path d={presencePath} fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>

                <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                    <button
                        type="button"
                        data-testid="temperature-down-btn"
                        onClick={() => setTemperature(temperature - 0.05)}
                        className="px-2 py-1 text-[9px] font-mono text-slate-300 hover:bg-white/10"
                    >
                        T-
                    </button>
                    <button
                        type="button"
                        data-testid="temperature-up-btn"
                        onClick={() => setTemperature(temperature + 0.05)}
                        className="px-2 py-1 text-[9px] font-mono text-slate-300 hover:bg-white/10 border-l border-white/10"
                    >
                        T+
                    </button>
                </div>

                <button
                    type="button"
                    data-testid="theme-toggle-btn"
                    onClick={() => {
                        if (theme === 'system') setTheme('dark');
                        else if (theme === 'dark') setTheme('light');
                        else setTheme('system');
                    }}
                    className="p-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-slate-100 hover:bg-white/10 hover:border-white/20 transition-all"
                    title={`Theme: ${theme}`}
                >
                    {theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <SunMoon size={14} />}
                </button>

                <button
                    data-testid="command-palette-btn"
                    onClick={onOpenPalette}
                    className="px-4 py-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-[10px] font-black text-cyan-300 uppercase tracking-[0.2em] hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] active:scale-95"
                >
                    EXEC
                </button>
                <button
                    data-testid="settings-open-btn"
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-100 hover:bg-white/10 hover:border-white/20 transition-all group"
                    title="Control Panel"
                >
                    <span className="group-hover:rotate-90 transition-transform duration-500 inline-block text-[14px]">⚙</span>
                </button>
            </div>
        </header>
    );
}

export default TopStatusBar;
