import React from 'react';

function successTone(rate) {
    const safe = Number(rate || 0);
    if (safe >= 95) return 'text-emerald-300';
    if (safe >= 80) return 'text-amber-300';
    return 'text-rose-300';
}

export default function AgentReputationCard({ agent }) {
    const safe = agent && typeof agent === 'object' ? agent : {};
    const minVersion = safe.compatibility && safe.compatibility.minVersion ? safe.compatibility.minVersion : '';
    const maxVersion = safe.compatibility && safe.compatibility.maxVersion ? safe.compatibility.maxVersion : '';
    return (
        <div data-testid={`agent-reputation-${safe.id || 'unknown'}`} className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-[9px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center justify-between gap-2">
                <span>Trust: {String(safe.trustBadge || 'community')}</span>
                <span>Rating: {Number(safe.rating || 0).toFixed(1)} ({Number(safe.ratingsCount || 0)})</span>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span>Install success</span>
                <span className={successTone(safe.installSuccessRate)}>{Number(safe.installSuccessRate || 0)}%</span>
            </div>
            <div>
                Compat: {minVersion || 'any'}{maxVersion ? ` -> ${maxVersion}` : '+'}
            </div>
        </div>
    );
}
