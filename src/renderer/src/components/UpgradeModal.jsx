import React from 'react';
import plansManifest from '../config/plans.json';

const STORAGE_KEY = 'neuralshell_upgrade_prompt_dismissed_v1';

function readDismissed(featureKey) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const map = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return Boolean(map && map[String(featureKey || '')]);
}

function writeDismissed(featureKey) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const map = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    const next = map && typeof map === 'object' ? map : {};
    next[String(featureKey || '')] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export default function UpgradeModal({
    open,
    featureKey = '',
    featureLabel = '',
    requiredPlan = 'pro',
    onClose,
}) {
    const [dismissed, setDismissed] = React.useState(() => readDismissed(featureKey));

    React.useEffect(() => {
        setDismissed(readDismissed(featureKey));
    }, [featureKey]);

    if (!open || dismissed) return null;

    const plans = Array.isArray(plansManifest && plansManifest.plans) ? plansManifest.plans : [];
    const targetPlan = plans.find((plan) => String(plan.id || '').toLowerCase() === String(requiredPlan || '').toLowerCase());
    const checkoutUrl = String(
        targetPlan && targetPlan.checkout
            ? (targetPlan.checkout.gumroad || targetPlan.checkout.stripe || targetPlan.checkout.invoiceUrl || '')
            : ''
    );

    return (
        <div className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-cyan-300/20 bg-slate-950 p-5 space-y-3">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Upgrade Available</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                        {String(featureLabel || 'This capability')} is available on the {String(requiredPlan || 'pro').toUpperCase()} plan.
                    </div>
                </div>
                {targetPlan && (
                    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                        {targetPlan.label} · ${Number(targetPlan.priceUsd || 0)} · {String(targetPlan.billingPeriod || 'one_time')}
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        data-testid="upgrade-modal-dismiss"
                        onClick={() => {
                            writeDismissed(featureKey);
                            setDismissed(true);
                            if (typeof onClose === 'function') onClose();
                        }}
                        className="px-3 py-2 rounded border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.14em] font-mono text-slate-200"
                    >
                        Dismiss
                    </button>
                    <button
                        type="button"
                        data-testid="upgrade-modal-open-checkout"
                        onClick={async () => {
                            if (checkoutUrl && window.api && window.api.system && typeof window.api.system.openExternal === 'function') {
                                await window.api.system.openExternal(checkoutUrl);
                            }
                            if (typeof onClose === 'function') onClose();
                        }}
                        className="px-3 py-2 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-cyan-100"
                    >
                        Upgrade
                    </button>
                </div>
            </div>
        </div>
    );
}
