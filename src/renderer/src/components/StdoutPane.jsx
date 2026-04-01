import React from 'react';

function sanitizeLine(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export default function StdoutPane({ lines, done }) {
    const safeLines = Array.isArray(lines) ? lines : [];
    const [open, setOpen] = React.useState(Boolean(safeLines.length));

    React.useEffect(() => {
        if (safeLines.length) {
            setOpen(true);
        }
    }, [safeLines.length]);

    if (!safeLines.length) return null;

    return (
        <div data-testid="stdout-pane" className="mt-3 rounded-xl border border-white/10 bg-black/30">
            <button
                type="button"
                data-testid="stdout-pane-toggle"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full px-3 py-2 text-left text-[10px] font-mono uppercase tracking-[0.12em] text-slate-300 flex items-center justify-between border-b border-white/10"
            >
                <span>Stdout Stream</span>
                <span className={done ? 'text-emerald-300' : 'text-amber-300'}>
                    {done ? 'Complete' : 'Running'}
                </span>
            </button>
            {open && (
                <pre
                    className="m-0 p-3 text-[10px] leading-relaxed font-mono text-slate-200 whitespace-pre-wrap max-h-56 overflow-auto custom-scrollbar"
                    dangerouslySetInnerHTML={{ __html: safeLines.map(sanitizeLine).join('\n') }}
                />
            )}
        </div>
    );
}
