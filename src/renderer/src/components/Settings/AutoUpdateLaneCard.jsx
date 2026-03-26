import React from 'react';

export default function AutoUpdateLaneCard({ licenseMode = '' }) {
    const [policy, setPolicy] = React.useState({ enabled: false, channel: 'stable', available: false });
    const [pending, setPending] = React.useState({ pending: false, available: false });
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState('');

    const auditorMode = String(licenseMode || '').trim().toLowerCase() === 'auditor';

    const refresh = React.useCallback(async () => {
        try {
            const [nextPolicy, nextPending] = await Promise.all([
                window.api.autoUpdate.getPolicy(),
                window.api.autoUpdate.pending(),
            ]);
            setPolicy(nextPolicy || { enabled: false, channel: 'stable', available: false });
            setPending(nextPending || { pending: false, available: false });
        } catch (err) {
            setStatus(`Auto-update status load failed: ${err && err.message ? err.message : String(err)}`);
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const setEnabled = async (enabled) => {
        if (auditorMode) return;
        setBusy(true);
        try {
            const next = await window.api.autoUpdate.setPolicy({ enabled, channel: policy.channel || 'stable' });
            setPolicy(next || policy);
            setStatus(enabled ? 'Auto-update lane enabled.' : 'Auto-update lane disabled.');
        } catch (err) {
            setStatus(`Auto-update toggle failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    const setChannel = async (channel) => {
        if (auditorMode) return;
        setBusy(true);
        try {
            const next = await window.api.autoUpdate.setPolicy({ enabled: policy.enabled, channel });
            setPolicy(next || policy);
            setStatus(`Auto-update channel set to ${channel}.`);
        } catch (err) {
            setStatus(`Auto-update channel update failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section data-testid="auto-update-card" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">Deterministic Auto-Update</div>
                    <div className="text-[11px] text-slate-400 font-mono">Verified SHA-256 + signature lane with staged swap-on-restart behavior.</div>
                </div>
                <button
                    type="button"
                    data-testid="auto-update-toggle-btn"
                    onClick={() => setEnabled(!policy.enabled)}
                    disabled={busy || auditorMode || !policy.available}
                    className={`h-8 min-w-20 rounded-lg border px-3 text-[10px] uppercase tracking-[0.16em] font-bold transition-colors ${policy.enabled ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100' : 'border-slate-500/30 bg-slate-700/20 text-slate-300'} disabled:opacity-60`}
                >
                    {policy.enabled ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold">Channel</label>
                <select
                    data-testid="auto-update-channel"
                    value={String(policy.channel || 'stable')}
                    onChange={(e) => setChannel(e.target.value)}
                    disabled={busy || auditorMode || !policy.available}
                    className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-[11px] text-slate-200 font-mono"
                >
                    <option value="stable">stable</option>
                    <option value="canary">canary</option>
                </select>
                <button
                    type="button"
                    onClick={refresh}
                    disabled={busy}
                    className="px-2 py-1 rounded border border-white/10 text-[10px] font-mono text-slate-300 hover:bg-white/10 disabled:opacity-60"
                >
                    Refresh
                </button>
            </div>

            <div className={`rounded-xl border px-3 py-2 text-[10px] font-mono ${pending.pending ? 'border-amber-300/30 bg-amber-500/10 text-amber-200' : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-200'}`}>
                {pending.pending ? 'Pending verified swap is queued for next restart.' : 'No pending swap queued.'}
            </div>

            {auditorMode && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-mono text-amber-200">
                    Auditor mode is active; auto-update lane is forced to read-only.
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
