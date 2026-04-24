import React from 'react';
import slashManifest from '../config/slash_manifest.json';
import quickStartsManifest from '../config/quickstarts.json';
import { useSlash } from '../hooks/useSlash.ts';
import { useThreads } from '../hooks/useThreads.ts';
import { buildShareUrl, createShareEnvelope } from '../utils/share.ts';
import AssistantMessage from './AssistantMessage';
import DiffModal from './DiffModal';
import ProofChipRow from './ProofChipRow';
import QuickStarts from './QuickStarts';
import SlashPalette from './SlashPalette';
import StreamingBar from './StreamingBar';
import ThreadDrawer from './ThreadDrawer';
import ProvGraph from './ProvGraph';
import VoicePanel from './VoicePanel';

const AUDIT_ALLOWED_COMMANDS = new Set(['/help', '/proof', '/roi', '/status', '/workflows', '/guard', '/clear']);

const _IMAGE_EXTS = new Set(['png','jpg','jpeg','gif','bmp','webp','svg','ico','tiff','heic','avif']);
const _CODE_EXTS = new Set(['js','ts','jsx','tsx','py','rs','go','java','c','cpp','h','hpp','cs','rb','php','swift','kt','scala','lua','r','m','mm','zig','asm','v','vhdl','dart','ex','exs','erl','hs','ml','fs','clj']);
const _CONFIG_EXTS = new Set(['json','yaml','yml','toml','ini','env','cfg','conf','xml','plist','properties']);
const _DOC_EXTS = new Set(['pdf','doc','docx','odt','rtf','epub']);
const _SHEET_EXTS = new Set(['csv','xlsx','xls','ods','tsv']);
const _ARCHIVE_EXTS = new Set(['zip','tar','gz','bz2','7z','rar','xz','zst']);
const _STYLE_EXTS = new Set(['css','scss','sass','less','styl']);
const _MARKUP_EXTS = new Set(['html','htm','md','mdx','tex','rst','adoc','txt']);
const _SCRIPT_EXTS = new Set(['sh','bat','ps1','zsh','fish']);

function smartCategorizeFile(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    if (_IMAGE_EXTS.has(ext)) return { type: 'image', subtype: ext, icon: '🖼️', color: 'pink' };
    if (_CODE_EXTS.has(ext)) return { type: 'code', subtype: ext, icon: '💻', color: 'emerald' };
    if (_STYLE_EXTS.has(ext)) return { type: 'style', subtype: ext, icon: '🎨', color: 'purple' };
    if (_CONFIG_EXTS.has(ext)) return { type: 'config', subtype: ext, icon: '⚙️', color: 'amber' };
    if (_DOC_EXTS.has(ext)) return { type: 'document', subtype: ext, icon: '📄', color: 'sky' };
    if (_SHEET_EXTS.has(ext)) return { type: 'spreadsheet', subtype: ext, icon: '📊', color: 'teal' };
    if (_ARCHIVE_EXTS.has(ext)) return { type: 'archive', subtype: ext, icon: '📦', color: 'orange' };
    if (_MARKUP_EXTS.has(ext)) return { type: 'text', subtype: ext, icon: '📝', color: 'violet' };
    if (_SCRIPT_EXTS.has(ext)) return { type: 'script', subtype: ext, icon: '🔧', color: 'yellow' };
    return { type: 'file', subtype: ext || '?', icon: '📎', color: 'slate' };
}

const CHIP_COLOR_MAP = {
    pink:    { border: 'border-pink-400/20',    bg: 'bg-pink-500/[0.04]',    text: 'text-pink-200',    badge: 'bg-pink-500/15 text-pink-300' },
    emerald: { border: 'border-emerald-400/20', bg: 'bg-emerald-500/[0.04]', text: 'text-emerald-200', badge: 'bg-emerald-500/15 text-emerald-300' },
    purple:  { border: 'border-purple-400/20',  bg: 'bg-purple-500/[0.04]',  text: 'text-purple-200',  badge: 'bg-purple-500/15 text-purple-300' },
    amber:   { border: 'border-amber-400/20',   bg: 'bg-amber-500/[0.04]',   text: 'text-amber-200',   badge: 'bg-amber-500/15 text-amber-300' },
    sky:     { border: 'border-sky-400/20',     bg: 'bg-sky-500/[0.04]',     text: 'text-sky-200',     badge: 'bg-sky-500/15 text-sky-300' },
    teal:    { border: 'border-teal-400/20',    bg: 'bg-teal-500/[0.04]',    text: 'text-teal-200',    badge: 'bg-teal-500/15 text-teal-300' },
    orange:  { border: 'border-orange-400/20',  bg: 'bg-orange-500/[0.04]',  text: 'text-orange-200',  badge: 'bg-orange-500/15 text-orange-300' },
    violet:  { border: 'border-violet-400/20',  bg: 'bg-violet-500/[0.04]',  text: 'text-violet-200',  badge: 'bg-violet-500/15 text-violet-300' },
    yellow:  { border: 'border-yellow-400/20',  bg: 'bg-yellow-500/[0.04]',  text: 'text-yellow-200',  badge: 'bg-yellow-500/15 text-yellow-300' },
    slate:   { border: 'border-slate-400/20',   bg: 'bg-slate-500/[0.04]',   text: 'text-slate-200',   badge: 'bg-slate-500/15 text-slate-300' },
};
const QUICKSTART_DISMISSED_STORAGE_KEY = 'neuralshell_quickstarts_dismissed_v1';
const QUICKSTART_SEEN_STORAGE_KEY = 'hasSeenQuickStarts';

function readDismissedQuickStarts() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(QUICKSTART_DISMISSED_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((value) => String(value || '').trim()).filter(Boolean);
    } catch {
        return [];
    }
}

