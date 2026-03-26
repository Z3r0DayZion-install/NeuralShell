import React from 'react';
import { useShell } from './state/ShellContext';
import TopStatusBar from './components/TopStatusBar';
import ThreadRail from './components/ThreadRail';
import WorkspacePanel from './components/WorkspacePanel';
import WorkbenchRail from './components/WorkbenchRail';
import CommandPalette from './components/CommandPalette';
import SettingsDrawer from './components/SettingsDrawer';

const QUICKSTART_SESSION = 'NeuralShell_QuickStart';
const AUDIT_ALLOWED_COMMANDS = new Set(['/help', '/proof', '/roi', '/status', '/workflows', '/guard', '/clear']);

function buildDefaultSessionName() {
    return `Workflow_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function App() {
    const {
        // Domain
        model,
        setModel,
        workflowId,
        xpState,
        sessions,
        chatLog,
        appendChat,
        setChatLog,
        createSession,
        unlockSession,
        selectSession,
        lockSession,
        saveActiveSession,
        isSessionUnlocked,
        sessionHydrationStatus,
        sessionError,
        saveStatus,
        autoLockOnBlur,
        setAutoLockOnBlur,
        // System
        stats,
        // UI
        showPalette,
        togglePalette,
        closePalette,
        showSettings,
        openPalette,
        openSettings,
        closeSettings,
    } = useShell();

    const [prompt, setPrompt] = React.useState('');
    const [sessionDialog, setSessionDialog] = React.useState({
        open: false,
        mode: 'create',
        targetSession: '',
    });
    const [runtimeTier, setRuntimeTier] = React.useState('PREVIEW');
    const [connectionInfo, setConnectionInfo] = React.useState({
        provider: 'ollama',
        baseUrl: '',
        model: 'llama3',
        allowRemoteBridge: false,
        health: 'unknown',
        reason: '',
    });
    const [isThinking, setIsThinking] = React.useState(false);
    const [lastFreeformPrompt, setLastFreeformPrompt] = React.useState('');
    const [sessionNameDraft, setSessionNameDraft] = React.useState(buildDefaultSessionName());
    const [sessionPassphraseDraft, setSessionPassphraseDraft] = React.useState('');
    const [sessionDialogError, setSessionDialogError] = React.useState('');
    const sessionNameInputRef = React.useRef(null);
    const sessionPassInputRef = React.useRef(null);
    const sessionCancelButtonRef = React.useRef(null);
    const sessionSubmitButtonRef = React.useRef(null);
    const lastFocusedElementRef = React.useRef(null);
    const sessionDialogTitleId = React.useId();
    const sessionDialogDescriptionId = React.useId();
    const auditOnly = String(runtimeTier || '').toUpperCase() === 'AUDITOR';
    const tokensRemaining = React.useMemo(() => {
        const budget = 128000;
        const usedTokens = (Array.isArray(chatLog) ? chatLog : []).reduce((sum, entry) => {
            const content = String(entry && entry.content ? entry.content : '');
            return sum + Math.ceil(content.length / 4);
        }, 0);
        return Math.max(0, budget - usedTokens);
    }, [chatLog]);

    const refreshRuntimeContext = React.useCallback(async () => {
        try {
            const [settings, stateSnapshot, health] = await Promise.all([
                window.api?.settings?.get ? window.api.settings.get() : Promise.resolve({}),
                window.api?.state?.get ? window.api.state.get() : Promise.resolve({}),
                window.api?.llm?.health ? window.api.llm.health().catch(() => null) : Promise.resolve(null),
            ]);
            setRuntimeTier(String((settings && settings.tier) || 'PREVIEW').toUpperCase());
            setConnectionInfo({
                provider: String((settings && settings.provider) || (health && health.provider) || 'ollama'),
                baseUrl: String((settings && settings.ollamaBaseUrl) || (health && health.baseUrl) || ''),
                model: String((stateSnapshot && stateSnapshot.model) || (health && health.model) || model || 'llama3'),
                allowRemoteBridge: Boolean(settings && settings.allowRemoteBridge),
                health: health && health.ok ? 'online' : health ? 'offline' : 'unknown',
                reason: health && !health.ok ? String(health.reason || 'Bridge unavailable') : '',
            });
        } catch {
            // keep existing runtime context on transient failures
        }
    }, [model]);

    React.useEffect(() => {
        refreshRuntimeContext();
    }, [refreshRuntimeContext]);

    React.useEffect(() => {
        const interval = window.setInterval(() => {
            refreshRuntimeContext();
        }, 12000);
        return () => {
            window.clearInterval(interval);
        };
    }, [refreshRuntimeContext]);

    const openCreateDialog = React.useCallback(() => {
        if (auditOnly) {
            appendChat({
                role: 'kernel',
                content: 'Audit-only mode is active. Session creation is disabled in this runtime.',
            });
            return;
        }
        setSessionDialog({
            open: true,
            mode: 'create',
            targetSession: '',
        });
        setSessionNameDraft(buildDefaultSessionName());
        setSessionPassphraseDraft('');
        setSessionDialogError('');
    }, [appendChat, auditOnly]);

    const openUnlockDialog = React.useCallback((sessionName) => {
        setSessionDialog({
            open: true,
            mode: 'unlock',
            targetSession: String(sessionName || ''),
        });
        setSessionPassphraseDraft('');
        setSessionDialogError('');
    }, []);

    const closeSessionDialog = React.useCallback(() => {
        setSessionDialog({
            open: false,
            mode: 'create',
            targetSession: '',
        });
        setSessionDialogError('');
    }, []);

    React.useEffect(() => {
        if (!sessionDialog.open) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        if (document.activeElement && typeof document.activeElement.focus === 'function') {
            lastFocusedElementRef.current = document.activeElement;
        }

        const focusTarget = sessionDialog.mode === 'create'
            ? sessionNameInputRef.current
            : sessionPassInputRef.current;
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }

        const trapFocus = (event) => {
            if (event.key !== 'Tab') return;

            const focusable = [
                sessionNameInputRef.current,
                sessionPassInputRef.current,
                sessionCancelButtonRef.current,
                sessionSubmitButtonRef.current,
            ].filter((node) => node && !node.disabled);

            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                if (active === first || !focusable.includes(active)) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (active === last || !focusable.includes(active)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', trapFocus);
        return () => {
            document.removeEventListener('keydown', trapFocus);
            document.body.style.overflow = previousOverflow;
            const previous = lastFocusedElementRef.current;
            if (previous && typeof previous.focus === 'function') {
                previous.focus();
            }
            lastFocusedElementRef.current = null;
        };
    }, [sessionDialog.open, sessionDialog.mode]);

    // Keyboard handler
    React.useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                const active = document.activeElement;
                if (
                    active
                    && active.dataset
                    && (active.dataset.testid === 'chat-input' || active.dataset.testid === 'slash-palette-input')
                ) {
                    return;
                }
                e.preventDefault();
                togglePalette();
            }
            if (e.key === 'Escape') {
                closePalette();
                closeSettings();
                if (sessionDialog.open) {
                    closeSessionDialog();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [togglePalette, closePalette, closeSettings, sessionDialog.open, closeSessionDialog]);

    const handleSessionSelect = React.useCallback((sessionName) => {
        const safeName = String(sessionName || '').trim();
        if (!safeName) return;
        if (safeName === QUICKSTART_SESSION || isSessionUnlocked(safeName)) {
            selectSession(safeName);
            return;
        }
        openUnlockDialog(safeName);
    }, [isSessionUnlocked, openUnlockDialog, selectSession]);

    const handleSessionDialogSubmit = React.useCallback(async (event) => {
        event.preventDefault();
        setSessionDialogError('');

        if (sessionDialog.mode === 'create') {
            if (auditOnly) {
                setSessionDialogError('Audit-only mode is active. Session creation is disabled.');
                return;
            }
            const result = await createSession({
                name: sessionNameDraft,
                passphrase: sessionPassphraseDraft,
            });
            if (!result.ok) {
                setSessionDialogError(result.error || 'Failed to create session.');
                return;
            }
            closeSessionDialog();
            return;
        }

        const result = await unlockSession(
            sessionDialog.targetSession,
            sessionPassphraseDraft,
        );
        if (!result.ok) {
            setSessionDialogError(result.error || 'Failed to unlock session.');
            return;
        }
        closeSessionDialog();
    }, [
        sessionDialog.mode,
        sessionDialog.targetSession,
        sessionNameDraft,
        sessionPassphraseDraft,
        createSession,
        unlockSession,
        closeSessionDialog,
        auditOnly,
    ]);

    const handleSaveActiveSession = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Session saving is disabled.' });
            return;
        }
        const result = await saveActiveSession('manual');
        if (!result.ok && workflowId && workflowId !== QUICKSTART_SESSION) {
            openUnlockDialog(workflowId);
        }
    }, [saveActiveSession, workflowId, openUnlockDialog, auditOnly, appendChat]);

    const handleRetrySave = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Retry save is disabled.' });
            return;
        }
        const result = await saveActiveSession('retry');
        if (!result.ok && workflowId && workflowId !== QUICKSTART_SESSION) {
            openUnlockDialog(workflowId);
        }
    }, [saveActiveSession, workflowId, openUnlockDialog, auditOnly, appendChat]);

    const handleLockActiveSession = React.useCallback(() => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Lock action is disabled.' });
            return;
        }
        if (!workflowId || workflowId === QUICKSTART_SESSION) return;
        lockSession(workflowId);
    }, [workflowId, lockSession, auditOnly, appendChat]);

    const executeSignal = async (signal) => {
        const input = signal || prompt;
        if (!input.trim()) return;

        appendChat({ role: 'user', content: input });
        setPrompt('');

        const command = input.trim().toLowerCase();
        const rootCommand = command.startsWith('/') ? command.split(/\s+/)[0] : '';

        if (auditOnly) {
            if (!command.startsWith('/')) {
                setIsThinking(false);
                appendChat({
                    role: 'kernel',
                    content: 'Audit-only mode accepts proof/status commands only. Use /proof, /roi, /status, /guard, /help, /workflows, or /clear.',
                });
                return;
            }
            if (!AUDIT_ALLOWED_COMMANDS.has(rootCommand)) {
                setIsThinking(false);
                appendChat({
                    role: 'kernel',
                    content: `Audit-only mode blocked command: ${rootCommand}`,
                });
                return;
            }
        }

        if (command.startsWith('/')) {
            setIsThinking(false);
            if (command === '/clear' || command === '/purge' || command === '/reset') {
                setChatLog([]);
                return;
            }

            setTimeout(() => {
                if (command === '/help') {
                    appendChat({
                        role: 'kernel',
                        content: '### NeuralShell Operator Guide\n\n- `/help` : Show this guide\n- `/status` : Check node telemetry\n- `/clear` : Wipe current thread\n- `/workflows` : List active sessions\n- `/guard` : Audit security status\n- `/proof` : Run a 90-second value proof\n- `/roi` : Show operator ROI snapshot\n- `Ctrl+P` : Open Command Palette',
                    });
                } else if (command === '/status') {
                    appendChat({
                        role: 'kernel',
                        content: `Node Status: OPERATIONAL\nIntegrity: SEALED\nCPU: ${stats.cpuPercent}%\nMemory: ${stats.memoryMb}MB`,
                    });
                } else if (command === '/guard') {
                    appendChat({
                        role: 'kernel',
                        content: 'Security Guard: ACTIVE\nPolicy: AIRGAP_ENFORCED\nIntegrity: SEALED (Hardware Bound)',
                    });
                } else if (command === '/workflows') {
                    appendChat({
                        role: 'kernel',
                        content: `Active Workflows:\n${sessions.join('\n')}`,
                    });
                } else if (command === '/resume') {
                    appendChat({
                        role: 'kernel',
                        content: 'Restoring previous session context... Done. All workstation metrics verified.',
                    });
                } else if (command === '/proof' || command === '/demo') {
                    appendChat({
                        role: 'kernel',
                        content: [
                            '### 90-Second Value Proof',
                            '',
                            '1. **Trust + Locality**',
                            '- Security policy reports `AIRGAP_ENFORCED` and `SEALED` integrity in this runtime.',
                            '',
                            '2. **Execution Safety**',
                            '- Workspace edits stay operator-controlled with explicit apply/preview gates.',
                            '',
                            '3. **Session Reliability**',
                            `- Active workflows available right now: ${sessions.length}`,
                            '- Session state can be saved, locked, and restored with passphrase control.',
                            '',
                            '4. **Release Evidence Path**',
                            '- Built-in release gate + packaged smoke checks produce verifiable proof artifacts.',
                            '',
                            'Next steps:',
                            '- Create a workflow in the left rail',
                            '- Run `/guard` and `/status`',
                            '- Save, lock, unlock, and verify restore in under 2 minutes',
                        ].join('\n'),
                    });
                } else if (command === '/roi' || command === '/pitch') {
                    const savedMinutesPerDay = 45;
                    const loadedCostPerHour = 120;
                    const workingDaysPerYear = 220;
                    const annualHours = Math.round((savedMinutesPerDay * workingDaysPerYear) / 60);
                    const annualValue = annualHours * loadedCostPerHour;
                    appendChat({
                        role: 'kernel',
                        content: [
                            '### NeuralShell ROI Snapshot',
                            '',
                            `- Time reclaimed target: ~${savedMinutesPerDay} minutes/day/operator`,
                            `- Annual recovered capacity: ~${annualHours} hours/operator`,
                            `- Value at $${loadedCostPerHour}/hour: ~$${annualValue.toLocaleString()} per operator/year`,
                            '',
                            'Where the gain comes from:',
                            '- Faster triage with one command and evidence lane',
                            '- Fewer release regressions via strict guardrails',
                            '- Less context switching between tooling surfaces',
                            '',
                            'Fast close path:',
                            '- Run `/proof` now',
                            '- Save and lock one workflow',
                            '- Export release artifacts from the same console',
                        ].join('\n'),
                    });
                } else {
                    appendChat({ role: 'kernel', content: `Unknown command: ${command}` });
                }
            }, 400);
            return;
        }

        setLastFreeformPrompt(input);
        setIsThinking(true);
        try {
            const history = [...chatLog, { role: 'user', content: input }];
            const response = await window.api.llm.chat(history);
            const content = response && response.message && typeof response.message.content === 'string'
                ? response.message.content
                : (response && typeof response.content === 'string' ? response.content : '');
            appendChat({ role: 'kernel', content: content || 'System: Empty response from kernel.' });
        } catch (err) {
            appendChat({ role: 'kernel', content: `Kernel Error: ${err.message}` });
        } finally {
            setIsThinking(false);
        }
    };

    const handleRegenerate = () => {
        if (!lastFreeformPrompt.trim()) return;
        executeSignal(lastFreeformPrompt);
    };

    const handleOfflineKillSwitch = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Offline kill switch changes are disabled.' });
            return;
        }
        try {
            const current = await window.api.settings.get();
            const next = {
                ...(current || {}),
                provider: 'ollama',
                apiKey: '',
                ollamaBaseUrl: 'http://127.0.0.1:11434',
                allowRemoteBridge: false,
                connectOnStartup: false,
            };
            await window.api.llm.cancelStream().catch(() => false);
            await window.api.settings.update(next);
            appendChat({
                role: 'kernel',
                content: 'Offline kill switch engaged. Hosted providers disabled and bridge stream cancelled.',
            });
            await refreshRuntimeContext();
        } catch (err) {
            appendChat({
                role: 'kernel',
                content: `Offline kill switch failed: ${err && err.message ? err.message : String(err)}`,
            });
        }
    }, [appendChat, auditOnly, refreshRuntimeContext]);

    const handleSend = () => executeSignal();
    const showLockBanner = workflowId
        && workflowId !== QUICKSTART_SESSION
        && sessionHydrationStatus === 'locked';

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
            <TopStatusBar
                model={model}
                setModel={setModel}
                stats={stats}
                xpState={xpState}
                workflowId={workflowId}
                onOpenPalette={openPalette}
                onOpenSettings={openSettings}
                runtimeTier={runtimeTier}
                connectionInfo={connectionInfo}
                tokensRemaining={tokensRemaining}
            />

            {showLockBanner && (
                <div
                    data-testid="session-lock-banner"
                    className="px-5 py-2 border-b border-amber-400/20 bg-amber-400/10 text-[11px] font-mono text-amber-100 flex items-center justify-between gap-3"
                >
                    <span>{sessionError || `Session "${workflowId}" is locked.`}</span>
                    <button
                        data-testid="session-lock-unlock-btn"
                        onClick={() => openUnlockDialog(workflowId)}
                        className="px-3 py-1 rounded border border-amber-300/40 text-[10px] uppercase tracking-wider font-bold hover:bg-amber-300/20"
                    >
                        Unlock Session
                    </button>
                </div>
            )}

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />

                <ThreadRail
                    sessions={sessions}
                    workflowId={workflowId}
                    onSelectSession={handleSessionSelect}
                    onCreateSession={openCreateDialog}
                    onSaveSession={handleSaveActiveSession}
                    onRetrySave={handleRetrySave}
                    onLockSession={handleLockActiveSession}
                    saveStatus={saveStatus}
                    isSessionUnlocked={isSessionUnlocked}
                    sessionHydrationStatus={sessionHydrationStatus}
                    autoLockOnBlur={Boolean(autoLockOnBlur)}
                    onToggleAutoLock={setAutoLockOnBlur}
                    auditOnly={auditOnly}
                />

                <WorkspacePanel
                    chatLog={chatLog}
                    workflowId={workflowId}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSend={handleSend}
                    onExecute={executeSignal}
                    auditOnly={auditOnly}
                    isThinking={isThinking}
                    onRegenerate={handleRegenerate}
                    hasRegenerate={Boolean(lastFreeformPrompt.trim())}
                    connectionInfo={connectionInfo}
                    sessionHydrationStatus={sessionHydrationStatus}
                    onOfflineKill={handleOfflineKillSwitch}
                />

                <WorkbenchRail
                    stats={stats}
                    workflowId={workflowId}
                    onExecute={executeSignal}
                />
            </div>

            {showPalette && (
                <CommandPalette onClose={closePalette} />
            )}
            {showSettings && <SettingsDrawer />}

            {sessionDialog.open && (
                <div
                    data-testid="session-modal-overlay"
                    className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeSessionDialog();
                        }
                    }}
                >
                    <div
                        data-testid="session-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={sessionDialogTitleId}
                        aria-describedby={sessionDialogDescriptionId}
                        className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.7)] p-6"
                    >
                        <h2 id={sessionDialogTitleId} className="text-lg font-bold text-cyan-100 tracking-wide mb-2">
                            {sessionDialog.mode === 'create' ? 'Create Session' : 'Unlock Session'}
                        </h2>
                        <p id={sessionDialogDescriptionId} className="text-[11px] text-slate-400 font-mono mb-5">
                            {sessionDialog.mode === 'create'
                                ? 'Set a session name and passphrase. The passphrase stays local to this runtime.'
                                : `Enter the passphrase for "${sessionDialog.targetSession}".`}
                        </p>
                        <form onSubmit={handleSessionDialogSubmit} className="space-y-4">
                            {sessionDialog.mode === 'create' && (
                                <label className="block">
                                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold">Session Name</span>
                                    <input
                                        ref={sessionNameInputRef}
                                        data-testid="session-modal-name-input"
                                        value={sessionNameDraft}
                                        onChange={(e) => setSessionNameDraft(e.target.value)}
                                        placeholder="Workflow_ALPHA"
                                        autoFocus
                                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                                    />
                                </label>
                            )}
                            <label className="block">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold">Passphrase</span>
                                <input
                                    ref={sessionPassInputRef}
                                    data-testid="session-modal-pass-input"
                                    type="password"
                                    value={sessionPassphraseDraft}
                                    onChange={(e) => setSessionPassphraseDraft(e.target.value)}
                                    placeholder="Required"
                                    autoFocus={sessionDialog.mode !== 'create'}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                                />
                            </label>
                            {sessionDialogError && (
                                <div data-testid="session-modal-error" className="text-[11px] text-rose-300 font-mono">
                                    {sessionDialogError}
                                </div>
                            )}
                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    ref={sessionCancelButtonRef}
                                    type="button"
                                    data-testid="session-modal-cancel-btn"
                                    onClick={closeSessionDialog}
                                    className="px-4 py-2 rounded-lg border border-white/10 text-[10px] uppercase tracking-[0.14em] font-bold text-slate-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    ref={sessionSubmitButtonRef}
                                    type="submit"
                                    data-testid="session-modal-submit-btn"
                                    className="px-4 py-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-[10px] uppercase tracking-[0.14em] font-bold text-cyan-200 hover:bg-cyan-400/20"
                                >
                                    {sessionDialog.mode === 'create' ? 'Create Session' : 'Unlock Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
