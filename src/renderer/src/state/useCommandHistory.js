import { create } from 'zustand';

const STORAGE_KEY = 'neuralshell_command_history_v1';
const LIMIT = 10;

function normalizeCommand(value) {
    return String(value || '').trim();
}

function readInitialState() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {
            items: [],
            cursor: -1,
            draft: '',
        };
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                items: [],
                cursor: -1,
                draft: '',
            };
        }
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed && parsed.items)
            ? parsed.items.map(normalizeCommand).filter(Boolean).slice(0, LIMIT)
            : [];
        return {
            items,
            cursor: -1,
            draft: '',
        };
    } catch {
        return {
            items: [],
            cursor: -1,
            draft: '',
        };
    }
}

const initial = readInitialState();

export const useCommandHistory = create((set, get) => ({
    items: initial.items,
    cursor: initial.cursor,
    draft: initial.draft,
    record: (command) => {
        const normalized = normalizeCommand(command);
        if (!normalized) return;
        set((state) => {
            const next = [normalized, ...state.items.filter((item) => item !== normalized)].slice(0, LIMIT);
            return {
                items: next,
                cursor: -1,
                draft: '',
            };
        });
    },
    resetCursor: () => {
        set({ cursor: -1, draft: '' });
    },
    recallPrev: (currentDraft) => {
        const state = get();
        if (!state.items.length) {
            return String(currentDraft || '');
        }
        const safeDraft = String(currentDraft || '');
        const nextCursor = state.cursor < 0
            ? 0
            : Math.min(state.cursor + 1, state.items.length - 1);
        const nextDraft = state.cursor < 0 ? safeDraft : state.draft;
        set({ cursor: nextCursor, draft: nextDraft });
        return state.items[nextCursor] || safeDraft;
    },
    recallNext: () => {
        const state = get();
        if (!state.items.length || state.cursor < 0) {
            return String(state.draft || '');
        }
        const nextCursor = state.cursor - 1;
        if (nextCursor < 0) {
            const restored = String(state.draft || '');
            set({ cursor: -1, draft: '' });
            return restored;
        }
        set({ cursor: nextCursor });
        return state.items[nextCursor] || '';
    },
}));

if (typeof window !== 'undefined' && window.localStorage) {
    useCommandHistory.subscribe((state) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                items: Array.isArray(state.items) ? state.items.slice(0, LIMIT) : [],
            }));
        } catch {
            // best-effort persistence
        }
    });
}

export default useCommandHistory;
