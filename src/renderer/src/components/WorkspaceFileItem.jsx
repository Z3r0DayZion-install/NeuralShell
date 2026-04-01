import React from 'react';

export default function WorkspaceFileItem({ label, count, tone = 'neutral', testId }) {
    const safeCount = Math.max(0, Number(count || 0));
    const toneClass = tone === 'added'
        ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-200'
        : tone === 'modified'
            ? 'border-amber-300/35 bg-amber-500/12 text-amber-200'
            : tone === 'deleted'
                ? 'border-rose-300/35 bg-rose-500/12 text-rose-200'
                : 'border-slate-300/20 bg-slate-500/10 text-slate-300';

    return (
        <div
            data-testid={testId}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-mono uppercase tracking-[0.12em] ${toneClass}`}
        >
            <span>{label}</span>
            <span>{safeCount}</span>
        </div>
    );
}
