import React from 'react';

function buildCapturePayload({
    workflowId,
    tierLabel,
    beforeMinutes,
    afterMinutes,
    notes,
}) {
    const before = Number(beforeMinutes) || 0;
    const after = Number(afterMinutes) || 0;
    const delta = Math.max(0, before - after);
    return {
        exportedAt: new Date().toISOString(),
        anonymized: true,
        workflowId: String(workflowId || ''),
        tier: String(tierLabel || 'unknown'),
        metrics: {
            beforeMinutes,
            afterMinutes,
            reclaimedMinutes: delta,
        },
        notes: String(notes || '').trim(),
        screenshotChecklist: [
            'proof_output',
            'roi_output',
            'lock_flow',
            'unlock_restored',
        ],
    };
}

function downloadJson(filename, payload) {
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
}

export default function SuccessCaptureModal({
    open,
    onClose,
    workflowId,
    tierLabel,
}) {
    const [beforeMinutes, setBeforeMinutes] = React.useState('45');
    const [afterMinutes, setAfterMinutes] = React.useState('10');
    const [notes, setNotes] = React.useState('');
    const [status, setStatus] = React.useState('');

    if (!open) return null;

    const exportCapture = () => {
        const payload = buildCapturePayload({
            workflowId,
            tierLabel,
            beforeMinutes,
            afterMinutes,
            notes,
        });
        downloadJson(`neuralshell_case_study_${Date.now()}.json`, payload);
        setStatus('Anonymized success capture exported.');
    };

    return (
        <div className="fixed inset-0 z-[145] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-emerald-300/20 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-bold">Case Study Capture</div>
                        <div className="text-[10px] font-mono text-slate-500">
                            Export anonymized before/after metrics and screenshot checklist.
                        </div>
                    </div>
                    <button
                        type="button"
                        data-testid="success-capture-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-[10px] font-mono text-slate-300">
                        Before (minutes/day)
                        <input
                            data-testid="success-capture-before"
                            value={beforeMinutes}
                            onChange={(event) => setBeforeMinutes(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-slate-100"
                        />
                    </label>
                    <label className="text-[10px] font-mono text-slate-300">
                        After (minutes/day)
                        <input
                            data-testid="success-capture-after"
                            value={afterMinutes}
                            onChange={(event) => setAfterMinutes(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-slate-100"
                        />
                    </label>
                </div>

                <label className="text-[10px] font-mono text-slate-300 block">
                    Notes (optional)
                    <textarea
                        data-testid="success-capture-notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Short anonymized context for marketing review..."
                        className="mt-1 w-full min-h-20 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-slate-100"
                    />
                </label>

                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-400">
                    Workflow: {String(workflowId || 'unknown')} · Tier: {String(tierLabel || 'unknown')}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        data-testid="success-capture-export-btn"
                        onClick={exportCapture}
                        className="px-3 py-2 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-emerald-100"
                    >
                        Export Capture Bundle
                    </button>
                </div>

                {status && (
                    <div className="text-[10px] font-mono text-emerald-200">{status}</div>
                )}
            </div>
        </div>
    );
}
