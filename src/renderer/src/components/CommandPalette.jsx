import React from 'react';
import { getPaletteCommands } from '../state/moduleRegistry';
import { useShell } from '../state/ShellContext';

const MAX_VISIBLE_RESULTS = 24;
const MRU_STORAGE_KEY = 'neuralshell_palette_mru_v1';
const MRU_LIMIT = 40;

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function tokenizeQuery(value) {
    return normalizeText(value).split(/\s+/).map((item) => item.trim()).filter(Boolean);
}

function includesAllTokens(haystack, tokens) {
    if (!tokens.length) return true;
    return tokens.every((token) => haystack.includes(token));
}

function safeReadMru() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(MRU_STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    } catch {
        return [];
    }
}

function safeWriteMru(keys) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        const safe = Array.isArray(keys)
            ? keys.map((item) => String(item || '').trim()).filter(Boolean).slice(0, MRU_LIMIT)
            : [];
        window.localStorage.setItem(MRU_STORAGE_KEY, JSON.stringify(safe));
    } catch {
        // best effort
    }
}

function scoreItem(item, query, queryTokens, mruIndex) {
    const label = normalizeText(item && item.label);
    const id = normalizeText(item && item.id);
    const keywords = normalizeText(item && item.keywords);
    const haystack = `${label} ${id} ${keywords}`.trim();
    if (!haystack) return Number.NEGATIVE_INFINITY;
    if (!includesAllTokens(haystack, queryTokens)) return Number.NEGATIVE_INFINITY;

    let score = 0;
    const kind = String(item && item.kind || 'command');

    if (!query) {
        score += kind === 'command' ? 12 : 6;
    } else {
        if (haystack.startsWith(query)) score += 150;
        if (label.startsWith(query)) score += 120;
        if (id.startsWith(query)) score += 80;
        if (label.includes(query)) score += 50;
        if (id.includes(query)) score += 30;

        for (const token of queryTokens) {
            if (label.startsWith(token)) score += 20;
            else if (label.includes(token)) score += 10;
            if (id.startsWith(token)) score += 12;
            else if (id.includes(token)) score += 6;
            if (keywords.includes(token)) score += 4;
        }
    }

    if (query.startsWith('/') && kind === 'command') {
        score += 35;
    }
    if (
        kind === 'session'
        && queryTokens.some((token) => token === 'session' || token === 'workflow' || token === 'thread')
    ) {
        score += 22;
    }

    if (mruIndex >= 0) {
        score += Math.max(0, 90 - (mruIndex * 4));
    }

    if (kind === 'session' && item.active) {
        score += 12;
    }
    if (kind === 'session' && item.locked) {
        score -= 4;
    }

    return score;
}

