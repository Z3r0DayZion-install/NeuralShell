import React from 'react';

const STORAGE_KEY = 'scratchpadDraft';

function readDraft() {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    try {
        return String(window.localStorage.getItem(STORAGE_KEY) || '');
    } catch {
        return '';
    }
}

export default function ScratchpadTab({ open, onClose }) {
    const [draft, setDraft] = React.useState('');

    React.useEffect(() => {
        if (open) {
            setDraft(readDraft());
        }
    }, [open]);

    React.useEffect(() => {
        if (!open || typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, String(draft || ''));
        } catch {
            // best effort
        }
    }, [draft, open]);

    if (!open) return null;

    return (
        <aside
            data-testid="scratchpad-tab"
            className="absolute right-0 top-0 bottom-0 z-[70] w-[min(32vw,420px)] border-l border-cyan-300/20 bg-slate-950/95 backdrop-blur-md shadow-[-20px_0_45px_rgba(0,0,0,0.55)]"
        >
            <div className="h-full flex flex-col">
                <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Scratchpad</div>
                        <div className="text-[10px] font-mono text-slate-500">Local-only untitled notes</div>
                    </div>
                    <button
                        type="button"
                        data-testid="scratchpad-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </header>
                <div className="p-4 flex-1">
                    <textarea
                        data-testid="scratchpad-input"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Write temporary notes, prompts, or TODOs..."
                        className="w-full h-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-[12px] font-mono text-slate-200 outline-none focus:border-cyan-300/35 resize-none"
                    />
                </div>
            </div>
        </aside>
    );
}
