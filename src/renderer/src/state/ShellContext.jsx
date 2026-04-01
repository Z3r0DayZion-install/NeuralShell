/**
 * ShellContext — NeuralShell Renderer State Architecture
 *
 * Centralizes shell-global state into categorized slices:
 *   UI       -> drawer open, palette open, selected tab
 *   Domain   -> threads, sessions, active model, XP, chat
 *   System   -> bridge connectivity, telemetry, integrity
 *
 * Components consume via useShell() instead of prop drilling.
 */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { useNeuralState } from '../hooks/useNeuralState';

const ShellContext = createContext(null);

const DEFAULT_WORKFLOW = 'default';
const QUICKSTART_SESSION = 'NeuralShell_QuickStart';
const AUTOSAVE_DEBOUNCE_MS = 1200;

function normalizeSessionName(value) {
    return String(value || '').trim();
}

function normalizeSessionList(rawList) {
    const base = Array.isArray(rawList) ? rawList : [];
    const unique = Array.from(
        new Set(
            base
                .map((entry) => normalizeSessionName(entry))
                .filter(Boolean),
        ),
    );
    if (!unique.length) {
        unique.push(QUICKSTART_SESSION);
    }
    return unique;
}

export function ShellProvider({ children }) {
    // Domain State (IPC-backed)
    const [model, setModel] = useNeuralState('model', 'llama3');
    const [workflowId, setWorkflowId] = useNeuralState('workflowId', DEFAULT_WORKFLOW);
    const [xpState] = useNeuralState('nt_xp_state', { xp: 0, tier: 1 });
    const [autoLockOnBlur, setAutoLockOnBlur] = useNeuralState('sessionAutoLockOnBlur', false);
    const [outputMode, setOutputMode] = useState('checklist');
    const [workspaceAttachment, setWorkspaceAttachment] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [chatLog, setChatLog] = useState([]);
    const [unlockedSessions, setUnlockedSessions] = useState({});

    // System State (Polled)
    const [stats, setStats] = useState({ cpuPercent: 0, memoryMb: 0 });
    const [sessionHydrationStatus, setSessionHydrationStatus] = useState('idle');
    const [sessionError, setSessionError] = useState('');
    const [saveStatus, setSaveStatus] = useState({
        state: 'idle',
        detail: '',
        at: 0,
    });

    // UI State (Local)
    const [showPalette, setShowPalette] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const sessionPassphrasesRef = useRef({});
    const autosaveTimerRef = useRef(null);
    const lastSavedDigestRef = useRef(new Map());
    const hydrateSequenceRef = useRef(0);

    const clearSessionRuntimeState = useCallback(() => {
        setChatLog([]);
        setWorkspaceAttachment(null);
        setOutputMode('checklist');
    }, []);

    const isSessionUnlocked = useCallback((sessionName) => {
        const safeName = normalizeSessionName(sessionName);
        if (!safeName || safeName === QUICKSTART_SESSION) {
            return true;
        }
        return Boolean(unlockedSessions[safeName]);
    }, [unlockedSessions]);

    const buildSessionPayload = useCallback((sessionName, overrides = {}) => {
        const safeName = normalizeSessionName(sessionName);
        return {
            chat: Array.isArray(overrides.chat) ? overrides.chat : chatLog,
            model: String(overrides.model || model || 'llama3'),
            workflowId: safeName || String(overrides.workflowId || workflowId || DEFAULT_WORKFLOW),
            outputMode: String(overrides.outputMode || outputMode || 'checklist'),
            workspaceAttachment: overrides.workspaceAttachment === undefined
                ? workspaceAttachment
                : overrides.workspaceAttachment,
            updatedAt: new Date().toISOString(),
        };
    }, [chatLog, model, outputMode, workspaceAttachment, workflowId]);

    const refreshSessions = useCallback(async () => {
        const list = await window.api.session.list();
        const normalized = normalizeSessionList(list);
        setSessions(normalized);
        return normalized;
    }, []);

    const hydrateSession = useCallback(async (sessionName, passphrase) => {
        const safeName = normalizeSessionName(sessionName);
        const safePassphrase = String(passphrase || '').trim();
        if (!safeName || !safePassphrase) {
            return { ok: false, error: 'Session name and passphrase are required.' };
        }

        const seq = hydrateSequenceRef.current + 1;
        hydrateSequenceRef.current = seq;
        setSessionHydrationStatus('loading');
        setSessionError('');

        try {
            const payload = await window.api.session.load(safeName, safePassphrase);
            if (hydrateSequenceRef.current !== seq) {
                return { ok: false, stale: true };
            }

            setChatLog(Array.isArray(payload && payload.chat) ? payload.chat : []);
            setOutputMode(payload && payload.outputMode ? String(payload.outputMode) : 'checklist');
            setWorkspaceAttachment(payload && payload.workspaceAttachment ? payload.workspaceAttachment : null);
            if (payload && payload.model) {
                setModel(String(payload.model));
            }

            setSessionHydrationStatus('ready');
            setSessionError('');
            return { ok: true, payload };
        } catch (err) {
            if (hydrateSequenceRef.current !== seq) {
                return { ok: false, stale: true };
            }
            const message = err && err.message ? err.message : 'Failed to load session.';
            setSessionHydrationStatus('locked');
            setSessionError(`Session "${safeName}" could not be unlocked. ${message}`);
            clearSessionRuntimeState();
            return { ok: false, error: message };
        }
    }, [setModel, clearSessionRuntimeState]);

    const createSession = useCallback(async ({ name, passphrase }) => {
        const safeName = normalizeSessionName(name);
        const safePassphrase = String(passphrase || '').trim();
        if (!safeName) {
            return { ok: false, error: 'Session name is required.' };
        }
        if (!safePassphrase) {
            return { ok: false, error: 'Passphrase is required.' };
        }

        try {
            setSaveStatus({
                state: 'saving',
                detail: `Creating "${safeName}"...`,
                at: Date.now(),
            });
            const payload = buildSessionPayload(safeName, {
                chat: [],
                workflowId: safeName,
                outputMode: 'checklist',
                workspaceAttachment: null,
            });
            await window.api.session.save(safeName, payload, safePassphrase);

            sessionPassphrasesRef.current[safeName] = safePassphrase;
            setUnlockedSessions((prev) => ({
                ...prev,
                [safeName]: true,
            }));
            await refreshSessions();
            await setWorkflowId(safeName);
            setOutputMode('checklist');
            const hydrated = await hydrateSession(safeName, safePassphrase);
            if (!hydrated.ok && !hydrated.stale) {
                return hydrated;
            }

            const digest = JSON.stringify(payload);
            lastSavedDigestRef.current.set(safeName, digest);
            setSaveStatus({
                state: 'saved',
                detail: `Session "${safeName}" created.`,
                at: Date.now(),
            });

            return { ok: true, name: safeName };
        } catch (err) {
            const message = err && err.message ? err.message : 'Failed to create session.';
            setSaveStatus({
                state: 'error',
                detail: message,
                at: Date.now(),
            });
            return { ok: false, error: message };
        }
    }, [buildSessionPayload, hydrateSession, refreshSessions, setWorkflowId]);

    const unlockSession = useCallback(async (sessionName, passphrase) => {
        const safeName = normalizeSessionName(sessionName);
        const safePassphrase = String(passphrase || '').trim();
        if (!safeName) {
            return { ok: false, error: 'Session name is required.' };
        }
        if (!safePassphrase) {
            return { ok: false, error: 'Passphrase is required.' };
        }

        const result = await hydrateSession(safeName, safePassphrase);
        if (!result.ok) {
            return result;
        }

        sessionPassphrasesRef.current[safeName] = safePassphrase;
        setUnlockedSessions((prev) => ({
            ...prev,
            [safeName]: true,
        }));
        setWorkflowId(safeName);
        setSaveStatus({
            state: 'idle',
            detail: `Unlocked "${safeName}".`,
            at: Date.now(),
        });
        return { ok: true };
    }, [hydrateSession, setWorkflowId]);

    const selectSession = useCallback((sessionName) => {
        const safeName = normalizeSessionName(sessionName);
        if (!safeName) return;
        setWorkflowId(safeName);
    }, [setWorkflowId]);

    const lockSession = useCallback((sessionName) => {
        const safeName = normalizeSessionName(sessionName || workflowId);
        if (!safeName || safeName === DEFAULT_WORKFLOW || safeName === QUICKSTART_SESSION) {
            return { ok: false, error: 'No lockable session is selected.' };
        }

        const hasPassphrase = Boolean(sessionPassphrasesRef.current[safeName]);
        delete sessionPassphrasesRef.current[safeName];
        setUnlockedSessions((prev) => {
            if (!prev[safeName]) return prev;
            const next = { ...prev };
            delete next[safeName];
            return next;
        });

        if (normalizeSessionName(workflowId) === safeName) {
            setSessionHydrationStatus('locked');
            setSessionError(`Session "${safeName}" is locked. Enter passphrase to load it.`);
            clearSessionRuntimeState();
        }

        setSaveStatus({
            state: 'locked',
            detail: hasPassphrase
                ? `Locked "${safeName}".`
                : `Session "${safeName}" was already locked.`,
            at: Date.now(),
        });
        return { ok: true };
    }, [workflowId, clearSessionRuntimeState]);

    const saveActiveSession = useCallback(async (reason = 'manual') => {
        const activeSession = normalizeSessionName(workflowId);
        if (!activeSession || activeSession === DEFAULT_WORKFLOW || activeSession === QUICKSTART_SESSION) {
            return { ok: false, error: 'No persisted session selected.' };
        }

        const passphrase = sessionPassphrasesRef.current[activeSession];
        if (!passphrase) {
            setSessionHydrationStatus('locked');
            setSessionError(`Session "${activeSession}" is locked. Enter passphrase to save.`);
            setSaveStatus({
                state: 'locked',
                detail: `Session "${activeSession}" is locked. Unlock to save.`,
                at: Date.now(),
            });
            return { ok: false, error: 'Session is locked.' };
        }

        const reasonLabel = reason === 'autosave'
            ? 'Autosaving'
            : reason === 'retry'
                ? 'Retrying save for'
                : reason === 'flush'
                    ? 'Flushing'
                    : 'Saving';
        setSaveStatus({
            state: 'saving',
            detail: `${reasonLabel} "${activeSession}"...`,
            at: Date.now(),
        });

        const payload = buildSessionPayload(activeSession);
        const digest = JSON.stringify(payload);

        try {
            await window.api.session.save(activeSession, payload, passphrase);
            lastSavedDigestRef.current.set(activeSession, digest);
            setSaveStatus({
                state: 'saved',
                detail: reason === 'autosave'
                    ? `Autosaved "${activeSession}".`
                    : reason === 'flush'
                        ? `Flushed "${activeSession}".`
                    : `Saved "${activeSession}".`,
                at: Date.now(),
            });
            return { ok: true };
        } catch (err) {
            const message = err && err.message ? err.message : 'Save failed.';
            setSaveStatus({
                state: 'error',
                detail: message,
                at: Date.now(),
            });
            return { ok: false, error: message };
        }
    }, [workflowId, buildSessionPayload]);

    const flushPendingAutosave = useCallback(async () => {
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
            autosaveTimerRef.current = null;
        }
        await saveActiveSession('flush');
    }, [saveActiveSession]);

    // Load current session index once on boot.
    useEffect(() => {
        refreshSessions().catch((err) => {
            setSessionError(err && err.message ? err.message : 'Failed to load session index.');
        });
    }, [refreshSessions]);

    // Keep selected workflow aligned with the session index.
    useEffect(() => {
        if (!sessions.length) return;
        const active = normalizeSessionName(workflowId);
        if (!active || active === DEFAULT_WORKFLOW) {
            setWorkflowId(sessions[0]);
            return;
        }
        if (!sessions.includes(active)) {
            setWorkflowId(sessions[0]);
        }
    }, [sessions, workflowId, setWorkflowId]);

    // Hydrate whenever the active workflow changes and we have an unlock key.
    useEffect(() => {
        const active = normalizeSessionName(workflowId);
        if (!active || active === DEFAULT_WORKFLOW || active === QUICKSTART_SESSION) {
            setSessionHydrationStatus('ready');
            setSessionError('');
            if (active === QUICKSTART_SESSION || active === DEFAULT_WORKFLOW) {
                clearSessionRuntimeState();
            }
            return;
        }

        const passphrase = sessionPassphrasesRef.current[active];
        if (!passphrase) {
            setSessionHydrationStatus('locked');
            setSessionError(`Session "${active}" is locked. Enter passphrase to load it.`);
            clearSessionRuntimeState();
            return;
        }

        hydrateSession(active, passphrase);
    }, [workflowId, hydrateSession, clearSessionRuntimeState]);

    // Debounced autosave with write dedupe and failure status.
    useEffect(() => {
        const active = normalizeSessionName(workflowId);
        if (!active || active === DEFAULT_WORKFLOW || active === QUICKSTART_SESSION) {
            return undefined;
        }
        if (sessionHydrationStatus !== 'ready') {
            return undefined;
        }

        const passphrase = sessionPassphrasesRef.current[active];
        if (!passphrase) {
            return undefined;
        }

        const payload = buildSessionPayload(active);
        const digest = JSON.stringify(payload);
        const lastDigest = lastSavedDigestRef.current.get(active);
        if (lastDigest === digest) {
            return undefined;
        }

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(() => {
            saveActiveSession('autosave').catch(() => {});
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
                autosaveTimerRef.current = null;
            }
        };
    }, [
        workflowId,
        chatLog,
        model,
        outputMode,
        workspaceAttachment,
        buildSessionPayload,
        saveActiveSession,
        sessionHydrationStatus,
    ]);

    useEffect(() => {
        const flushOnPageHide = () => {
            flushPendingAutosave().catch(() => {});
        };

        const flushOnVisibilityHidden = () => {
            if (document.visibilityState !== 'hidden') return;
            flushPendingAutosave().catch(() => {});
        };

        window.addEventListener('beforeunload', flushOnPageHide);
        window.addEventListener('pagehide', flushOnPageHide);
        document.addEventListener('visibilitychange', flushOnVisibilityHidden);

        return () => {
            window.removeEventListener('beforeunload', flushOnPageHide);
            window.removeEventListener('pagehide', flushOnPageHide);
            document.removeEventListener('visibilitychange', flushOnVisibilityHidden);
        };
    }, [flushPendingAutosave]);

    useEffect(() => {
        if (!autoLockOnBlur) return undefined;
        const lockOnBlur = () => {
            lockSession(workflowId);
        };
        window.addEventListener('blur', lockOnBlur);
        return () => {
            window.removeEventListener('blur', lockOnBlur);
        };
    }, [autoLockOnBlur, lockSession, workflowId]);

    // System Telemetry Polling
    useEffect(() => {
        const interval = setInterval(async () => {
            if (window.api?.system?.getStats) {
                try {
                    const data = await window.api.system.getStats();
                    setStats(data);
                } catch {
                    // Keep prior stats on transient IPC failures.
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const openPalette = useCallback(() => setShowPalette(true), []);
    const closePalette = useCallback(() => setShowPalette(false), []);
    const togglePalette = useCallback(() => setShowPalette((prev) => !prev), []);
    const openSettings = useCallback(() => setShowSettings(true), []);
    const closeSettings = useCallback(() => setShowSettings(false), []);

    const appendChat = useCallback((entry) => {
        setChatLog((prev) => [...prev, entry]);
    }, []);

    const value = {
        // Domain
        model,
        setModel,
        workflowId,
        setWorkflowId,
        outputMode,
        setOutputMode,
        workspaceAttachment,
        setWorkspaceAttachment,
        xpState,
        sessions,
        chatLog,
        appendChat,
        setChatLog,
        unlockedSessions,
        createSession,
        unlockSession,
        selectSession,
        lockSession,
        saveActiveSession,
        flushPendingAutosave,
        refreshSessions,
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
        openPalette,
        closePalette,
        togglePalette,
        showSettings,
        openSettings,
        closeSettings,
    };

    return (
        <ShellContext.Provider value={value}>
            {children}
        </ShellContext.Provider>
    );
}

export function useShell() {
    const ctx = useContext(ShellContext);
    if (!ctx) throw new Error('useShell must be used within ShellProvider');
    return ctx;
}

export default ShellContext;
