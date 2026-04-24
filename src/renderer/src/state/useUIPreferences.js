import { create } from 'zustand';

const STORAGE_KEY = 'neuralshell_ui_prefs_v1';

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_FONT_SIZES = ['small', 'medium', 'large'];
const VALID_ACCENT_COLORS = ['violet', 'fuchsia', 'sky', 'emerald', 'amber', 'rose', 'teal'];
const VALID_SIDEBAR_POSITIONS = ['left', 'right'];

export const ACCENT_COLOR_MAP = {
    violet:  { primary: '#8b5cf6', hover: '#a78bfa', ring: 'rgba(139,92,246,0.2)', bg: 'rgba(139,92,246,0.06)' },
    fuchsia: { primary: '#d946ef', hover: '#e879f9', ring: 'rgba(217,70,239,0.2)', bg: 'rgba(217,70,239,0.06)' },
    sky:     { primary: '#0ea5e9', hover: '#38bdf8', ring: 'rgba(14,165,233,0.2)', bg: 'rgba(14,165,233,0.06)' },
    emerald: { primary: '#10b981', hover: '#34d399', ring: 'rgba(16,185,129,0.2)', bg: 'rgba(16,185,129,0.06)' },
    amber:   { primary: '#f59e0b', hover: '#fbbf24', ring: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.06)' },
    rose:    { primary: '#f43f5e', hover: '#fb7185', ring: 'rgba(244,63,94,0.2)',  bg: 'rgba(244,63,94,0.06)' },
    teal:    { primary: '#14b8a6', hover: '#2dd4bf', ring: 'rgba(20,184,166,0.2)', bg: 'rgba(20,184,166,0.06)' },
};

export const FONT_SIZE_MAP = {
    small:  { base: 12, mono: 10, heading: 11 },
    medium: { base: 14, mono: 12, heading: 13 },
    large:  { base: 16, mono: 14, heading: 15 },
};

function normalizeTheme(value) {
    const safe = String(value || '').trim().toLowerCase();
    return VALID_THEMES.includes(safe) ? safe : 'system';
}

function normalizeTemperature(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0.2;
    return Math.max(0, Math.min(2, Number(safe.toFixed(2))));
}

function normalizeFontSize(value) {
    const safe = String(value || '').trim().toLowerCase();
    return VALID_FONT_SIZES.includes(safe) ? safe : 'medium';
}

function normalizeAccentColor(value) {
    const safe = String(value || '').trim().toLowerCase();
    return VALID_ACCENT_COLORS.includes(safe) ? safe : 'violet';
}

function normalizeSidebarPosition(value) {
    const safe = String(value || '').trim().toLowerCase();
    return VALID_SIDEBAR_POSITIONS.includes(safe) ? safe : 'left';
}

const DEFAULTS = {
    theme: 'system',
    temperature: 0.2,
    fontSize: 'medium',
    accentColor: 'violet',
    compactMode: false,
    animationsEnabled: true,
    sidebarPosition: 'left',
};

function readInitialPrefs() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULTS };
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw);
        return {
            theme: normalizeTheme(parsed.theme),
            temperature: normalizeTemperature(parsed.temperature),
            fontSize: normalizeFontSize(parsed.fontSize),
            accentColor: normalizeAccentColor(parsed.accentColor),
            compactMode: Boolean(parsed.compactMode),
            animationsEnabled: parsed.animationsEnabled !== false,
            sidebarPosition: normalizeSidebarPosition(parsed.sidebarPosition),
        };
    } catch {
        return { ...DEFAULTS };
    }
}

const initial = readInitialPrefs();

export const useUIPreferences = create((set) => ({
    ...initial,
    setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
    setTemperature: (temperature) => set({ temperature: normalizeTemperature(temperature) }),
    setFontSize: (fontSize) => set({ fontSize: normalizeFontSize(fontSize) }),
    setAccentColor: (accentColor) => set({ accentColor: normalizeAccentColor(accentColor) }),
    setCompactMode: (compactMode) => set({ compactMode: Boolean(compactMode) }),
    setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled: Boolean(animationsEnabled) }),
    setSidebarPosition: (sidebarPosition) => set({ sidebarPosition: normalizeSidebarPosition(sidebarPosition) }),
    resetToDefaults: () => set({ ...DEFAULTS }),
}));

if (typeof window !== 'undefined' && window.localStorage) {
    useUIPreferences.subscribe((state) => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    theme: normalizeTheme(state.theme),
                    temperature: normalizeTemperature(state.temperature),
                    fontSize: normalizeFontSize(state.fontSize),
                    accentColor: normalizeAccentColor(state.accentColor),
                    compactMode: Boolean(state.compactMode),
                    animationsEnabled: state.animationsEnabled !== false,
                    sidebarPosition: normalizeSidebarPosition(state.sidebarPosition),
                }),
            );
        } catch {
            // best effort persistence
        }
    });
}

export default useUIPreferences;
