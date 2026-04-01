import React from 'react';

export default function TierGateNotice({
    featureLabel,
    requiredPlan = 'Pro',
    onUpgrade,
}) {
    return (
        <div data-testid="tier-gate-notice" className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2">
            <div className="text-[10px] font-mono text-amber-100">
                {String(featureLabel || 'This feature')} requires {requiredPlan}.
            </div>
            <button
                type="button"
                data-testid="tier-gate-upgrade-btn"
                onClick={onUpgrade}
                className="mt-2 px-2 py-1 rounded border border-amber-200/40 text-[9px] uppercase tracking-[0.14em] font-mono text-amber-100 hover:bg-amber-500/15"
            >
                View Upgrade
            </button>
        </div>
    );
}
