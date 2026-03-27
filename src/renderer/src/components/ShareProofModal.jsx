import React from 'react';
import { buildShareUrl, createShareEnvelope } from '../utils/share.ts';
import LazyImage from './LazyImage';

function normalizeHex(value) {
    const trimmed = String(value || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const [r, g, b] = trimmed.slice(1).split('');
        return `#${r}${r}${g}${g}${b}${b}`;
    }
    return '#22d3ee';
}

function drawProofImage(payload, accentHex = '#22d3ee') {
    const accent = normalizeHex(accentHex);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas context unavailable.');
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = `${accent}99`;
    ctx.lineWidth = 3;
    ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);

    ctx.fillStyle = accent;
    ctx.font = '700 28px monospace';
    ctx.fillText('NeuralShell Sweep Proof', 64, 90);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 22px monospace';
    ctx.fillText(`Provider: ${String(payload.provider || 'unknown')}`, 64, 170);
    ctx.fillText(`Model: ${String(payload.model || 'unknown')}`, 64, 220);
    ctx.fillText(`Models Detected: ${Number(payload.modelCount || 0)}`, 64, 270);
    ctx.fillText(`Generated: ${new Date().toISOString()}`, 64, 320);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px monospace';
    ctx.fillText('Verification lane: Bridge test passed, share route minted.', 64, 390);

    ctx.fillStyle = `${accent}2E`;
    ctx.fillRect(64, 440, canvas.width - 128, 120);
    ctx.fillStyle = accent;
    ctx.font = '700 24px monospace';
    ctx.fillText('Top-Notch Proof Artifact', 84, 510);

    return canvas.toDataURL('image/png');
}

function downloadDataUrl(filename, dataUrl) {
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

export default function ShareProofModal({ open, payload, onClose }) {
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState('');
    const [previewSrc, setPreviewSrc] = React.useState('');
    const [shareUrl, setShareUrl] = React.useState('');

    React.useEffect(() => {
        if (!open || !payload) return;
        setPreviewSrc('');
        setShareUrl('');
        setStatus('');
        let active = true;

        (async () => {
            try {
                const envelope = await createShareEnvelope({
                    app: 'NeuralShell',
                    generatedAt: new Date().toISOString(),
                    messages: [
                        {
                            role: 'assistant',
                            content: [
                                'Bridge Sweep Success',
                                `Provider: ${String(payload.provider || 'unknown')}`,
                                `Model: ${String(payload.model || 'unknown')}`,
                                `Models Detected: ${Number(payload.modelCount || 0)}`,
                            ].join('\n'),
                        },
                    ],
                });
                if (!active) return;
                const accent = window.getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#22d3ee';
                setShareUrl(buildShareUrl(envelope.hash, envelope.fragment));
                setPreviewSrc(drawProofImage(payload, accent));
            } catch (err) {
                if (!active) return;
                setStatus(`Proof share prep failed: ${err && err.message ? err.message : String(err)}`);
            }
        })();

        return () => {
            active = false;
        };
    }, [open, payload]);

    if (!open) return null;

    const handleShare = async () => {
        if (!previewSrc || !shareUrl) return;
        setBusy(true);
        try {
            downloadDataUrl(`neuralshell-proof-${Date.now()}.png`, previewSrc);
            await navigator.clipboard.writeText(shareUrl);
            setStatus('PNG downloaded and /share link copied to clipboard.');
        } catch (err) {
            setStatus(`Share failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-cyan-400/20 bg-slate-950 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold">Share Proof Badge</div>
                        <div className="text-[11px] text-slate-400 font-mono">Preview then share a generated PNG + `/share/&lt;hash&gt;` link.</div>
                    </div>
                    <button type="button" onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">✕</button>
                </div>

                {previewSrc ? (
                    <LazyImage src={previewSrc} alt="Proof preview" className="w-full rounded-xl border border-white/10 min-h-52" placeholderClassName="rounded-xl" />
                ) : (
                    <div className="h-52 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center text-[11px] font-mono text-slate-500">
                        Preparing badge preview...
                    </div>
                )}

                {shareUrl && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300 break-all">
                        {shareUrl}
                    </div>
                )}

                <div className="mt-4 flex items-center gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-white/10 text-[10px] uppercase tracking-[0.14em] font-bold text-slate-300">Close</button>
                    <button
                        type="button"
                        data-testid="share-proof-btn"
                        onClick={handleShare}
                        disabled={busy || !previewSrc || !shareUrl}
                        className="px-3 py-2 rounded-lg border text-[10px] uppercase tracking-[0.14em] font-bold disabled:opacity-50"
                        style={{
                            borderColor: 'rgb(var(--accent-rgb) / 0.38)',
                            backgroundColor: 'rgb(var(--accent-rgb) / 0.14)',
                            color: 'var(--accent)',
                        }}
                    >
                        Share
                    </button>
                </div>

                {status && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
