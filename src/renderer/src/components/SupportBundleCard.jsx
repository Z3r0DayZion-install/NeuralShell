import React from 'react';

export default function SupportBundleCard() {
    const [busy, setBusy] = React.useState(false);
    const [includeUserText, setIncludeUserText] = React.useState(false);
    const [status, setStatus] = React.useState('');

    const runExport = async () => {
        setBusy(true);
        setStatus('');
        try {
            const payload = window.api && window.api.support && typeof window.api.support.exportBundle === 'function'
                ? await window.api.support.exportBundle({
                    includeUserText: Boolean(includeUserText),
                })
                : await window.api.invoke('support:exportBundle', {
                    includeUserText: Boolean(includeUserText),
                });
            if (payload && payload.ok) {
                setStatus(`Bundle exported: ${payload.outputPath}`);
                window.dispatchEvent(new window.CustomEvent('neuralshell:support-bundle-exported', {
                    detail: {
                        outputPath: String(payload.outputPath || ''),
                        sha256: String(payload.sha256 || ''),
                    },
                }));
            } else {
                setStatus('Bundle export failed.');
            }
        } catch (err) {
            setStatus(`Export failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section data-testid="support-bundle-card">
            <div className="text-[10px] uppercase tracking-widest text-amber-300 mb-4 font-bold">Support Bundle</div>
            <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                <div className="text-[10px] text-slate-500 font-mono">
                    Export sanitized diagnostics bundle (ZIP + SHA-256). Secrets are redacted by default.
                </div>
                <label className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                    <input
                        data-testid="support-bundle-include-user-text"
                        type="checkbox"
                        checked={includeUserText}
                        onChange={(event) => setIncludeUserText(event.target.checked)}
                    />
                    Include user text (not recommended)
                </label>
                <button
                    type="button"
                    data-testid="support-bundle-export-btn"
                    disabled={busy}
                    onClick={runExport}
                    className="px-3 py-2 rounded-xl border border-amber-300/30 bg-amber-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                >
                    {busy ? 'Exporting' : 'Export Support Bundle'}
                </button>
                {status && (
                    <div className="text-[10px] font-mono text-slate-300 break-all">
                        {status}
                    </div>
                )}
            </div>
        </section>
    );
}
