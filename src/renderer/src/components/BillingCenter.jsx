import React from 'react';
import plansManifest from '../config/plans.json';

function tone(status) {
    if (status === 'active') return 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200';
    if (status === 'grace') return 'border-amber-300/30 bg-amber-500/10 text-amber-200';
    if (status === 'expired') return 'border-rose-300/30 bg-rose-500/10 text-rose-200';
    return 'border-slate-300/20 bg-slate-500/10 text-slate-300';
}

function normalizeStatus(payload) {
    const base = payload && typeof payload === 'object' ? payload : {};
    return {
        present: Boolean(base.present),
        status: String(base.status || 'none'),
        planId: String(base.planId || 'free'),
        planLabel: String(base.planLabel || 'Free'),
        seats: Number(base.seats || 1),
        expiresAt: String(base.expiresAt || ''),
        graceEndsAt: String(base.graceEndsAt || ''),
        graceRemainingDays: Number(base.graceRemainingDays || 0),
        plans: Array.isArray(base.plans) ? base.plans : [],
    };
}

export default function BillingCenter() {
    const [status, setStatus] = React.useState(() => normalizeStatus({}));
    const [licenseText, setLicenseText] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const refresh = React.useCallback(async () => {
        try {
            const payload = await window.api.license.status();
            setStatus(normalizeStatus(payload));
        } catch (err) {
            setMessage(`Billing status load failed: ${err && err.message ? err.message : String(err)}`);
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const activateFromJson = React.useCallback(async (jsonText) => {
        const safe = String(jsonText || '').trim();
        if (!safe) {
            setMessage('Paste or import a license JSON blob first.');
            return;
        }
        setBusy(true);
        try {
            const parsed = JSON.parse(safe);
            const result = await window.api.license.activateBlob(parsed);
            if (result && result.ok) {
                setMessage(`License activated: ${result.planLabel} (${result.status}).`);
                await refresh();
            } else {
                setMessage(`License activation failed: ${result && result.reason ? result.reason : 'unknown error'}`);
            }
        } catch (err) {
            setMessage(`License activation failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    }, [refresh]);

    const importFromFile = React.useCallback(async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        const text = await file.text();
        setLicenseText(text);
        await activateFromJson(text);
    }, [activateFromJson]);

    const clearLicense = React.useCallback(async () => {
        setBusy(true);
        try {
            await window.api.license.clear();
            setLicenseText('');
            setMessage('Active license cleared. Runtime falls back to Free tier.');
            await refresh();
        } catch (err) {
            setMessage(`License clear failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    }, [refresh]);

    const plans = Array.isArray(status.plans) && status.plans.length
        ? status.plans
        : (Array.isArray(plansManifest && plansManifest.plans) ? plansManifest.plans : []);

    return (
        <section data-testid="billing-center" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Billing & License</div>
                    <div className="text-[11px] text-slate-400 font-mono">Offline license activation with grace-state visibility.</div>
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.14em] font-mono text-slate-200 hover:bg-white/10"
                >
                    Refresh
                </button>
            </div>

            <div className={`inline-flex items-center px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${tone(status.status)}`} data-testid="billing-status-pill">
                {status.status} · {status.planLabel} · {status.seats} seat{status.seats === 1 ? '' : 's'}
            </div>

            {status.expiresAt && (
                <div className="text-[10px] font-mono text-slate-400">
                    Expires: {status.expiresAt}
                    {status.status === 'grace' && status.graceRemainingDays > 0 ? ` · grace ${status.graceRemainingDays}d remaining` : ''}
                </div>
            )}

            <textarea
                data-testid="billing-license-text"
                value={licenseText}
                onChange={(event) => setLicenseText(event.target.value)}
                placeholder="Paste signed offline license JSON..."
                className="w-full min-h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-slate-100"
            />

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    data-testid="billing-activate-btn"
                    disabled={busy}
                    onClick={() => activateFromJson(licenseText)}
                    className="px-3 py-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-emerald-100 disabled:opacity-60"
                >
                    {busy ? 'Activating' : 'Activate License'}
                </button>
                <label className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.14em] font-mono text-slate-200 cursor-pointer">
                    Import License File
                    <input
                        data-testid="billing-license-file"
                        type="file"
                        accept="application/json,.json,.license"
                        className="hidden"
                        onChange={importFromFile}
                    />
                </label>
                <button
                    type="button"
                    data-testid="billing-clear-btn"
                    disabled={busy}
                    onClick={clearLicense}
                    className="px-3 py-2 rounded-lg border border-rose-300/30 bg-rose-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-rose-100 disabled:opacity-60"
                >
                    Clear License
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plans.map((plan) => (
                    <article key={plan.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                        <div className="text-[10px] font-bold text-slate-100 uppercase tracking-[0.14em]">{plan.label}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                            ${Number(plan.priceUsd || 0)} · {String(plan.billingPeriod || 'once')}
                        </div>
                        <div className="mt-1 text-[9px] text-slate-500 break-all">
                            {plan.checkout && plan.checkout.manualInvoice
                                ? String(plan.checkout.invoiceUrl || 'Manual invoice')
                                : String(plan.checkout && (plan.checkout.gumroad || plan.checkout.stripe) || 'Activation via checkout')}
                        </div>
                    </article>
                ))}
            </div>

            {message && (
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                    {message}
                </div>
            )}
        </section>
    );
}
