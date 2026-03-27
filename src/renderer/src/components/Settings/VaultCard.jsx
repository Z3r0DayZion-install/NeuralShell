import React from 'react';

function downloadJson(filename, data) {
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(href);
}

export default function VaultCard() {
    const [passphrase, setPassphrase] = React.useState('');
    const [importJson, setImportJson] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState({ tone: 'idle', text: '' });

    const handleLock = async () => {
        setBusy(true);
        try {
            await window.api.vault.lock();
            setStatus({ tone: 'ok', text: 'Vault locked.' });
        } catch (err) {
            setStatus({ tone: 'bad', text: `Vault lock failed: ${err && err.message ? err.message : String(err)}` });
        } finally {
            setBusy(false);
        }
    };

    const handleUnlock = async () => {
        setBusy(true);
        try {
            await window.api.vault.unlock(passphrase);
            setStatus({ tone: 'ok', text: 'Vault unlocked.' });
        } catch (err) {
            setStatus({ tone: 'bad', text: `Vault unlock failed: ${err && err.message ? err.message : String(err)}` });
        } finally {
            setBusy(false);
        }
    };

    const handleExport = async () => {
        setBusy(true);
        try {
            const result = await window.api.vault.export(passphrase);
            if (!result || !result.ok || !result.blob) {
                throw new Error('Vault export returned no blob payload.');
            }
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadJson(`neuralshell-vault-${stamp}.json`, result.blob);
            setStatus({ tone: 'ok', text: `Vault exported (${Number(result.count) || 0} entries).` });
        } catch (err) {
            setStatus({ tone: 'bad', text: `Vault export failed: ${err && err.message ? err.message : String(err)}` });
        } finally {
            setBusy(false);
        }
    };

    const handleImport = async () => {
        setBusy(true);
        try {
            const parsed = JSON.parse(String(importJson || '{}'));
            const result = await window.api.vault.import(parsed, passphrase, { mode: 'merge' });
            if (!result || !result.ok) {
                throw new Error('Vault import failed.');
            }
            setStatus({ tone: 'ok', text: `Vault imported (${Number(result.imported) || 0} entries).` });
        } catch (err) {
            setStatus({ tone: 'bad', text: `Vault import failed: ${err && err.message ? err.message : String(err)}` });
        } finally {
            setBusy(false);
        }
    };

    return (
        <section data-testid="vault-card" className="space-y-4 p-5 bg-black/30 rounded-2xl border border-cyan-400/20 shadow-inner">
            <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Vault+</div>
            <div className="text-[11px] text-slate-400 font-mono">Provider secrets are encrypted at rest and exported/imported as AES-GCM JSON blobs.</div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Vault Passphrase</label>
                <input
                    data-testid="vault-passphrase-input"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Required for unlock / export / import"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    data-testid="vault-unlock-btn"
                    type="button"
                    onClick={handleUnlock}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                    Unlock Vault
                </button>
                <button
                    data-testid="vault-lock-btn"
                    type="button"
                    onClick={handleLock}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl border border-amber-300/30 bg-amber-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                >
                    Lock Vault
                </button>
                <button
                    data-testid="vault-export-btn"
                    type="button"
                    onClick={handleExport}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                    Export Vault
                </button>
                <button
                    data-testid="vault-import-btn"
                    type="button"
                    onClick={handleImport}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl border border-violet-300/30 bg-violet-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-50"
                >
                    Import Vault
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold ml-1">Import JSON Blob</label>
                <textarea
                    data-testid="vault-import-json"
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder="Paste vault export JSON blob here"
                    className="min-h-24 w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/10 transition-all font-mono resize-y"
                />
            </div>

            {status.text && (
                <div className={`rounded-xl border px-3 py-2 text-[10px] font-mono ${status.tone === 'ok' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : status.tone === 'bad' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-white/10 bg-black/30 text-slate-300'}`}>
                    {status.text}
                </div>
            )}
        </section>
    );
}
