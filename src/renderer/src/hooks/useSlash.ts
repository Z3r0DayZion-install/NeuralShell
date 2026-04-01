import React from 'react';

type SlashItem = {
    id: string;
    command: string;
    label: string;
    description: string;
    template: string;
    tags?: string[];
};

const HISTORY_STORAGE_KEY = 'neuralshell_slash_history_v1';
const MAX_HISTORY_ITEMS = 10;

function readHistory(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    try {
        const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((entry) => String(entry || '').trim())
            .filter(Boolean)
            .slice(0, MAX_HISTORY_ITEMS);
    } catch {
        return [];
    }
}

function writeHistory(values: string[]): void {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(values.slice(0, MAX_HISTORY_ITEMS)));
    } catch {
        // best effort
    }
}

function normalize(value: string): string {
    return String(value || '').trim().toLowerCase();
}

function fuzzyScore(haystack: string, needle: string): number {
    const target = normalize(haystack);
    const query = normalize(needle);
    if (!query) return 1;
    if (target.includes(query)) {
        return 300 - target.indexOf(query);
    }
    let score = 0;
    let cursor = 0;
    for (let i = 0; i < query.length; i += 1) {
        const char = query[i];
        const found = target.indexOf(char, cursor);
        if (found < 0) return -1;
        score += found === cursor ? 8 : 3;
        cursor = found + 1;
    }
    return score;
}

export function useSlash(items: SlashItem[], onInsert: (item: SlashItem) => void) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [history, setHistory] = React.useState<string[]>(() => readHistory());
    const [historyCursor, setHistoryCursor] = React.useState(-1);
    const historyDraftRef = React.useRef('');

    const filtered = React.useMemo(() => {
        const q = normalize(query);
        const ranked = (Array.isArray(items) ? items : [])
            .map((item) => {
                const bag = [
                    item.command,
                    item.label,
                    item.description,
                    Array.isArray(item.tags) ? item.tags.join(' ') : '',
                ].join(' ');
                return { item, score: fuzzyScore(bag, q) };
            })
            .filter((entry) => entry.score >= 0)
            .sort((a, b) => b.score - a.score)
            .map((entry) => entry.item);
        return ranked.slice(0, 8);
    }, [items, query]);

    React.useEffect(() => {
        if (selectedIndex < filtered.length) return;
        setSelectedIndex(0);
    }, [filtered, selectedIndex]);

    React.useEffect(() => {
        writeHistory(history);
    }, [history]);

    const openPalette = React.useCallback((seed = '') => {
        setOpen(true);
        setQuery(String(seed || '').trim());
        setSelectedIndex(0);
    }, []);

    const closePalette = React.useCallback(() => {
        setOpen(false);
        setQuery('');
        setSelectedIndex(0);
    }, []);

    const resetHistoryCursor = React.useCallback(() => {
        setHistoryCursor(-1);
        historyDraftRef.current = '';
    }, []);

    const rememberCommand = React.useCallback((rawCommand: string) => {
        const command = String(rawCommand || '').trim();
        if (!command || !command.startsWith('/')) {
            return;
        }
        setHistory((prev) => {
            const next = [command, ...prev.filter((entry) => entry !== command)];
            return next.slice(0, MAX_HISTORY_ITEMS);
        });
        resetHistoryCursor();
    }, [resetHistoryCursor]);

    const recallCommand = React.useCallback((direction: 'up' | 'down', draft: string): string => {
        const currentDraft = String(draft || '');
        if (!history.length) return currentDraft;

        if (direction === 'up') {
            if (historyCursor < 0) {
                historyDraftRef.current = currentDraft;
            }
            const nextCursor = Math.min(historyCursor + 1, history.length - 1);
            setHistoryCursor(nextCursor);
            return history[nextCursor] || currentDraft;
        }

        if (historyCursor < 0) {
            return currentDraft;
        }

        const nextCursor = historyCursor - 1;
        if (nextCursor < 0) {
            const restore = historyDraftRef.current || '';
            setHistoryCursor(-1);
            historyDraftRef.current = '';
            return restore;
        }
        setHistoryCursor(nextCursor);
        return history[nextCursor] || currentDraft;
    }, [history, historyCursor]);

    const pick = React.useCallback((index?: number) => {
        const targetIndex = Number.isFinite(Number(index)) ? Number(index) : selectedIndex;
        const selected = filtered[targetIndex];
        if (!selected) return false;
        onInsert(selected);
        closePalette();
        return true;
    }, [closePalette, filtered, onInsert, selectedIndex]);

    const handleKeyDown = React.useCallback((event: KeyboardEvent | React.KeyboardEvent) => {
        if (!open) return false;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                if (!filtered.length) return 0;
                return (prev + 1) % filtered.length;
            });
            return true;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                if (!filtered.length) return 0;
                return (prev - 1 + filtered.length) % filtered.length;
            });
            return true;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            pick();
            return true;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
            return true;
        }
        return false;
    }, [closePalette, filtered.length, open, pick]);

    return {
        open,
        query,
        setQuery,
        filtered,
        history,
        selectedIndex,
        setSelectedIndex,
        openPalette,
        closePalette,
        pick,
        rememberCommand,
        recallCommand,
        resetHistoryCursor,
        handleKeyDown,
    };
}

export default useSlash;