export function CommandPalette({ onClose }) {
    const shell = useShell();
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const mod = isMac ? '⌘' : 'Ctrl';
    const [query, setQuery] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [mruKeys, setMruKeys] = React.useState(() => safeReadMru());

    React.useEffect(() => {
        safeWriteMru(mruKeys);
    }, [mruKeys]);

    const commandItems = React.useMemo(() => {
        const registered = getPaletteCommands();
        return registered.map((cmd, index) => ({
            key: `command:${String(cmd && cmd.id || `cmd-${index}`)}`,
            id: String(cmd && cmd.id || `cmd-${index}`),
            label: String(cmd && cmd.title || `Command ${index + 1}`),
            subtitle: 'Command',
            kind: 'command',
            action: cmd && cmd.action,
            shortcutNumber: index < 9 ? index + 1 : null,
            shortcut: index < 9 ? `${mod} + ${index + 1}` : '',
            keywords: `${String(cmd && cmd.title || '')} ${String(cmd && cmd.id || '')} command`,
            baseIndex: index,
        }));
    }, [mod]);

    const sessionItems = React.useMemo(() => {
        const sessions = Array.isArray(shell && shell.sessions) ? shell.sessions : [];
        const activeWorkflow = String(shell && shell.workflowId || '').trim();
        const canCheckUnlock = Boolean(shell && typeof shell.isSessionUnlocked === 'function');
        return sessions.map((sessionName, index) => {
            const safeName = String(sessionName || '').trim();
            const active = safeName === activeWorkflow;
            const locked = canCheckUnlock ? !shell.isSessionUnlocked(safeName) : false;
            return {
                key: `session:${safeName}`,
                id: safeName,
                label: safeName,
                subtitle: active ? 'Active workflow' : 'Workflow session',
                kind: 'session',
                sessionName: safeName,
                active,
                locked,
                shortcutNumber: null,
                shortcut: '',
                keywords: `${safeName} workflow session thread`,
                baseIndex: 1000 + index,
            };
        });
    }, [shell]);

    const allItems = React.useMemo(() => [...commandItems, ...sessionItems], [commandItems, sessionItems]);
    const normalizedQuery = React.useMemo(() => normalizeText(query), [query]);
    const queryTokens = React.useMemo(() => tokenizeQuery(query), [query]);
    const mruLookup = React.useMemo(() => new Map(mruKeys.map((key, index) => [key, index])), [mruKeys]);

    const filteredItems = React.useMemo(() => (
        allItems
            .map((item) => {
                const mruIndex = mruLookup.has(item.key) ? Number(mruLookup.get(item.key)) : -1;
                return {
                    item,
                    score: scoreItem(item, normalizedQuery, queryTokens, mruIndex),
                    mruIndex,
                };
            })
            .filter((entry) => Number.isFinite(entry.score) && entry.score > Number.NEGATIVE_INFINITY)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.mruIndex !== b.mruIndex) {
                    if (a.mruIndex < 0) return 1;
                    if (b.mruIndex < 0) return -1;
                    return a.mruIndex - b.mruIndex;
                }
                if (a.item.baseIndex !== b.item.baseIndex) return a.item.baseIndex - b.item.baseIndex;
                return String(a.item.label || '').localeCompare(String(b.item.label || ''));
            })
            .slice(0, MAX_VISIBLE_RESULTS)
            .map((entry) => entry.item)
    ), [allItems, mruLookup, normalizedQuery, queryTokens]);

    const resultSummary = React.useMemo(() => {
        let commands = 0;
        let sessions = 0;
        for (const item of filteredItems) {
            if (item.kind === 'session') sessions += 1;
            else commands += 1;
        }
        return { commands, sessions };
    }, [filteredItems]);

    React.useEffect(() => {
        setSelectedIndex(0);
    }, [normalizedQuery]);

    React.useEffect(() => {
        if (selectedIndex < filteredItems.length) return;
        setSelectedIndex(filteredItems.length > 0 ? filteredItems.length - 1 : 0);
    }, [filteredItems.length, selectedIndex]);

    const rememberItem = React.useCallback((itemKey) => {
        const safeKey = String(itemKey || '').trim();
        if (!safeKey) return;
        setMruKeys((prev) => {
            const next = [safeKey, ...prev.filter((entry) => entry !== safeKey)];
            return next.slice(0, MRU_LIMIT);
        });
    }, []);

    const runItem = React.useCallback((item) => {
        if (!item) return;

        if (item.kind === 'command') {
            if (typeof item.action === 'function') {
                item.action(shell);
            }
        } else if (item.kind === 'session') {
            const sessionName = String(item.sessionName || '').trim();
            if (sessionName && shell && typeof shell.selectSession === 'function') {
                shell.selectSession(sessionName);
            }
        }

        rememberItem(item.key);
        onClose();
    }, [onClose, rememberItem, shell]);

    const handleInputKeyDown = React.useCallback((event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
            const shortcutNumber = Number(event.key);
            const shortcutMatch = commandItems.find((item) => item.shortcutNumber === shortcutNumber);
            if (shortcutMatch) {
                event.preventDefault();
                runItem(shortcutMatch);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!filteredItems.length) return;
            setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!filteredItems.length) return;
            setSelectedIndex((prev) => ((prev - 1 + filteredItems.length) % filteredItems.length));
            return;
        }
        if (event.key === 'Home') {
            event.preventDefault();
            setSelectedIndex(0);
            return;
        }
        if (event.key === 'End') {
            event.preventDefault();
            if (!filteredItems.length) return;
            setSelectedIndex(filteredItems.length - 1);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!filteredItems.length) return;
            const selected = filteredItems[selectedIndex] || filteredItems[0];
            runItem(selected);
        }
    }, [commandItems, filteredItems, onClose, runItem, selectedIndex]);

    return (
        <div
            data-testid="command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(34,211,238,0.1)] overflow-hidden"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <span className="text-cyan-400 font-mono text-xl">/</span>
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        aria-label="Search commands and sessions"
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder-slate-600"
                        placeholder="Search commands, workflows, and sessions..."
                    />
                    <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/10 uppercase font-bold">
                        {filteredItems.length} Result{filteredItems.length === 1 ? '' : 's'}
                    </div>
                </div>
                <div className="px-4 py-2 border-b border-white/5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>{resultSummary.commands} command{resultSummary.commands === 1 ? '' : 's'}</span>
                    <span>{resultSummary.sessions} workflow{resultSummary.sessions === 1 ? '' : 's'}</span>
                </div>
                <div className="p-2 max-h-[420px] overflow-y-auto no-scrollbar" role="listbox" aria-label="Available palette results">
                    {filteredItems.length === 0 ? (
                        <div className="px-3 py-8 text-center">
                            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400 font-bold">No Matches</div>
                            <div className="mt-1 text-[10px] font-mono text-slate-500">
                                Try a simpler keyword or clear the query.
                            </div>
                        </div>
                    ) : filteredItems.map((item, index) => {
                        const selected = index === selectedIndex;
                        return (
                            <button
                                key={item.key}
                                role="option"
                                aria-selected={selected}
                                data-testid={`command-palette-item-${item.kind}-${item.id}`}
                                className={`w-full text-left p-3 rounded-xl transition-all border ${
                                    selected
                                        ? 'bg-cyan-400/15 border-cyan-400/25'
                                        : 'hover:bg-cyan-400/10 border-transparent'
                                }`}
                                onMouseMove={() => {
                                    if (!selected) setSelectedIndex(index);
                                }}
                                onClick={() => runItem(item)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className={selected ? 'text-cyan-100 font-semibold truncate' : 'text-slate-200 font-semibold truncate'}>
                                            {item.label}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-mono text-slate-500 truncate">
                                            {item.subtitle}{item.kind === 'session' && item.locked ? ' · Locked' : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                                            item.kind === 'session'
                                                ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                                                : 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'
                                        }`}
                                        >
                                            {item.kind === 'session' ? 'Workflow' : 'Command'}
                                        </span>
                                        {item.active ? (
                                            <span className="px-1.5 py-0.5 rounded border border-amber-300/30 bg-amber-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-amber-200">
                                                Active
                                            </span>
                                        ) : null}
                                        {item.shortcut ? (
                                            <span className={`text-[9px] font-mono uppercase ${selected ? 'text-cyan-300' : 'text-slate-600'}`}>
                                                {item.shortcut}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
