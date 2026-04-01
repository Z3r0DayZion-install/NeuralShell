import React from 'react';

const CHIP_ACTIONS = [
    { id: 'explain', label: 'Explain', prefix: '/explain' },
    { id: 'refactor', label: 'Refactor', prefix: '/refactor' },
    { id: 'unit-test', label: 'UnitTest', prefix: '/unit-test' },
];

export default function ContextChipBar({
    visible,
    x,
    y,
    selectionText,
    onPick,
}) {
    if (!visible) return null;
    const selection = String(selectionText || '').trim();
    if (!selection) return null;

    return (
        <div
            data-testid="context-chip-bar"
            className="fixed z-[80] flex items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-slate-950/95 px-2 py-1 shadow-[0_10px_25px_rgba(0,0,0,0.45)]"
            style={{ left: `${Math.max(8, Number(x || 0))}px`, top: `${Math.max(8, Number(y || 0))}px` }}
        >
            {CHIP_ACTIONS.map((action) => (
                <button
                    key={action.id}
                    type="button"
                    data-testid={`context-chip-${action.id}`}
                    onMouseDown={(event) => {
                        event.preventDefault();
                    }}
                    onClick={() => {
                        if (typeof onPick === 'function') {
                            onPick(`${action.prefix} ${selection}`);
                        }
                    }}
                    className="px-2 py-1 rounded border border-white/10 bg-black/35 text-[9px] font-mono uppercase tracking-[0.12em] text-slate-200 hover:border-cyan-300/30 hover:text-cyan-100 hover:bg-cyan-500/10"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
}
