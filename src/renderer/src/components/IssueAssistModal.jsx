import React from 'react';

const ISSUE_TYPES = [
    { id: 'bug_report', label: 'Bug Report', template: 'bug_report.yml' },
    { id: 'proof_flow', label: 'Proof Flow Regression', template: 'proof_flow.yml' },
];

function encode(value) {
    return encodeURIComponent(String(value || ''));
}

function buildIssueBody(payload) {
    return [
        `### Source`,
        `- tier: ${payload.tier || 'unknown'}`,
        `- version: ${payload.version || 'unknown'}`,
        `- workflow: ${payload.workflowId || 'unknown'}`,
        '',
        `### Support Bundle`,
        `- path: ${payload.supportBundlePath || 'n/a'}`,
        `- sha256: ${payload.supportBundleHash || 'n/a'}`,
        '',
        `### Notes`,
        `${payload.notes || ''}`,
    ].join('\n');
}

export default function IssueAssistModal({
    open,
    onClose,
    metadata,
}) {
    const [type, setType] = React.useState(ISSUE_TYPES[0].id);
    const [notes, setNotes] = React.useState('');

    if (!open) return null;

    const selected = ISSUE_TYPES.find((item) => item.id === type) || ISSUE_TYPES[0];
    const payload = {
        ...(metadata || {}),
        notes,
    };
    const body = buildIssueBody(payload);
    const issueUrl = `https://github.com/Z3r0DayZion-install/NeuralShell/issues/new?template=${encode(selected.template)}&title=${encode(`${selected.label}: `)}&body=${encode(body)}`;

    const openIssue = async () => {
        await window.api.system.openExternal(issueUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-cyan-300/20 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Issue Assist</div>
                        <div className="text-[10px] font-mono text-slate-500">Prepare sanitized issue markdown and open GitHub issue page.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="issue-assist-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {ISSUE_TYPES.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            data-testid={`issue-assist-type-${entry.id}`}
                            onClick={() => setType(entry.id)}
                            className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                                type === entry.id
                                    ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'
                                    : 'border-white/10 bg-white/5 text-slate-300'
                            }`}
                        >
                            {entry.label}
                        </button>
                    ))}
                </div>
                <textarea
                    data-testid="issue-assist-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add reproduction notes..."
                    className="w-full min-h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-[12px] text-slate-100 font-mono"
                />
                <pre className="rounded-xl border border-white/10 bg-black/40 p-3 text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                    {body}
                </pre>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        data-testid="issue-assist-copy-btn"
                        onClick={() => navigator.clipboard.writeText(body)}
                        className="px-3 py-2 rounded border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.14em] font-mono text-slate-200"
                    >
                        Copy
                    </button>
                    <button
                        type="button"
                        data-testid="issue-assist-open-btn"
                        onClick={openIssue}
                        className="px-3 py-2 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-cyan-100"
                    >
                        Open Issue
                    </button>
                </div>
            </div>
        </div>
    );
}
