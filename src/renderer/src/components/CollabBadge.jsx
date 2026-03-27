import React from 'react';

export default function CollabBadge({
    connected,
    roomId,
    peerCount,
}) {
    return (
        <div
            data-testid="collab-badge"
            title={`Room: ${String(roomId || 'default')}`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-[0.14em] ${
                connected
                    ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-300/20 bg-slate-500/10 text-slate-300'
            }`}
        >
            <span>{connected ? 'Collab Live' : 'Collab Idle'}</span>
            <span>·</span>
            <span>{Number(peerCount || 0)} peer</span>
        </div>
    );
}

