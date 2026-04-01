import React from 'react';
import {
    downloadJson,
    downloadText,
    parseStructuredRecords,
    readTextFile,
    toDateString,
    toSafeNumber,
} from '../utils/recordIO.js';

const STORAGE_KEY = 'neuralshell_board_console_v1';

function loadSnapshots() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeSnapshot(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    return {
        month: String(payload.month || toDateString(payload.date || new Date().toISOString(), new Date().toISOString().slice(0, 7))).slice(0, 7),
        installs: toSafeNumber(payload.installs, 0),
        activations: toSafeNumber(payload.activations, 0),
        retained30d: toSafeNumber(payload.retained30d || payload.retention, 0),
        revenueUsd: toSafeNumber(payload.revenueUsd || payload.revenue, 0),
        proofRuns: toSafeNumber(payload.proofRuns, 0),
        partnerGrowth: toSafeNumber(payload.partnerGrowth || payload.partnerAdds, 0),
        compliancePosture: String(payload.compliancePosture || payload.compliance || 'stable').trim().toLowerCase(),
        source: String(payload.source || 'import').trim(),
    };
}

function computeDelta(current, previous, key) {
    const currentValue = toSafeNumber(current && current[key], 0);
    const previousValue = toSafeNumber(previous && previous[key], 0);
    return currentValue - previousValue;
}

function buildBoardMarkdown(current, previous) {
    if (!current) return 'No board snapshot available.';
    const installDelta = computeDelta(current, previous, 'installs');
    const activationDelta = computeDelta(current, previous, 'activations');
    const revenueDelta = computeDelta(current, previous, 'revenueUsd');
    const proofDelta = computeDelta(current, previous, 'proofRuns');
    const partnerDelta = computeDelta(current, previous, 'partnerGrowth');
    return [
        `# NeuralShell Board Pack - ${current.month}`,
        '',
        '## Operating Summary',
        `- Installs: ${current.installs.toLocaleString()} (${installDelta >= 0 ? '+' : ''}${installDelta.toLocaleString()} vs previous)`,
        `- Activations: ${current.activations.toLocaleString()} (${activationDelta >= 0 ? '+' : ''}${activationDelta.toLocaleString()} vs previous)`,
        `- Revenue: $${current.revenueUsd.toLocaleString()} (${revenueDelta >= 0 ? '+' : ''}$${revenueDelta.toLocaleString()} vs previous)`,
        `- Proof Runs: ${current.proofRuns.toLocaleString()} (${proofDelta >= 0 ? '+' : ''}${proofDelta.toLocaleString()} vs previous)`,
        `- Partner Growth: ${current.partnerGrowth.toLocaleString()} (${partnerDelta >= 0 ? '+' : ''}${partnerDelta.toLocaleString()} vs previous)`,
        '',
        '## Retention / Compliance',
        `- 30d Retained Accounts: ${current.retained30d.toLocaleString()}`,
        `- Compliance Posture: ${current.compliancePosture}`,
        '',
        '## Founder Notes',
        '- Confirm top two pilot expansions from Customer Success risk list.',
        '- Validate policy enforcement snapshots before enterprise renewal calls.',
        '- Align partner incentives with highest-conversion pilot verticals.',
    ].join('\n');
}

export default function BoardConsole() {
    const [snapshots, setSnapshots] = React.useState(() => loadSnapshots().map((item) => normalizeSnapshot(item)));
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    }, [snapshots]);

    const sortedSnapshots = React.useMemo(
        () => [...snapshots].sort((a, b) => String(a.month || '').localeCompare(String(b.month || ''))),
        [snapshots],
    );
    const current = sortedSnapshots.length ? sortedSnapshots[sortedSnapshots.length - 1] : null;
    const previous = sortedSnapshots.length > 1 ? sortedSnapshots[sortedSnapshots.length - 2] : null;
    const markdown = React.useMemo(() => buildBoardMarkdown(current, previous), [current, previous]);

    const importSnapshot = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const rows = parseStructuredRecords(text, file.name).map((row) => normalizeSnapshot({ ...row, source: file.name }));
            setSnapshots((prev) => {
                const byMonth = new Map(prev.map((item) => [item.month, item]));
                rows.forEach((row) => byMonth.set(row.month, row));
                return Array.from(byMonth.values());
            });
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    return (
        <section data-testid="board-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Investor / Board Reporting Pack</div>
                    <div className="text-[10px] text-slate-500 font-mono">Monthly operating snapshot with deltas from previous export and local metrics imports.</div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200 cursor-pointer">
                        Import Metrics Bundle
                        <input
                            type="file"
                            accept=".csv,.json,application/json"
                            className="hidden"
                            data-testid="board-console-import-input"
                            onChange={importSnapshot}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="board-console-export-markdown-btn"
                        onClick={() => downloadText(`neuralshell_board_pack_${Date.now()}.md`, markdown)}
                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                    >
                        Export Markdown
                    </button>
                    <button
                        type="button"
                        data-testid="board-console-export-json-btn"
                        onClick={() => downloadJson(`neuralshell_board_pack_${Date.now()}.json`, {
                            exportedAt: new Date().toISOString(),
                            current,
                            previous,
                            markdown,
                            snapshots: sortedSnapshots,
                        })}
                        className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                    >
                        Export JSON
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Current Month</div>
                    <div className="text-[14px] font-bold text-slate-100">{current ? current.month : 'N/A'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Revenue</div>
                    <div className="text-[14px] font-bold text-emerald-100">${current ? current.revenueUsd.toLocaleString() : '0'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Delta vs Prev</div>
                    <div className="text-[14px] font-bold text-cyan-100">
                        {current && previous
                            ? `${computeDelta(current, previous, 'revenueUsd') >= 0 ? '+' : ''}$${computeDelta(current, previous, 'revenueUsd').toLocaleString()}`
                            : 'N/A'}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500 mb-2">Board Draft</div>
                <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{markdown}</pre>
            </div>
        </section>
    );
}

