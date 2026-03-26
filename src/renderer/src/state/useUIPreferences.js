import { create } from 'zustand';

const STORAGE_KEY = 'neuralshell_ui_prefs_v1';

function normalizeTheme(value) {
    const safe = String(value || '').trim().toLowerCase();
    if (safe === 'light' || safe === 'dark' || safe === 'system') {
        return safe;
    }
    return 'system';
}

function normalizeTemperature(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0.2;
    return Math.max(0, Math.min(2, Number(safe.toFixed(2))));
}

function readInitialPrefs() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { theme: 'system', temperature: 0.2 };
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { theme: 'system', temperature: 0.2 };
        const parsed = JSON.parse(raw);
        return {
            theme: normalizeTheme(parsed.theme),
            temperature: normalizeTemperature(parsed.temperature),
        };
    } catch {
        return { theme: 'system', temperature: 0.2 };
    }
}

const initial = readInitialPrefs();

export const useUIPreferences = create((set) => ({
    theme: initial.theme,
    temperature: initial.temperature,
    setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
    setTemperature: (temperature) => set({ temperature: normalizeTemperature(temperature) }),
}));

if (typeof window !== 'undefined' && window.localStorage) {
    useUIPreferences.subscribe((state) => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    theme: normalizeTheme(state.theme),
                    temperature: normalizeTemperature(state.temperature),
                }),
            );
        } catch {
            // best effort persistence
        }
    });
}

export default useUIPreferences;
