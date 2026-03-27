import React from 'react';

export default function ProofRelayToggle({ licenseMode = '' }) {
    const [enabled, setEnabled] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState('');

    const auditorMode = String(licenseMode || '').trim().toLowerCase() === 'auditor';

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const config = await window.api.proofRelay.getConfig();
                if (!mounted) return;
                setEnabled(Boolean(config && config.enabled));
            } catch (err) {
                if (!mounted) return;
                setStatus(`Proof relay config load failed: ${err && err.message ? err.message : String(err)}`);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const toggleRelay = async () => {
        if (auditorMode) return;
        setBusy(true);
        try {
            const result = await window.api.proofRelay.setConfig({ enabled: !enabled, channel: 'auto' });
            setEnabled(Boolean(result && result.enabled));
            setStatus(result && result.enabled ? 'Proof relay enabled.' : 'Proof relay disabled.');
        } catch (err) {
            setStatus(`Proof relay update failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section data-testid="proof-relay-toggle" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Proof Relay Webhook</div>
                    <div className="text-[11px] text-slate-400 font-mono">When enabled, a successful `npm run proof:bundle` posts repo/tag/SHA/manifest to Slack/Discord.</div>
                </div>
                <button
                    type="button"
                    data-testid="proof-relay-toggle-btn"
                    onClick={toggleRelay}
                    disabled={busy || auditorMode}
                    className={`h-8 min-w-20 rounded-lg border px-3 text-[10px] uppercase tracking-[0.16em] font-bold transition-colors ${enabled ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100' : 'border-slate-500/30 bg-slate-700/20 text-slate-300'} disabled:opacity-60`}
                >
                    {enabled ? 'ON' : 'OFF'}
                </button>
            </div>
            {auditorMode && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-mono text-amber-200">
                    Auditor mode is active; proof relay is forced off.
                </div>
            )}
            {status && (
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                    {status}
                </div>
            )}
        </section>
    );
}

