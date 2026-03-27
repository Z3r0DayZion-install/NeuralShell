import React from 'react';

export default function DiffModal({ open, beforeText, afterText, onClose }) {
    React.useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && typeof onClose === 'function') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[85] bg-black/55" onClick={onClose} />
            <aside
                data-testid="diff-modal"
                className="fixed right-0 top-0 bottom-0 z-[86] border-l border-cyan-300/25 bg-slate-950/98 backdrop-blur-sm shadow-[-24px_0_45px_rgba(0,0,0,0.45)]"
                style={{ width: 'min(40vw, 620px)' }}
            >
                <div className="h-full flex flex-col">
                    <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Regeneration Diff</div>
                            <div className="text-[10px] text-slate-500 font-mono">Side-by-side assistant output</div>
                        </div>
                        <button
                            type="button"
                            data-testid="diff-modal-close"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </header>

                    <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                        <section className="border-r border-white/10 h-full overflow-auto custom-scrollbar">
                            <div className="px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold border-b border-white/10">Previous</div>
                            <pre className="m-0 p-3 text-[11px] leading-relaxed font-mono text-slate-300 whitespace-pre-wrap">{String(beforeText || '')}</pre>
                        </section>
                        <section className="h-full overflow-auto custom-scrollbar">
                            <div className="px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-emerald-300 font-bold border-b border-white/10">Regenerated</div>
                            <pre className="m-0 p-3 text-[11px] leading-relaxed font-mono text-slate-100 whitespace-pre-wrap">{String(afterText || '')}</pre>
                        </section>
                    </div>
                </div>
            </aside>
        </>
    );
}