function writeDismissedQuickStarts(ids) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(
            QUICKSTART_DISMISSED_STORAGE_KEY,
            JSON.stringify((Array.isArray(ids) ? ids : []).map((value) => String(value || '').trim()).filter(Boolean)),
        );
    } catch {
        // best effort
    }
}

export function WorkspacePanel({
    chatLog,
    workflowId,
    prompt,
    setPrompt,
    onSend,
    onExecute,
    auditOnly,
    isThinking,
    onRegenerate,
    hasRegenerate,
    connectionInfo,
    sessionHydrationStatus,
    onOfflineKill,
    onUpgradeToPro,
    collab,
}) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");
    const normalizedPrompt = String(prompt || '').trim().toLowerCase();
    const canRunPrompt = !auditOnly || AUDIT_ALLOWED_COMMANDS.has(normalizedPrompt);
    const [toast, setToast] = React.useState('');
    const [proofFlowState, setProofFlowState] = React.useState({
        lockSeen: false,
        unlockedRestored: false,
    });
    const [diffModalState, setDiffModalState] = React.useState({
        open: false,
        beforeText: '',
        afterText: '',
    });
    const [showProvGraph, setShowProvGraph] = React.useState(false);
    const [streamingBarEnabled, setStreamingBarEnabled] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return true;
        const value = window.localStorage.getItem('neuralshell_streaming_bar_enabled');
        if (value == null) return true;
        return value !== '0';
    });
    const [dismissedQuickStartIds, setDismissedQuickStartIds] = React.useState(() => readDismissedQuickStarts());
    const [attachments, setAttachments] = React.useState([]);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const composerRef = React.useRef(null);
    const toastTimerRef = React.useRef(null);
    const seenRemoteEventsRef = React.useRef(new Set());
    const cursorTickRef = React.useRef(0);
    const panelRef = React.useRef(null);

    const showToast = React.useCallback((value) => {
        setToast(String(value || '').trim());
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToast('');
        }, 1100);
    }, []);

    const slash = useSlash(slashManifest, (item) => {
        const template = String(item && item.template ? item.template : '');
        setPrompt(template);
        window.requestAnimationFrame(() => {
            if (composerRef.current) {
                composerRef.current.focus();
                const len = template.length;
                if (typeof composerRef.current.setSelectionRange === 'function') {
                    composerRef.current.setSelectionRange(len, len);
                }
            }
        });
    });
    const threads = useThreads(String(workflowId || 'default'));

    React.useEffect(() => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem('neuralshell_streaming_bar_enabled', streamingBarEnabled ? '1' : '0');
    }, [streamingBarEnabled]);

    React.useEffect(() => {
        writeDismissedQuickStarts(dismissedQuickStartIds);
        if (
            Array.isArray(quickStartsManifest)
            && dismissedQuickStartIds.length >= quickStartsManifest.length
            && typeof window !== 'undefined'
            && window.localStorage
        ) {
            window.localStorage.setItem(QUICKSTART_SEEN_STORAGE_KEY, '1');
        }
    }, [dismissedQuickStartIds]);

    React.useEffect(() => {
        setProofFlowState({
            lockSeen: false,
            unlockedRestored: false,
        });
    }, [workflowId]);

    React.useEffect(() => {
        setProofFlowState((prev) => {
            if (sessionHydrationStatus === 'locked' && !prev.lockSeen) {
                return { ...prev, lockSeen: true };
            }
            if (sessionHydrationStatus === 'ready' && prev.lockSeen && !prev.unlockedRestored) {
                return { ...prev, unlockedRestored: true };
            }
            return prev;
        });
    }, [sessionHydrationStatus]);

    React.useEffect(() => {
        if (!composerRef.current) return;
        const active = document.activeElement;
        if (!active || active === document.body) {
            composerRef.current.focus();
        }
    }, [workflowId]);

    React.useEffect(() => {
        const node = panelRef.current;
        if (!node || !(collab && typeof collab.publish === 'function')) return undefined;
        const onMouseMove = (event) => {
            const now = Date.now();
            if (now - cursorTickRef.current < 80) return;
            cursorTickRef.current = now;
            collab.publish('cursor', {
                x: Number(event.clientX || 0),
                y: Number(event.clientY || 0),
            });
        };
        node.addEventListener('mousemove', onMouseMove);
        return () => {
            node.removeEventListener('mousemove', onMouseMove);
        };
    }, [collab]);

    React.useEffect(() => {
        const eventPayload = collab && collab.lastEvent ? collab.lastEvent : null;
        if (!eventPayload) return;
        if (String(eventPayload.eventType || '') !== 'thread-reply') return;
        const payload = eventPayload.payload && typeof eventPayload.payload === 'object' ? eventPayload.payload : {};
        const eventId = String(payload.replyId || `${eventPayload.fromPeerId}:${payload.threadId}:${payload.content}`);
        if (!eventId) return;
        if (seenRemoteEventsRef.current.has(eventId)) return;
        seenRemoteEventsRef.current.add(eventId);
        const threadId = String(payload.threadId || '').trim();
        const content = String(payload.content || '').trim();
        if (!threadId || !content) return;
        threads.addReply(threadId, content);
    }, [collab && collab.lastEvent, threads]);

    React.useEffect(() => {
        const focusComposer = () => {
            if (composerRef.current && typeof composerRef.current.focus === 'function') {
                composerRef.current.focus();
            }
        };
        window.addEventListener('neuralshell:focus-composer', focusComposer);
        return () => {
            window.removeEventListener('neuralshell:focus-composer', focusComposer);
        };
    }, []);

    React.useEffect(() => {
        const draft = String(prompt || '');
        const startsSlash = draft.startsWith('/');
        if (!startsSlash) {
            if (slash.open) slash.closePalette();
            return;
        }
        const query = draft.slice(1);
        if (query.includes(' ')) {
            if (slash.open) slash.closePalette();
            return;
        }
        if (!slash.open) {
            slash.openPalette(query);
            return;
        }
        slash.setQuery(query);
    }, [prompt, slash.open, slash.closePalette, slash.openPalette, slash.setQuery]);

    const messageText = chatLog.map((msg) => String(msg && msg.content ? msg.content : '')).join('\n');
    const hasProofOutput = /90-Second Value Proof/i.test(messageText);
    const hasRoiOutput = /NeuralShell ROI Snapshot/i.test(messageText);
    const providerLabel = String((connectionInfo && connectionInfo.provider) || 'ollama').toUpperCase();
    const connectionHealth = String((connectionInfo && connectionInfo.health) || 'unknown');
    const modelLabel = String((connectionInfo && connectionInfo.model) || 'llama3');
    const allowRemoteBridge = Boolean(connectionInfo && connectionInfo.allowRemoteBridge);

    const shareAssistantMessage = React.useCallback(async (content) => {
        try {
            const payload = {
                app: 'NeuralShell',
                generatedAt: new Date().toISOString(),
                workflowId: String(workflowId || ''),
                messages: [
                    {
                        role: 'assistant',
                        content: String(content || ''),
                    },
                ],
            };
            const encoded = await createShareEnvelope(payload);
            const url = buildShareUrl(encoded.hash, encoded.fragment);
            await navigator.clipboard.writeText(url);
            showToast('Copied share link');
        } catch {
            showToast('Share failed');
        }
    }, [showToast, workflowId]);

    const rememberCommand = React.useCallback((value) => {
        if (slash && typeof slash.rememberCommand === 'function') {
            slash.rememberCommand(String(value || ''));
        }
    }, [slash]);

    const runCommand = React.useCallback((value) => {
        const command = String(value || '').trim();
        if (!command) return;
        rememberCommand(command);
        if (typeof onExecute === 'function') {
            onExecute(command);
        }
    }, [onExecute, rememberCommand]);

    const runSend = React.useCallback(() => {
        const current = String(prompt || '').trim();
        if (!current || !canRunPrompt) return;
        rememberCommand(current);
        onSend();
        setAttachments([]);
    }, [canRunPrompt, onSend, prompt, rememberCommand]);

    const addSmartAttachments = React.useCallback((newFiles) => {
        if (!Array.isArray(newFiles) || !newFiles.length) return;
        setAttachments((prev) => {
            const existingPaths = new Set(prev.map((f) => f.path));
            const deduped = newFiles.filter((f) => f && f.path && !existingPaths.has(f.path));
            const enriched = deduped.map((f) => {
                const cat = f.type === 'folder'
                    ? { type: 'folder', subtype: 'dir', icon: '📁', color: 'amber' }
                    : smartCategorizeFile(f.name);
                const isLarge = f.size > 10 * 1024 * 1024;
                return { ...f, ...cat, isLarge, addedAt: Date.now() };
            });
            if (!enriched.length) return prev;
            return [...prev, ...enriched];
        });
    }, []);

    const handleDragOver = React.useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    }, [isDragOver]);

    const handleDragLeave = React.useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = React.useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (auditOnly) return;
        const droppedFiles = [];
        if (e.dataTransfer && e.dataTransfer.files) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const file = e.dataTransfer.files[i];
                droppedFiles.push({
                    path: file.path || file.name,
                    name: file.name,
                    size: file.size || 0,
                    type: file.type && file.type.startsWith('image/') ? 'image' : 'document',
                });
            }
        }
        addSmartAttachments(droppedFiles);
    }, [auditOnly, addSmartAttachments]);

    const handleComposerPaste = React.useCallback((e) => {
        if (auditOnly) return;
        const clipboardData = e.clipboardData;
        if (!clipboardData || !clipboardData.files || !clipboardData.files.length) return;
        e.preventDefault();
        const pastedFiles = [];
        for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            pastedFiles.push({
                path: file.path || `clipboard-${Date.now()}-${i}.${file.type ? file.type.split('/').pop() : 'bin'}`,
                name: file.name || `Pasted ${file.type && file.type.startsWith('image/') ? 'Image' : 'File'}`,
                size: file.size || 0,
                type: file.type && file.type.startsWith('image/') ? 'image' : 'document',
            });
        }
        addSmartAttachments(pastedFiles);
    }, [auditOnly, addSmartAttachments]);

    const openDiffModal = React.useCallback((beforeText, afterText) => {
        setDiffModalState({
            open: true,
            beforeText: String(beforeText || ''),
            afterText: String(afterText || ''),
        });
    }, []);

    const closeDiffModal = React.useCallback(() => {
        setDiffModalState({
            open: false,
            beforeText: '',
            afterText: '',
        });
    }, []);

    const quickStartVisibleIds = React.useMemo(() => {
        const seenAll = typeof window !== 'undefined'
            && window.localStorage
            && window.localStorage.getItem(QUICKSTART_SEEN_STORAGE_KEY) === '1';
        if (seenAll) return [];
        return (Array.isArray(quickStartsManifest) ? quickStartsManifest : [])
            .map((item) => String(item && item.id ? item.id : ''))
            .filter((id) => id && !dismissedQuickStartIds.includes(id));
    }, [dismissedQuickStartIds]);

    const onSelectQuickStart = React.useCallback((item) => {
        const command = String(item && item.prompt ? item.prompt : '').trim();
        if (!command) return;
        setPrompt(command);
        rememberCommand(command);
        window.requestAnimationFrame(() => {
            if (composerRef.current && typeof composerRef.current.focus === 'function') {
                composerRef.current.focus();
            }
        });
    }, [rememberCommand, setPrompt]);

    const onDismissQuickStart = React.useCallback((id) => {
        const safeId = String(id || '').trim();
        if (!safeId) return;
        setDismissedQuickStartIds((prev) => {
            if (prev.includes(safeId)) return prev;
            return [...prev, safeId];
        });
    }, []);

    const useThreadContext = React.useCallback((threadId) => {
        const record = threads.threads[String(threadId || '').trim()];
        if (!record) return;
        const threadLines = [
            `[Thread ${record.id}]`,
            `Root: ${String(record.rootContent || '').trim()}`,
            ...(Array.isArray(record.replies) ? record.replies.map((reply, index) => `Reply ${index + 1}: ${String(reply.content || '').trim()}`) : []),
        ];
        const snippet = threadLines.filter(Boolean).join('\n');
        setPrompt((current) => `${snippet}\n\n${String(current || '')}`.trim());
        window.requestAnimationFrame(() => {
            if (composerRef.current && typeof composerRef.current.focus === 'function') {
                composerRef.current.focus();
            }
        });
    }, [setPrompt, threads.threads]);

    const flowSteps = [
        { id: 'proof', label: 'Proof', done: hasProofOutput },
        { id: 'roi', label: 'ROI', done: hasRoiOutput },
        { id: 'lock', label: 'Lock', done: proofFlowState.lockSeen },
        { id: 'restore', label: 'Restore', done: proofFlowState.unlockedRestored },
    ];

    return (
        <main ref={panelRef} data-testid="workspace-panel" className="flex-1 flex flex-col relative bg-slate-950/40 overflow-hidden" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.03) 0%, transparent 60%)' }}>
            {/* Narrative Discovery Banner (Stabilized) */}
            <div className="px-6 py-2.5 border-b border-violet-500/10 bg-shell-soft/40 flex items-center justify-between backdrop-blur-sm z-10 transition-all" style={{ borderImage: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(217,70,239,0.15), rgba(6,182,212,0.1)) 1' }}>
                <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full animate-breathe ${chatLog.length > 0 ? 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`} />
                    <div className="text-[11px] font-mono tracking-wide">
                        <span className="text-violet-400">status</span><span className="text-slate-500">:</span>{' '}
                        <span className={chatLog.length > 0 ? 'text-orange-300' : 'text-green-300'}>
                            {chatLog.length > 0 ? '"analyzing"' : '"ready"'}
                        </span>
                    </div>
                </div>
                <div className="px-2 py-0.5 rounded border border-green-400/15 bg-green-500/5 text-[9px] font-mono text-green-400/70">
                    sealed: <span className="text-sky-300">true</span>
                </div>
            </div>

            <div className="px-6 py-2 border-b border-violet-500/8 bg-shell-mid/30 flex flex-wrap items-center justify-between gap-2">
                <ProofChipRow steps={flowSteps} />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="open-prov-graph-btn"
                        onClick={() => setShowProvGraph(true)}
                        className="px-2 py-1 rounded border border-teal-400/25 bg-teal-500/8 text-[10px] font-mono text-teal-300 hover:bg-teal-500/15"
                    >
                        Provenance
                    </button>
                    <div className={cn(
                        'px-2.5 py-1 rounded-md text-[8px] font-mono uppercase tracking-[0.14em] border',
                        connectionHealth === 'online'
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : connectionHealth === 'offline'
                                ? 'border-rose-300/30 bg-rose-500/10 text-rose-200'
                                : 'border-slate-400/20 bg-slate-500/10 text-slate-300',
                    )}
                    >
                        {providerLabel} · {modelLabel} · {connectionHealth === 'online' ? 'Connected' : connectionHealth === 'offline' ? 'Unavailable' : 'Unknown'}
                    </div>
                </div>
            </div>
            <div className="px-6 py-2 border-b border-white/[0.03] bg-black/20">
                <VoicePanel collab={collab} />
            </div>

            {/* Primary Chat Lane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
                {chatLog.length === 0 ? (
                    <div className="h-full flex flex-col justify-center select-none max-w-2xl mx-auto animate-in fade-in duration-700 pb-10">
                        <QuickStarts
                            items={quickStartsManifest}
                            visibleIds={quickStartVisibleIds}
                            onSelect={onSelectQuickStart}
                            onDismiss={onDismissQuickStart}
                        />
                        {workflowId === 'NeuralShell_QuickStart' ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-1">
                                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-cyan-400">Welcome, Operator</h1>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/20 text-[9px] text-emerald-400 font-mono tracking-widest font-bold">NODE_READY</span>
                                </div>
                                <p className="text-[14px] text-slate-300 font-mono leading-relaxed">
                                    NeuralShell is designed to sell itself through live proof. In under two minutes, you can verify trust posture, demonstrate guardrails, and show clear operator ROI without leaving this console.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-300">Local-Only By Default</div>
                                        <div className="text-[12px] text-slate-300 font-mono mt-1 leading-relaxed">No remote bridge is used unless explicitly enabled.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-300">Session Vault</div>
                                        <div className="text-[12px] text-slate-300 font-mono mt-1 leading-relaxed">Save, lock, and restore workflows with passphrase control.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-300">Guarded Apply</div>
                                        <div className="text-[12px] text-slate-300 font-mono mt-1 leading-relaxed">No workspace mutation happens without explicit operator action.</div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-cyan-400/20 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">1</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Run Live Value Proof</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Execute <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/proof</code> to surface trust, safety, and release evidence in one output.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">2</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Demonstrate Persistence</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Create a workflow in the left rail, run <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/guard</code>, then save + lock it.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[10px] font-bold">3</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Show Business Impact</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">Run <code className="text-cyan-400/80 bg-cyan-400/5 px-1">/roi</code> to produce a fast operator-value snapshot for decision makers.</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                                        Start Here
                                    </div>
                                    <button
                                        data-testid="quickstart-proof-btn"
                                        onClick={() => runCommand('/proof')}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300/40 bg-cyan-400/15 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-400/25 transition-all"
                                    >
                                        Run 90s Proof
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            data-testid="quickstart-roi-btn"
                                            onClick={() => runCommand('/roi')}
                                            className="px-4 py-3 rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-400/20 transition-all"
                                        >
                                            Show ROI Snapshot
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSelectQuickStart({ prompt: '/guard' })}
                                            className="px-4 py-3 rounded-xl border border-amber-300/30 bg-amber-400/10 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200 hover:bg-amber-400/20 transition-all"
                                        >
                                            Prep Lock Flow
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    Your data remains local. No signals are broadcasted without explicit operator authorization.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-xl font-black uppercase tracking-[0.2em]"><span className="text-violet-300">Neural</span><span className="text-sky-300">Shell</span></h1>
                                    <span className="px-2 py-0.5 rounded bg-green-500/8 border border-green-400/20 text-[10px] text-green-400 font-mono tracking-widest font-bold">OPERATIONAL</span>
                                </div>
                                <p className="text-[12px] text-slate-400 mb-10 font-mono leading-relaxed max-w-xl">
                                    This workspace is tuned for product-led conversion: prove trust, prove reliability, then prove ROI in the same flow.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                    <div className="p-3 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.1em] text-fuchsia-300">Proof</div>
                                        <div className="text-[12px] font-mono text-slate-300 mt-1 leading-relaxed">Run <code className="text-fuchsia-300 bg-fuchsia-500/10 px-1 rounded">/proof</code> to show security + release credibility.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-blue-400/20 bg-blue-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-300">Persistence</div>
                                        <div className="text-[12px] font-mono text-slate-300 mt-1 leading-relaxed">Demonstrate save, lock, and restore in one workflow loop.</div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-yellow-400/20 bg-yellow-500/[0.04]">
                                        <div className="text-[11px] font-black uppercase tracking-[0.1em] text-yellow-300">ROI</div>
                                        <div className="text-[12px] font-mono text-slate-300 mt-1 leading-relaxed">Run <code className="text-yellow-300 bg-yellow-500/10 px-1 rounded">/roi</code> for a fast operator value estimate.</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8" style={{ perspective: '800px' }}>
                                    {/* Card 1: Resume / Artifact */}
                                    <button data-testid="card-resume" onClick={() => runCommand('/resume')} className="group flex flex-col text-left p-5 rounded-2xl bg-orange-500/[0.02] hover:bg-orange-500/[0.06] border border-orange-400/10 hover:border-orange-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(251,146,60,0.06)] animate-fade-up-1 alive-hover">
                                        <div className="text-orange-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-orange-200 uppercase tracking-widest mb-1.5">Resume Previous Workflow</span>
                                        <span className="text-[12px] text-slate-400 font-mono leading-relaxed">Reload the most recent active console state into memory.</span>
                                    </button>

                                    {/* Card 2: Load Repo */}
                                    <button data-testid="card-context" onClick={() => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) }} className="group flex flex-col text-left p-5 rounded-2xl bg-sky-500/[0.02] hover:bg-sky-500/[0.06] border border-sky-400/10 hover:border-sky-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(56,189,248,0.06)] animate-fade-up-2 alive-hover">
                                        <div className="text-sky-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-sky-200 uppercase tracking-widest mb-1.5">Analyze Repository</span>
                                        <span className="text-[12px] text-slate-400 font-mono leading-relaxed">Mount a local directory for detailed heuristic analysis.</span>
                                    </button>

                                    {/* Card 3: Guard Rail Status */}
                                    <button data-testid="card-guard" onClick={() => runCommand('/guard')} className="group flex flex-col text-left p-5 rounded-2xl bg-rose-500/[0.02] hover:bg-rose-500/[0.06] border border-rose-400/10 hover:border-rose-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(251,113,133,0.06)] animate-fade-up-3 alive-hover">
                                        <div className="text-rose-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-rose-200 uppercase tracking-widest mb-1.5">Audit Integrity Guard</span>
                                        <span className="text-[12px] text-slate-400 font-mono leading-relaxed">Review current security guardrails and execution limits.</span>
                                    </button>

                                    {/* Card 4: Routines */}
                                    <button data-testid="card-help" onClick={() => runCommand('/help')} className="group flex flex-col text-left p-5 rounded-2xl bg-violet-500/[0.02] hover:bg-violet-500/[0.06] border border-violet-400/10 hover:border-violet-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(167,139,250,0.06)] animate-fade-up-4 alive-hover">
                                        <div className="text-violet-400 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-violet-200 uppercase tracking-widest mb-1.5">Available Protocols</span>
                                        <span className="text-[12px] text-slate-400 font-mono leading-relaxed">Display all installed automation protocols and custom aliases.</span>
                                    </button>

                                    <button data-testid="card-proof" onClick={() => runCommand('/proof')} className="group flex flex-col text-left p-5 rounded-2xl bg-fuchsia-500/[0.06] hover:bg-fuchsia-500/[0.12] border border-fuchsia-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(217,70,239,0.1)] animate-fade-up-1 alive-hover animate-glow-pulse">
                                        <div className="text-fuchsia-300 mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-fuchsia-100 uppercase tracking-widest mb-1.5">Run 90-Second Proof</span>
                                        <span className="text-[12px] text-fuchsia-100/70 font-mono leading-relaxed">Generate a concise trust + safety + release proof narrative live.</span>
                                    </button>

                                    <button data-testid="card-roi" onClick={() => runCommand('/roi')} className="group flex flex-col text-left p-5 rounded-2xl bg-teal-500/[0.06] hover:bg-teal-500/[0.12] border border-teal-400/30 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] animate-fade-up-2 alive-hover">
                                        <div className="text-teal-300 mb-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-teal-100 uppercase tracking-widest mb-1.5">Generate ROI Snapshot</span>
                                        <span className="text-[12px] text-teal-100/70 font-mono leading-relaxed">Turn technical proof into decision-ready business value language.</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (() => {
                    let previousAssistantContent = '';
                    return chatLog.map((msg, i) => {
                        if (msg.role === 'user') {
                            return (
                                <div data-testid="chat-message" key={i} className="max-w-[85%] 2xl:max-w-[75%] ml-auto animate-fade-up">
                                    <div className="flex items-center gap-3 mb-2.5 opacity-50 flex-row-reverse">
                                        <div className="h-px w-6 bg-orange-400" />
                                        <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-300/70">Operator</div>
                                    </div>
                                    <div className="p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300 bg-orange-500/[0.03] border border-orange-400/15 text-orange-50 shadow-orange-900/10 whitespace-pre-wrap hover:border-orange-400/25 hover:shadow-[0_0_20px_rgba(251,146,60,0.06)]">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        const currentContent = String(msg && msg.content ? msg.content : '');
                        const beforeText = previousAssistantContent;
                        const diffAvailable = Boolean(beforeText.trim());
                        previousAssistantContent = currentContent;
                        const messageId = String(msg && msg.id ? msg.id : `assistant-${i}`);

                        return (
                            <AssistantMessage
                                key={i}
                                messageId={messageId}
                                content={currentContent}
                                onToast={showToast}
                                onShare={shareAssistantMessage}
                                onStartThread={(targetMessageId, rootContent) => {
                                    threads.startThread(targetMessageId || messageId, rootContent || currentContent);
                                }}
                                providerId={String((connectionInfo && connectionInfo.provider) || 'ollama')}
                                modelId={String((connectionInfo && connectionInfo.model) || 'llama3')}
                                diffAvailable={diffAvailable}
                                onOpenDiff={() => openDiffModal(beforeText, currentContent)}
                                stdoutLines={Array.isArray(msg && msg.stdoutLines) ? msg.stdoutLines : []}
                                stdoutDone={Boolean(msg && msg.stdoutDone)}
                            />
                        );
                    });
                })()}
            </div>

            {/* Fixed Composer Bottom */}
            <footer className="p-6 border-t border-indigo-500/10 bg-shell-mid/60 backdrop-blur-xl" style={{ borderImage: 'linear-gradient(90deg, rgba(139,92,246,0.08), rgba(217,70,239,0.12), rgba(6,182,212,0.08)) 1' }}>
                <StreamingBar active={Boolean(isThinking)} enabled={streamingBarEnabled} />
                <div className="max-w-5xl mx-auto mb-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar opacity-40 hover:opacity-100 transition-opacity duration-300">
                    {[
                        { cmd: '/help', from: '#8b5cf6', to: '#06b6d4', hoverBg: 'rgba(139,92,246,0.08)', hoverBorder: 'rgba(139,92,246,0.3)' },
                        { cmd: '/proof', from: '#d946ef', to: '#f43f5e', hoverBg: 'rgba(217,70,239,0.08)', hoverBorder: 'rgba(217,70,239,0.3)' },
                        { cmd: '/roi', from: '#14b8a6', to: '#22d3ee', hoverBg: 'rgba(20,184,166,0.08)', hoverBorder: 'rgba(20,184,166,0.3)' },
                        { cmd: '/clear', from: '#ef4444', to: '#f97316', hoverBg: 'rgba(239,68,68,0.08)', hoverBorder: 'rgba(239,68,68,0.3)' },
                        { cmd: '/status', from: '#22c55e', to: '#14b8a6', hoverBg: 'rgba(34,197,94,0.08)', hoverBorder: 'rgba(34,197,94,0.3)' },
                        { cmd: '/workflows', from: '#0ea5e9', to: '#8b5cf6', hoverBg: 'rgba(14,165,233,0.08)', hoverBorder: 'rgba(14,165,233,0.3)' },
                        { cmd: '/guard', from: '#f43f5e', to: '#ec4899', hoverBg: 'rgba(244,63,94,0.08)', hoverBorder: 'rgba(244,63,94,0.3)' },
                        { cmd: '/omega', from: '#f59e0b', to: '#ef4444', hoverBg: 'rgba(245,158,11,0.08)', hoverBorder: 'rgba(245,158,11,0.3)' },
                    ].map(({ cmd, from, to, hoverBg, hoverBorder }) => (
                        <button
                            key={cmd}
                            onClick={() => setPrompt(cmd)}
                            disabled={auditOnly && !AUDIT_ALLOWED_COMMANDS.has(cmd)}
                            className={cn(
                                'group text-[10px] font-black px-3 py-1.5 bg-white/[0.02] rounded-lg border border-white/5 whitespace-nowrap uppercase tracking-[0.15em] transition-all duration-200 hover:scale-105 hover:shadow-lg',
                                auditOnly && !AUDIT_ALLOWED_COMMANDS.has(cmd) && 'opacity-30 cursor-not-allowed',
                            )}
                            style={{
                                '--pill-from': from,
                                '--pill-to': to,
                                '--pill-hover-bg': hoverBg,
                                '--pill-hover-border': hoverBorder,
                            }}
                            onMouseEnter={(e) => {
                                if (auditOnly && !AUDIT_ALLOWED_COMMANDS.has(cmd)) return;
                                e.currentTarget.style.backgroundColor = hoverBg;
                                e.currentTarget.style.borderColor = hoverBorder;
                                e.currentTarget.style.boxShadow = `0 0 16px ${hoverBg}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <span
                                style={{
                                    backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                {cmd}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="max-w-5xl mx-auto mb-2 flex flex-wrap items-center gap-2">
                    <div className={cn(
                        'px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em]',
                        allowRemoteBridge
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200',
                    )}
                    >
                        {allowRemoteBridge ? 'Hosted lanes enabled' : 'Local-only lane'}
                    </div>
                    {typeof onOfflineKill === 'function' && (
                        <button
                            type="button"
                            onClick={onOfflineKill}
                            disabled={auditOnly}
                            className={cn(
                                'px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em]',
                                auditOnly
                                    ? 'border-white/10 text-slate-600 cursor-not-allowed'
                                    : 'border-rose-300/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
                            )}
                        >
                            Offline Kill
                        </button>
                    )}
                    <button
                        type="button"
                        data-testid="streaming-toggle-btn"
                        onClick={() => setStreamingBarEnabled((prev) => !prev)}
                        className={cn(
                            'px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em]',
                            streamingBarEnabled
                                ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'
                                : 'border-slate-400/20 bg-slate-500/10 text-slate-300',
                        )}
                    >
                        Streaming {streamingBarEnabled ? 'On' : 'Off'}
                    </button>
                </div>
                {auditOnly && (
                    <div className="max-w-5xl mx-auto mb-2 flex flex-wrap items-center gap-2">
                        <div className="text-[10px] text-amber-300/80 font-mono">
                            Write actions disabled - upgrade to Pro.
                        </div>
                        <button
                            type="button"
                            data-testid="workspace-upgrade-pro-btn"
                            onClick={() => {
                                if (typeof onUpgradeToPro === 'function') {
                                    onUpgradeToPro();
                                }
                            }}
                            className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                )}
                {isThinking && (
                    <div className="max-w-5xl mx-auto mb-2 text-[10px] text-cyan-200/90 font-mono flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
                        <span className="animate-shimmer text-gradient" style={{ backgroundImage: 'linear-gradient(90deg, #67e8f9, #c084fc, #67e8f9)' }}>NeuralShell is thinking...</span>
                    </div>
                )}

                {/* Smart Attachment Bar */}
                <div className="max-w-5xl mx-auto mb-3 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mr-1">Add:</span>
                    {[
                        {
                            label: 'Image',
                            icon: (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            ),
                            gradient: { from: '#8b5cf6', to: '#ec4899' },
                            onClick: async () => {
                                if (!(window.api && window.api.attach)) return;
                                const files = await window.api.attach.pickImages().catch(() => []);
                                addSmartAttachments(files);
                            },
                        },
                        {
                            label: 'Document',
                            icon: (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            ),
                            gradient: { from: '#0ea5e9', to: '#8b5cf6' },
                            onClick: async () => {
                                if (!(window.api && window.api.attach)) return;
                                const files = await window.api.attach.pickDocuments().catch(() => []);
                                addSmartAttachments(files);
                            },
                        },
                        {
                            label: 'Folder',
                            icon: (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                            ),
                            gradient: { from: '#f59e0b', to: '#ef4444' },
                            onClick: async () => {
                                if (!(window.api && window.api.attach)) return;
                                const files = await window.api.attach.pickFolder().catch(() => []);
                                addSmartAttachments(files);
                            },
                        },
                    ].map(({ label, icon, gradient, onClick }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={onClick}
                            disabled={auditOnly}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md',
                                auditOnly ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                            )}
                            onMouseEnter={(e) => {
                                if (auditOnly) return;
                                e.currentTarget.style.borderColor = `${gradient.from}40`;
                                e.currentTarget.style.backgroundColor = `${gradient.from}10`;
                                e.currentTarget.style.boxShadow = `0 0 12px ${gradient.from}15`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.backgroundColor = '';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <span style={{ color: gradient.from }}>{icon}</span>
                            <span
                                style={{
                                    backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                {label}
                            </span>
                        </button>
                    ))}
                    <span className="text-[8px] text-slate-700 font-mono ml-1">or drag & drop · Ctrl+V</span>
                    {attachments.length > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300">
                                {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                            </span>
                            <button
                                type="button"
                                onClick={() => setAttachments([])}
                                className="text-[9px] font-mono text-slate-500 hover:text-red-300 transition-colors px-1.5 py-0.5"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Smart Attachment Chips */}
                {attachments.length > 0 && (
                    <div className="max-w-5xl mx-auto mb-3 flex flex-wrap gap-2">
                        {attachments.map((file, i) => {
                            const cfg = CHIP_COLOR_MAP[file.color] || CHIP_COLOR_MAP.slate;
                            const sizeLabel = file.size > 0
                                ? file.size > 1048576
                                    ? `${(file.size / 1048576).toFixed(1)}MB`
                                    : file.size > 1024
                                        ? `${Math.round(file.size / 1024)}KB`
                                        : `${file.size}B`
                                : '';
                            const isImage = file.type === 'image';
                            return (
                                <div
                                    key={`${file.path}-${i}`}
                                    className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-xl border ${cfg.border} ${cfg.bg} group transition-all hover:scale-[1.02] relative`}
                                    title={`${file.path}\nType: ${file.type} · ${file.subtype || ''}\n${sizeLabel}`}
                                >
                                    {isImage && file.path && !file.path.startsWith('clipboard-') ? (
                                        <div className="h-6 w-6 rounded overflow-hidden bg-black/20 flex-shrink-0">
                                            <img
                                                src={`file://${file.path.replace(/\\/g, '/')}`}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[12px] flex-shrink-0">{file.icon || '📎'}</span>
                                    )}
                                    <span className={`text-[10px] font-medium ${cfg.text} truncate max-w-[140px]`}>
                                        {file.name}
                                    </span>
                                    <span className={`text-[7px] font-mono px-1 py-0.5 rounded ${cfg.badge} uppercase`}>
                                        {file.subtype || file.type}
                                    </span>
                                    {sizeLabel && <span className="text-[8px] font-mono text-slate-500">{sizeLabel}</span>}
                                    {file.isLarge && (
                                        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-400/20" title="File larger than 10MB">
                                            ⚠ Large
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                                        className="ml-0.5 h-4 w-4 rounded-full bg-white/5 text-[9px] text-slate-600 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div
                    className={cn(
                        'relative group max-w-5xl mx-auto transition-all duration-200',
                        isDragOver && 'ring-2 ring-violet-400/40 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)]',
                    )}
                    data-testid="composer-input"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragOver && (
                        <div className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-violet-400/50 bg-violet-500/[0.06] flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-[24px] mb-1">📎</div>
                                <div className="text-[12px] font-semibold text-violet-300">Drop files here to attach</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">Images, documents, folders, code files</div>
                            </div>
                        </div>
                    )}
                    <SlashPalette
                        open={slash.open}
                        query={slash.query}
                        setQuery={(value) => {
                            slash.setQuery(value);
                            setPrompt(value ? `/${value}` : '/');
                        }}
                        items={slash.filtered}
                        history={slash.history}
                        selectedIndex={slash.selectedIndex}
                        onSelectIndex={slash.setSelectedIndex}
                        onPick={slash.pick}
                        onClose={slash.closePalette}
                        onKeyDown={slash.handleKeyDown}
                    />
                    <textarea
                        ref={composerRef}
                        data-testid="chat-input"
                        value={prompt}
                        onChange={(event) => {
                            if (slash && typeof slash.resetHistoryCursor === 'function') {
                                slash.resetHistoryCursor();
                            }
                            setPrompt(event.target.value);
                        }}
                        onPaste={handleComposerPaste}
                        onKeyDown={(event) => {
                            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                                event.preventDefault();
                                const current = String(prompt || '');
                                if (!current.startsWith('/')) {
                                    setPrompt('/');
                                }
                                slash.openPalette(current.startsWith('/') ? current.replace(/^\//, '') : '');
                                return;
                            }
                            if (
                                !slash.open
                                && (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                                && !event.shiftKey
                                && !event.altKey
                                && !event.ctrlKey
                                && !event.metaKey
                            ) {
                                const current = String(prompt || '');
                                if (current.startsWith('/')) {
                                    const recalled = slash.recallCommand(event.key === 'ArrowUp' ? 'up' : 'down', current);
                                    if (recalled !== current) {
                                        event.preventDefault();
                                        setPrompt(recalled);
                                    }
                                }
                            }
                            if (slash.open && slash.handleKeyDown(event)) {
                                return;
                            }
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                runSend();
                            }
                        }}
                        placeholder={auditOnly ? "Audit-only mode: use /proof, /roi, /status, /guard, /help, /workflows." : "Enter command or ask a question into the active thread..."}
                        disabled={auditOnly && !canRunPrompt}
                        className="w-full min-h-32 bg-shell-soft/80 border border-violet-400/10 rounded-2xl p-5 text-[14px] leading-relaxed text-slate-100 placeholder-slate-600 outline-none focus:border-violet-400/30 focus:ring-2 focus:ring-violet-400/15 focus:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 resize-none shadow-inner"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4 border-t border-white/5 pt-3 w-[calc(100%-32px)] justify-end">
                        <div className="text-[9px] text-violet-500/60 font-mono hidden group-focus-within:block animate-pulse tracking-widest mr-auto pl-2">
                            <span className="text-green-500/50">// ready</span> · Enter to send
                        </div>
                        {hasRegenerate && typeof onRegenerate === 'function' && (
                            <button
                                type="button"
                                onClick={onRegenerate}
                                disabled={Boolean(isThinking)}
                                className={cn(
                                    'px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.16em] transition-all',
                                    isThinking
                                        ? 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                                        : 'bg-orange-500/8 hover:bg-orange-500/15 border border-orange-400/20 text-orange-200',
                                )}
                            >
                                Regenerate
                            </button>
                        )}
                        <button
                            onClick={() => {
                                runSend();
                            }}
                            disabled={!canRunPrompt || Boolean(isThinking)}
                            className={cn(
                                'px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                                canRunPrompt && !isThinking
                                    ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.08)] hover:shadow-[0_0_25px_rgba(217,70,239,0.15)] active:scale-[0.98]'
                                    : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed',
                            )}
                        >
                            Execute Command
                        </button>
                    </div>
                </div>
            </footer>
            <ProvGraph
                open={showProvGraph}
                onClose={() => setShowProvGraph(false)}
                chatLog={chatLog}
                threads={threads.list}
            />
            <DiffModal
                open={diffModalState.open}
                beforeText={diffModalState.beforeText}
                afterText={diffModalState.afterText}
                onClose={closeDiffModal}
            />
            <ThreadDrawer
                open={Boolean(threads.activeThread)}
                thread={threads.activeThread}
                onClose={threads.closeThread}
                onReply={(threadId, content) => {
                    const ok = threads.addReply(threadId, content);
                    if (ok && collab && typeof collab.publish === 'function') {
                        collab.publish('thread-reply', {
                            threadId: String(threadId || ''),
                            content: String(content || ''),
                            replyId: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        });
                    }
                    return ok;
                }}
                onUseContext={useThreadContext}
            />
            <div className="pointer-events-none fixed inset-0 z-[120]">
                {Object.entries((collab && collab.remoteCursors) || {}).map(([peerId, cursor]) => {
                    const x = Number(cursor && cursor.x ? cursor.x : 0);
                    const y = Number(cursor && cursor.y ? cursor.y : 0);
                    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
                    return (
                        <div
                            key={peerId}
                            className="absolute"
                            style={{
                                transform: `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px)`,
                            }}
                        >
                            <div className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                            <div className="mt-1 px-1.5 py-0.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[8px] font-mono uppercase tracking-[0.14em] text-emerald-100">
                                {String(peerId || 'peer').slice(0, 10)}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div
                data-testid="copy-toast"
                className={`fixed bottom-5 right-5 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-[10px] font-mono text-cyan-100 transition-opacity duration-1000 ${toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {toast || ' '}
            </div>
        </main>
    );
}

export default WorkspacePanel;
