import React from 'react';

function tone(tierId) {
    const id = String(tierId || '').toLowerCase();
    if (id === 'enterprise') return 'border-amber-300/30 bg-amber-500/10 text-amber-200';
    if (id === 'pro') return 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200';
    return 'border-slate-300/20 bg-slate-500/10 text-slate-300';
}

export default function TierBadge({ tierId, tierLabel }) {
    return (
        <span
            data-testid="tier-badge"
            className={`inline-flex items-center px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${tone(tierId)}`}
            title={`Tier ${String(tierLabel || tierId || 'unknown')}`}
        >
            {String(tierLabel || tierId || 'free')}
        </span>
    );
}
