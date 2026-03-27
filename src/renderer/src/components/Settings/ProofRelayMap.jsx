import React from 'react';

function normalizeRows(mapValue) {
    const source = mapValue && typeof mapValue === 'object' ? mapValue : {};
    return Object.entries(source).map(([repo, entry]) => ({
        repo: String(repo || '').trim(),
        slackWebhook: String(entry && entry.slackWebhook ? entry.slackWebhook : ''),
        discordWebhook: String(entry && entry.discordWebhook ? entry.discordWebhook : ''),
    })).filter((row) => row.repo);
}

function mapFromRows(rows) {
    const out = {};
    for (const row of Array.isArray(rows) ? rows : []) {
        const repo = String(row && row.repo ? row.repo : '').trim();
        if (!repo) continue;
        out[repo] = {
            slackWebhook: String(row && row.slackWebhook ? row.slackWebhook : '').trim(),
            discordWebhook: String(row && row.discordWebhook ? row.discordWebhook : '').trim(),
        };
    }
    return out;
}

export default function ProofRelayMap({ licenseMode = '' }) {
    const [rows, setRows] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState('');
    const auditorMode = String(licenseMode || '').trim().toLowerCase() === 'auditor';

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const result = await window.api.proofRelay.getRepoMap();
                if (!mounted) return;
                setRows(normalizeRows(result && result.map ? result.map : {}));
            } catch (err) {
                if (!mounted) return;
                setStatus(`Repo relay map load failed: ${err && err.message ? err.message : String(err)}`);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const setRow = (index, key, value) => {
        setRows((prev) => prev.map((row, rowIndex) => (
            rowIndex === index
                ? { ...row, [key]: value }
                : row
        )));
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                repo: '',
                slackWebhook: '',
                discordWebhook: '',
            },
        ]);
    };

    const removeRow = (index) => {
        setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    };

    const saveMap = async () => {
        if (auditorMode) return;
        setBusy(true);
        try {
            const result = await window.api.proofRelay.setRepoMap({
                map: mapFromRows(rows),
            });
            setRows(normalizeRows(result && result.map ? result.map : {}));
            setStatus('Proof relay map saved to Vault+.');
        } catch (err) {
            setStatus(`Proof relay map save failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section data-testid="proof-relay-map" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">Proof Relay Mapping</div>
                    <div className="text-[11px] text-slate-400 font-mono">Assign per-repository Slack/Discord webhooks for proof bundle notifications.</div>
                </div>
                <button
                    type="button"
                    data-testid="proof-relay-map-add-row-btn"
                    onClick={addRow}
                    disabled={auditorMode}
                    className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10 disabled:opacity-50"
                >
                    Add Repo
                </button>
            </div>

            <div className="space-y-2">
                {rows.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-500">
                        No repository mappings yet.
                    </div>
                )}
                {rows.map((row, index) => (
                    <div key={`${row.repo || 'repo'}-${index}`} className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                                data-testid={`proof-relay-map-repo-${index}`}
                                value={row.repo}
                                onChange={(event) => setRow(index, 'repo', event.target.value)}
                                placeholder="repo slug (e.g. org/foo)"
                                disabled={auditorMode}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-slate-200 font-mono outline-none focus:border-cyan-400/40 disabled:opacity-60"
                            />
                            <input
                                data-testid={`proof-relay-map-slack-${index}`}
                                value={row.slackWebhook}
                                onChange={(event) => setRow(index, 'slackWebhook', event.target.value)}
                                placeholder="Slack webhook URL"
                                disabled={auditorMode}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-slate-200 font-mono outline-none focus:border-cyan-400/40 disabled:opacity-60"
                            />
                            <input
                                data-testid={`proof-relay-map-discord-${index}`}
                                value={row.discordWebhook}
                                onChange={(event) => setRow(index, 'discordWebhook', event.target.value)}
                                placeholder="Discord webhook URL"
                                disabled={auditorMode}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-slate-200 font-mono outline-none focus:border-cyan-400/40 disabled:opacity-60"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                data-testid={`proof-relay-map-remove-${index}`}
                                onClick={() => removeRow(index)}
                                disabled={auditorMode}
                                className="px-2 py-1 rounded border border-rose-300/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    data-testid="proof-relay-map-save-btn"
                    onClick={saveMap}
                    disabled={busy || auditorMode}
                    className="px-3 py-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                    {busy ? 'Saving' : 'Save Mapping'}
                </button>
                {auditorMode && (
                    <span className="text-[10px] font-mono text-amber-300">Auditor mode: relay mapping edits are disabled.</span>
                )}
            </div>

            {status && (
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                    {status}
                </div>
            )}
        </section>
    );
}

