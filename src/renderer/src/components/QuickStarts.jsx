import React from 'react';

export default function QuickStarts({ items, visibleIds, onSelect, onDismiss }) {
    const safeItems = (Array.isArray(items) ? items : []).filter((item) => visibleIds.includes(item.id));
    if (!safeItems.length) return null;

    return (
        <section data-testid="quickstarts" className="mb-6 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Scenario Quick-Start</div>
                    <div className="text-[10px] font-mono text-slate-500">Pick a launch lane and inject a pre-baked prompt.</div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {safeItems.map((item) => (
                    <article key={item.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex flex-col gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-200 font-bold">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">{item.description}</div>
                        </div>
                        <div className="mt-auto flex items-center gap-2">
                            <button
                                type="button"
                                data-testid={`quickstart-select-${item.id}`}
                                onClick={() => onSelect(item)}
                                className="flex-1 px-2 py-1.5 rounded border text-[9px] uppercase tracking-[0.14em] font-bold"
                                style={{
                                    borderColor: 'rgb(var(--accent-rgb) / 0.45)',
                                    backgroundColor: 'rgb(var(--accent-rgb) / 0.14)',
                                    color: 'var(--accent)',
                                }}
                            >
                                Use
                            </button>
                            <button
                                type="button"
                                data-testid={`quickstart-dismiss-${item.id}`}
                                onClick={() => onDismiss(item.id)}
                                className="px-2 py-1.5 rounded border border-white/10 text-[9px] uppercase tracking-[0.14em] font-bold text-slate-400 hover:bg-white/10"
                            >
                                Dismiss
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
