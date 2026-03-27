import React from 'react';

const STORAGE_KEY = 'neuralshell_accent_v1';
const DEFAULT_ACCENT = '#22D3EE';

function normalizeHex(value: string): string {
    const trimmed = String(value || '').trim();
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    const shortMatch = /^#([0-9a-fA-F]{3})$/.exec(withHash);
    if (shortMatch) {
        const [r, g, b] = shortMatch[1].split('');
        return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    const longMatch = /^#([0-9a-fA-F]{6})$/.exec(withHash);
    if (!longMatch) {
        return DEFAULT_ACCENT;
    }
    return `#${longMatch[1].toUpperCase()}`;
}

function isValidHex(value: string): boolean {
    const trimmed = String(value || '').trim();
    return /^#?[0-9a-fA-F]{3}$/.test(trimmed) || /^#?[0-9a-fA-F]{6}$/.test(trimmed);
}

function hexToRgbTuple(value: string): string {
    const normalized = normalizeHex(value);
    const r = Number.parseInt(normalized.slice(1, 3), 16);
    const g = Number.parseInt(normalized.slice(3, 5), 16);
    const b = Number.parseInt(normalized.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
}

function readInitialAccent(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_ACCENT;
    }
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_ACCENT;
        return normalizeHex(stored);
    } catch {
        return DEFAULT_ACCENT;
    }
}

function applyAccentToDocument(accent: string): void {
    if (typeof document === 'undefined') return;
    const safe = normalizeHex(accent);
    const rgb = hexToRgbTuple(safe);
    document.body.style.setProperty('--accent', safe);
    document.body.style.setProperty('--accent-rgb', rgb);
    document.documentElement.style.setProperty('--accent', safe);
    document.documentElement.style.setProperty('--accent-rgb', rgb);
}

export function useAccent() {
    const [accent, setAccentState] = React.useState<string>(() => readInitialAccent());

    React.useEffect(() => {
        const safe = normalizeHex(accent);
        applyAccentToDocument(safe);
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(STORAGE_KEY, safe);
            } catch {
                // best effort
            }
        }
    }, [accent]);

    const setAccent = React.useCallback((value: string) => {
        const safe = normalizeHex(value);
        setAccentState(safe);
    }, []);

    return {
        accent,
        setAccent,
        isValidAccent: isValidHex,
        normalizeAccent: normalizeHex,
    };
}

export default useAccent;
