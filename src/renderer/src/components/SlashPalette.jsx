import React from 'react';
import { Command, Search } from 'lucide-react';

export function SlashPalette({
    open,
    query,
    setQuery,
    items,
    history = [],
    selectedIndex,
    onSelectIndex,
    onPick,
    onClose,
    onKeyDown,
}) {
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (!open || !inputRef.current) return;
        inputRef.current.focus();
        inputRef.current.select();
    }, [open]);

    if (!open) return null;

    return (
        <div
            data-testid="slash-palette"
            className="absolute left-0 right-0 bottom-[100%] mb-3 rounded-2xl border border-cyan-400/25 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.45)] overflow-hidden z-30"
        >
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
                <Search size={14} className="text-cyan-300/70" />
                <input
                    ref={inputRef}
                    data-testid="slash-palette-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search slash commands..."
                    className="flex-1 bg-transparent text-[12px] font-mono text-slate-100 placeholder-slate-500 outline-none"
                />
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-200"
                >
                    ESC
                </button>
            </div>
            {Array.isArray(history) && history.length > 0 && !String(query || '').trim() && (
                <div className="px-3 py-2 border-b border-white/5 bg-black/20">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold mb-1">Recent Commands</div>
                    <div className="flex flex-wrap gap-1.5">
                        {history.slice(0, 6).map((entry) => (
                            <button
                                key={entry}
                                type="button"
                                data-testid={`slash-history-${entry.replace(/[^a-z0-9_-]/gi, '').toLowerCase()}`}
                                onClick={() => {
                                    const index = items.findIndex((item) => item.command === entry);
                                    if (index >= 0) {
                                        onPick(index);
                                    } else {
                                        setQuery(String(entry || '').replace(/^\//, ''));
                                    }
                                }}
                                className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-slate-300 hover:border-cyan-300/30 hover:text-cyan-200"
                            >
                                {entry}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                {items.length === 0 && (
                    <div className="px-3 py-4 text-[11px] text-slate-500 font-mono">
                        No slash commands match this query.
                    </div>
                )}
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        type="button"
                        data-testid={`slash-item-${item.id}`}
                        onMouseEnter={() => onSelectIndex(index)}
                        onClick={() => onPick(index)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                            selectedIndex === index
                                ? 'border-cyan-300/35 bg-cyan-500/10'
                                : 'border-transparent hover:border-cyan-300/20 hover:bg-cyan-500/5'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-bold text-slate-100">{item.command}</div>
                            <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                                <Command size={10} />
                                Insert
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SlashPalette;
