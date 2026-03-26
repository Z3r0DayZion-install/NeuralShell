import React from 'react';

type SlashItem = {
    id: string;
    command: string;
    label: string;
    description: string;
    template: string;
    tags?: string[];
};

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
        selectedIndex,
        setSelectedIndex,
        openPalette,
        closePalette,
        pick,
        handleKeyDown,
    };
}

export default useSlash;
