import React from 'react';
import { Moon, Sun, SunMoon, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLatencyHistory } from '../hooks/useLatencyHistory.ts';
import { useUIPreferences } from '../state/useUIPreferences';
import TierBadge from './TierBadge';
import WatchdogStatusBadge from './WatchdogStatusBadge.jsx';
import ApplianceModeBadge from './ApplianceModeBadge.jsx';
import AirGapModeBadge from './AirGapModeBadge.jsx';
import DemoModeBadge from './DemoModeBadge.jsx';
import { version as APP_VERSION } from '../../../../package.json';

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
    onOpenAnalytics,
    onOpenEcosystem,
    onOpenMissionControl,
    onOpenFleetControl,
    onOpenApplianceConsole,
    onOpenAirGapOperations,
    onOpenInstitutionalCommand,
    onOpenDemoFlow,
    onOpenFieldLaunch,
    onToggleScratchpad,
    watchdogStatus,
    watchdogAlertCount,
    onOpenRuntimeAlerts,
    runtimeTier,
    connectionInfo,
    tokensRemaining,
    collabConnected,
    collabRoomId,
    collabPeerCount,
    accelStatus,
    applianceModeEnabled,
    airGapLocked,
    demoModeEnabled,
    feedbackDisabled,
    feedbackUrl,
    onOpenIssueAssist,
    tierId,
    tierLabel,
    canGoBack,
    canGoForward,
    onGoBack,
    onGoForward,
    onOpenTaskManager,
}) {
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
    const resolvedFeedbackUrl = String(
        feedbackUrl
        || 'https://github.com/Z3r0DayZion-install/NeuralShell/issues/new?template=bug_report.md&title=Feedback%3A+'
    );
    const canOpenFeedback = !feedbackDisabled
        && Boolean(window.api && window.api.system && typeof window.api.system.openExternal === 'function');
    const handleOpenFeedback = React.useCallback(() => {
        if (!canOpenFeedback) return;
        if (typeof onOpenIssueAssist === 'function') {
            onOpenIssueAssist();
            return;
        }
        window.api.system.openExternal(resolvedFeedbackUrl).catch(() => undefined);
    }, [canOpenFeedback, onOpenIssueAssist, resolvedFeedbackUrl]);

    const [moreOpen, setMoreOpen] = React.useState(false);
    const moreMenuRef = React.useRef(null);

    React.useEffect(() => {
        if (!moreOpen) return;
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [moreOpen]);

    return (
        <header data-testid="top-status-bar" className="h-12 border-b border-indigo-500/15 bg-shell-soft/95 backdrop-blur-md flex items-center justify-between px-4 z-30 shrink-0" style={{ borderImage: 'linear-gradient(90deg, rgba(139,92,246,0.2), rgba(217,70,239,0.2), rgba(6,182,212,0.2), rgba(139,92,246,0.2)) 1', backgroundSize: '200% 100%' }}>
            <div className="flex gap-4 items-center">
                <button
                    type="button"
                    data-testid="nav-back-btn"
                    disabled={!canGoBack}
                    onClick={onGoBack}
                    className={`p-1.5 rounded-lg border transition-all ${
                        canGoBack
                            ? 'border-orange-400/20 bg-orange-500/10 text-orange-300 hover:text-orange-200 hover:bg-orange-500/20 hover:border-orange-400/40'
                            : 'border-transparent text-slate-600 cursor-default'
                    }`}
                    title="Back (Mouse4 / Alt+Left)"
                >
                    <ArrowLeft size={14} />
                </button>
                <button
                    type="button"
                    data-testid="nav-forward-btn"
                    disabled={!canGoForward}
                    onClick={onGoForward}
                    className={`p-1.5 rounded-lg border transition-all ${
                        canGoForward
                            ? 'border-orange-400/20 bg-orange-500/10 text-orange-300 hover:text-orange-200 hover:bg-orange-500/20 hover:border-orange-400/40'
                            : 'border-transparent text-slate-600 cursor-default'
                    }`}
                    title="Forward (Mouse5 / Alt+Right)"
                >
                    <ArrowRight size={14} />
                </button>
                <div data-testid="trust-indicator" className="flex flex-col">
                    <div className="text-[10px] uppercase tracking-[0.3em] font-black text-gradient animate-gradient-shift" style={{ backgroundImage: 'linear-gradient(90deg, #8b5cf6, #d946ef, #06b6d4, #8b5cf6)' }}>NeuralShell</div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                        <span className="text-sky-300">v</span><span className="text-amber-300">{APP_VERSION}</span>
                        <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)] animate-breathe" />
                        <TierBadge tierId={tierId} tierLabel={tierLabel} />
                    </div>
                </div>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-black/30 rounded-full border border-violet-500/10 text-[10px] font-mono text-slate-400 tracking-wide">
                <span className="text-slate-500">workflow</span>
                <span className="text-violet-400/60">=</span>
                {workflowId ? (
                    <span className="text-green-300 font-semibold">"{workflowId}"</span>
                ) : (
                    <span className="text-slate-600 italic">null</span>
                )}
            </div>

            <div className="flex gap-2 items-center">
                <select
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="bg-violet-500/5 border border-violet-400/15 rounded-lg px-2.5 py-1 text-[11px] text-sky-300 outline-none focus:border-violet-400/40 transition-all font-mono hover:bg-violet-500/10 cursor-pointer appearance-none min-w-20 shadow-inner"
                >
                    {modelOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>

                <div
                    data-testid="presence-pill"
                    title={tooltip}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                        connectionHealth === 'online'
                            ? 'border-green-400/25 bg-green-500/8 text-green-200 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                            : connectionHealth === 'offline'
                                ? 'border-red-400/30 bg-red-500/10 text-red-300 animate-pulse'
                                : 'border-yellow-400/20 bg-yellow-500/8 text-yellow-200'
                    }`}
                >
                    <span className="text-green-300">{modelLabel}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-yellow-300">{latencyMs}<span className="text-slate-500">ms</span></span>
                </div>

                <WatchdogStatusBadge
                    status={watchdogStatus}
                    alertCount={watchdogAlertCount}
                    onClick={onOpenRuntimeAlerts}
                />

                <button
                    data-testid="command-palette-btn"
                    onClick={onOpenPalette}
                    className="px-3 py-1.5 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider hover:bg-fuchsia-400/20 hover:border-fuchsia-400/50 transition-all animate-glow-pulse active:scale-95 alive-hover"
                >
                    EXEC
                </button>

                <div className="relative" ref={moreMenuRef}>
                    <button
                        type="button"
                        data-testid="more-menu-btn"
                        onClick={() => setMoreOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
                            moreOpen
                                ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:border-violet-400/20'
                        }`}
                        title="More panels & tools"
                    >
                        More <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {moreOpen && (
                        <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-violet-500/15 bg-shell-mid/98 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.7)] py-1.5 z-50 max-h-[70vh] overflow-y-auto animate-fade-up">
                            <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-600">// infrastructure</div>
                            {[
                                { label: 'Analytics', testId: 'analytics-open-btn', onClick: onOpenAnalytics, color: 'text-yellow-300' },
                                { label: 'Ecosystem', testId: 'ecosystem-open-btn', onClick: onOpenEcosystem, color: 'text-sky-300' },
                                { label: 'Mission Control', testId: 'mission-control-open-btn', onClick: onOpenMissionControl, color: 'text-violet-300' },
                                { label: 'Fleet Control', testId: 'fleet-control-open-btn', onClick: onOpenFleetControl, color: 'text-blue-300' },
                                { label: 'Institutional', testId: 'institutional-command-open-btn', onClick: onOpenInstitutionalCommand, color: 'text-indigo-300' },
                            ].filter((item) => typeof item.onClick === 'function').map((item) => (
                                <button
                                    key={item.testId}
                                    type="button"
                                    data-testid={item.testId}
                                    onClick={() => { item.onClick(); setMoreOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-[12px] font-mono hover:bg-white/8 transition-colors flex items-center gap-2 ${item.color}`}
                                >
                                    <span className="text-slate-600 text-[10px]">→</span> {item.label}
                                </button>
                            ))}
                            {(onOpenDemoFlow || onOpenFieldLaunch) && (
                                <>
                                    <div className="border-t border-white/5 my-1" />
                                    <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-600">// launch</div>
                                    {[
                                        ...(onOpenDemoFlow ? [{ label: 'Demo Flow', testId: 'demo-flow-open-btn', onClick: onOpenDemoFlow, color: 'text-green-300' }] : []),
                                        ...(onOpenFieldLaunch ? [{ label: 'Field Launch', testId: 'field-launch-open-btn', onClick: onOpenFieldLaunch, color: 'text-orange-300' }] : []),
                                    ].map((item) => (
                                        <button
                                            key={item.testId}
                                            type="button"
                                            data-testid={item.testId}
                                            onClick={() => { item.onClick(); setMoreOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-[12px] font-mono hover:bg-white/8 transition-colors flex items-center gap-2 ${item.color}`}
                                        >
                                            <span className="text-slate-600 text-[10px]">→</span> {item.label}
                                        </button>
                                    ))}
                                </>
                            )}
                            <div className="border-t border-white/5 my-1" />
                            <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-600">// tools</div>
                            {[
                                { label: 'Task Manager', testId: 'task-manager-open-btn', onClick: onOpenTaskManager, color: 'text-rose-300' },
                                { label: 'Scratchpad', testId: 'scratchpad-open-btn', onClick: onToggleScratchpad, color: 'text-amber-300' },
                                { label: 'Feedback', testId: 'feedback-btn', onClick: canOpenFeedback ? handleOpenFeedback : undefined, color: 'text-teal-300' },
                            ].filter((item) => typeof item.onClick === 'function').map((item) => (
                                <button
                                    key={item.testId}
                                    type="button"
                                    data-testid={item.testId}
                                    onClick={() => { item.onClick(); setMoreOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-[12px] font-mono hover:bg-white/8 transition-colors flex items-center gap-2 ${item.color}`}
                                >
                                    <span className="text-slate-600 text-[10px]">→</span> {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    data-testid="theme-toggle-btn"
                    onClick={() => {
                        if (theme === 'system') setTheme('dark');
                        else if (theme === 'dark') setTheme('light');
                        else setTheme('system');
                    }}
                    className="p-1.5 rounded-lg border border-yellow-400/15 bg-yellow-500/5 text-yellow-300/80 hover:text-yellow-200 hover:bg-yellow-500/15 hover:border-yellow-400/30 transition-all"
                    title={`Theme: ${theme}`}
                >
                    {theme === 'dark' ? <Moon size={14} /> : theme === 'light' ? <Sun size={14} /> : <SunMoon size={14} />}
                </button>

                <button
                    data-testid="settings-open-btn"
                    onClick={onOpenSettings}
                    className="p-1.5 rounded-lg border border-slate-400/15 bg-slate-500/5 text-slate-400 hover:text-slate-100 hover:bg-slate-500/15 hover:border-slate-400/30 transition-all group alive-hover"
                    title="Settings (Ctrl+,)"
                >
                    <span className="group-hover:rotate-90 transition-transform duration-500 inline-block text-[14px]">⚙</span>
                </button>

                <ApplianceModeBadge
                    enabled={applianceModeEnabled}
                    onOpen={onOpenApplianceConsole}
                />
                <AirGapModeBadge
                    locked={airGapLocked}
                    onOpen={onOpenAirGapOperations}
                />
                <DemoModeBadge
                    enabled={demoModeEnabled}
                    onOpen={onOpenDemoFlow}
                />
            </div>
        </header>
    );
}

export default TopStatusBar;

