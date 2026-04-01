import React from 'react';
import {
    aggregateConversionBundles,
    parseConversionBundle,
    readLocalOnboardingEvents,
    summarizeOnboardingEvents,
} from '../analytics/conversion.js';

function pct(numerator, denominator) {
    if (!denominator) return 0;
    return Math.round((Number(numerator || 0) / Number(denominator || 1)) * 100);
}

function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read conversion bundle.'));
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || '{}'));
                resolve(parsed);
            } catch {
                reject(new Error('Invalid conversion bundle JSON.'));
            }
        };
        reader.readAsText(file);
    });
}

export default function FunnelDashboard() {
    const [events] = React.useState(() => readLocalOnboardingEvents());
    const [imported, setImported] = React.useState([]);
    const [error, setError] = React.useState('');

    const local = React.useMemo(() => summarizeOnboardingEvents(events), [events]);
    const importedAggregate = React.useMemo(() => aggregateConversionBundles(imported), [imported]);

    const blended = React.useMemo(() => {
        const totals = importedAggregate.totals || {};
        return {
            installs: Number(totals.installs || 0),
            onboardingStarted: Math.max(Number(totals.onboardingStarted || 0), Number(local.started || 0)),
            onboardingCompleted: Math.max(Number(totals.onboardingCompleted || 0), Number(local.shareBadge || 0)),
            proofRuns: Math.max(Number(totals.proofRuns || 0), Number(local.runProof || 0)),
            shares: Math.max(Number(totals.shares || 0), Number(local.shareBadge || 0)),
            upgrades: Number(totals.upgrades || 0),
        };
    }, [importedAggregate.totals, local.runProof, local.shareBadge, local.started]);

    const steps = [
        { id: 'installs', label: 'Installs', value: blended.installs },
        { id: 'onboardingStarted', label: 'Onboarding Started', value: blended.onboardingStarted },
        { id: 'proofRuns', label: 'Proof Runs', value: blended.proofRuns },
        { id: 'shares', label: 'Shares', value: blended.shares },
        { id: 'upgrades', label: 'Upgrades', value: blended.upgrades },
    ];

    const importBundle = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const parsed = await readJsonFile(file);
            const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.bundles) ? parsed.bundles : [parsed]);
            const mapped = rows.map((row) => parseConversionBundle({ ...row, fileName: file.name }));
            setImported((prev) => [...prev, ...mapped]);
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    return (
        <section data-testid="funnel-dashboard" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Conversion Funnel</div>
                    <div className="text-[10px] text-slate-500 font-mono">Local funnel metrics + importable bundle overlays.</div>
                </div>
                <label className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.14em] font-mono text-cyan-200 cursor-pointer">
                    Import Funnel JSON
                    <input
                        data-testid="funnel-import-input"
                        type="file"
                        accept="application/json,.json,.neuralshell-metrics.json"
                        className="hidden"
                        onChange={importBundle}
                    />
                </label>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {steps.map((step, index) => {
                    const prev = index === 0 ? step.value : steps[index - 1].value;
                    return (
                        <div key={step.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">{step.label}</div>
                            <div className="text-[14px] text-slate-100 font-bold">{Number(step.value || 0).toLocaleString()}</div>
                            {index > 0 && (
                                <div className="text-[9px] font-mono text-cyan-300">{pct(step.value, prev)}%</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-400">
                Local onboarding events: started {local.started}, provider sweep {local.providerSweep}, vault save {local.vaultSave}, proof {local.runProof}, share {local.shareBadge}.
            </div>
        </section>
    );
}
